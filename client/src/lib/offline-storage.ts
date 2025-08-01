// IndexedDB utilities for offline storage

const DB_NAME = "RetailSahayakDB";
const DB_VERSION = 1;
const TRANSACTIONS_STORE = "offline_transactions";
const PRODUCTS_STORE = "products_cache";
const CUSTOMERS_STORE = "customers_cache";

interface OfflineTransaction {
  id: string;
  type: string;
  amount: string;
  paymentMethod: string;
  upiApp?: string;
  description?: string;
  timestamp: number;
  synced: boolean;
}

let dbInstance: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create offline transactions store
      if (!db.objectStoreNames.contains(TRANSACTIONS_STORE)) {
        const transactionStore = db.createObjectStore(TRANSACTIONS_STORE, { keyPath: "id" });
        transactionStore.createIndex("timestamp", "timestamp", { unique: false });
        transactionStore.createIndex("synced", "synced", { unique: false });
      }

      // Create products cache store
      if (!db.objectStoreNames.contains(PRODUCTS_STORE)) {
        const productStore = db.createObjectStore(PRODUCTS_STORE, { keyPath: "id" });
        productStore.createIndex("name", "name", { unique: false });
      }

      // Create customers cache store
      if (!db.objectStoreNames.contains(CUSTOMERS_STORE)) {
        const customerStore = db.createObjectStore(CUSTOMERS_STORE, { keyPath: "id" });
        customerStore.createIndex("phone", "phone", { unique: false });
      }
    };
  });
};

// Transaction functions
export const saveOfflineTransaction = async (transaction: Omit<OfflineTransaction, "id" | "timestamp" | "synced">): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction([TRANSACTIONS_STORE], "readwrite");
  const store = tx.objectStore(TRANSACTIONS_STORE);

  const offlineTransaction: OfflineTransaction = {
    ...transaction,
    id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    synced: false,
  };

  await store.add(offlineTransaction);
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getOfflineTransactions = async (): Promise<OfflineTransaction[]> => {
  const db = await openDB();
  const tx = db.transaction([TRANSACTIONS_STORE], "readonly");
  const store = tx.objectStore(TRANSACTIONS_STORE);
  const index = store.index("synced");

  return new Promise((resolve, reject) => {
    const request = index.getAll(IDBKeyRange.only(false)); // Get unsynced transactions
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export const markTransactionSynced = async (transactionId: string): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction([TRANSACTIONS_STORE], "readwrite");
  const store = tx.objectStore(TRANSACTIONS_STORE);

  return new Promise<void>((resolve, reject) => {
    const getRequest = store.get(transactionId);
    getRequest.onsuccess = () => {
      const transaction = getRequest.result;
      if (transaction) {
        transaction.synced = true;
        const putRequest = store.put(transaction);
        putRequest.onsuccess = () => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

export const clearOfflineTransactions = async (): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction([TRANSACTIONS_STORE], "readwrite");
  const store = tx.objectStore(TRANSACTIONS_STORE);
  const index = store.index("synced");

  return new Promise<void>((resolve, reject) => {
    const request = index.openCursor(IDBKeyRange.only(true));
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        cursor.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// Product cache functions
export const cacheProducts = async (products: any[]): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction([PRODUCTS_STORE], "readwrite");
  const store = tx.objectStore(PRODUCTS_STORE);

  await store.clear();
  for (const product of products) {
    await store.add(product);
  }
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getCachedProducts = async (): Promise<any[]> => {
  const db = await openDB();
  const tx = db.transaction([PRODUCTS_STORE], "readonly");
  const store = tx.objectStore(PRODUCTS_STORE);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

// Customer cache functions
export const cacheCustomers = async (customers: any[]): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction([CUSTOMERS_STORE], "readwrite");
  const store = tx.objectStore(CUSTOMERS_STORE);

  await store.clear();
  for (const customer of customers) {
    await store.add(customer);
  }
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getCachedCustomers = async (): Promise<any[]> => {
  const db = await openDB();
  const tx = db.transaction([CUSTOMERS_STORE], "readonly");
  const store = tx.objectStore(CUSTOMERS_STORE);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

// Utility function to check if offline storage is available
export const isOfflineStorageAvailable = (): boolean => {
  return "indexedDB" in window;
};

// Get storage usage statistics
export const getStorageStats = async (): Promise<{ used: number; available: number }> => {
  if ("storage" in navigator && "estimate" in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      available: estimate.quota || 0,
    };
  }
  return { used: 0, available: 0 };
};
