import { useState, useEffect } from "react";

export function useOffline() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Sync offline data when coming back online
      syncOfflineData();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncOfflineData = async () => {
    try {
      // Get offline data from IndexedDB
      const { getOfflineTransactions, clearOfflineTransactions } = await import("@/lib/offline-storage");
      const offlineTransactions = await getOfflineTransactions();
      
      // Sync each transaction
      for (const transaction of offlineTransactions) {
        try {
          await fetch("/api/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(transaction),
          });
        } catch (error) {
          console.error("Failed to sync transaction:", error);
          // Keep failed transactions for retry
          continue;
        }
      }
      
      // Clear successfully synced transactions
      await clearOfflineTransactions();
      
      console.log(`Synced ${offlineTransactions.length} offline transactions`);
    } catch (error) {
      console.error("Failed to sync offline data:", error);
    }
  };

  return { isOffline, syncOfflineData };
}
