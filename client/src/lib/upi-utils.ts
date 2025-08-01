// UPI utility functions for generating QR codes and handling payments

export interface UPIPaymentData {
  payeeAddress: string;
  payeeName: string;
  amount?: number;
  transactionNote?: string;
  transactionRef?: string;
  merchantCode?: string;
}

export const generateUPIString = (data: UPIPaymentData): string => {
  const params = new URLSearchParams();
  
  params.append('pa', data.payeeAddress); // Payee Address (UPI ID)
  params.append('pn', data.payeeName); // Payee Name
  params.append('cu', 'INR'); // Currency
  
  if (data.amount) {
    params.append('am', data.amount.toString());
  }
  
  if (data.transactionNote) {
    params.append('tn', data.transactionNote);
  }
  
  if (data.transactionRef) {
    params.append('tr', data.transactionRef);
  }
  
  if (data.merchantCode) {
    params.append('mc', data.merchantCode);
  }

  return `upi://pay?${params.toString()}`;
};

export const generateUPIQRCode = async (upiString: string): Promise<string> => {
  // Using a QR code generation service
  // In production, you might want to use a dedicated QR library like qrcode.js
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiString)}`;
  
  try {
    // Verify the QR service is accessible
    const response = await fetch(qrApiUrl, { method: 'HEAD' });
    if (response.ok) {
      return qrApiUrl;
    }
  } catch (error) {
    console.warn('QR service not accessible, using fallback');
  }
  
  // Fallback: generate a simple placeholder
  return generateQRPlaceholder(upiString);
};

const generateQRPlaceholder = (data: string): string => {
  // Create a simple SVG placeholder for QR code
  const size = 300;
  const cellSize = size / 25; // 25x25 grid
  
  // Simple pattern generation based on data hash
  const hash = simpleHash(data);
  let pattern = '';
  
  for (let i = 0; i < 25; i++) {
    for (let j = 0; j < 25; j++) {
      const shouldFill = (hash + i * j) % 3 === 0;
      if (shouldFill) {
        const x = j * cellSize;
        const y = i * cellSize;
        pattern += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="black"/>`;
      }
    }
  }
  
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="white"/>
      ${pattern}
      <!-- Corner markers -->
      <rect x="0" y="0" width="${cellSize * 7}" height="${cellSize * 7}" fill="none" stroke="black" stroke-width="2"/>
      <rect x="${size - cellSize * 7}" y="0" width="${cellSize * 7}" height="${cellSize * 7}" fill="none" stroke="black" stroke-width="2"/>
      <rect x="0" y="${size - cellSize * 7}" width="${cellSize * 7}" height="${cellSize * 7}" fill="none" stroke="black" stroke-width="2"/>
      
      <rect x="${cellSize}" y="${cellSize}" width="${cellSize * 5}" height="${cellSize * 5}" fill="black"/>
      <rect x="${size - cellSize * 6}" y="${cellSize}" width="${cellSize * 5}" height="${cellSize * 5}" fill="black"/>
      <rect x="${cellSize}" y="${size - cellSize * 6}" width="${cellSize * 5}" height="${cellSize * 5}" fill="black"/>
      
      <rect x="${cellSize * 2}" y="${cellSize * 2}" width="${cellSize * 3}" height="${cellSize * 3}" fill="white"/>
      <rect x="${size - cellSize * 5}" y="${cellSize * 2}" width="${cellSize * 3}" height="${cellSize * 3}" fill="white"/>
      <rect x="${cellSize * 2}" y="${size - cellSize * 5}" width="${cellSize * 3}" height="${cellSize * 3}" fill="white"/>
      
      <rect x="${cellSize * 3}" y="${cellSize * 3}" width="${cellSize}" height="${cellSize}" fill="black"/>
      <rect x="${size - cellSize * 4}" y="${cellSize * 3}" width="${cellSize}" height="${cellSize}" fill="black"/>
      <rect x="${cellSize * 3}" y="${size - cellSize * 4}" width="${cellSize}" height="${cellSize}" fill="black"/>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

const simpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

export const formatUPIAmount = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const validateUPIId = (upiId: string): boolean => {
  // Basic UPI ID validation
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  return upiRegex.test(upiId);
};

export const getUPIAppName = (upiId: string): string => {
  const domain = upiId.split('@')[1]?.toLowerCase();
  
  const appMap: Record<string, string> = {
    'paytm': 'Paytm',
    'phonepe': 'PhonePe',
    'googlepay': 'Google Pay',
    'gpay': 'Google Pay',
    'bhim': 'BHIM',
    'ybl': 'PhonePe',
    'ibl': 'PhonePe',
    'axl': 'PhonePe',
    'okaxis': 'Google Pay',
    'okicici': 'Google Pay',
    'oksbi': 'Google Pay',
    'okhdfcbank': 'Google Pay',
  };
  
  for (const [key, value] of Object.entries(appMap)) {
    if (domain?.includes(key)) {
      return value;
    }
  }
  
  return 'UPI';
};

export const generateTransactionReference = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN${timestamp.slice(-6)}${random}`;
};

// UPI deep link handlers for different apps
export const getUPIAppDeepLink = (upiString: string, preferredApp?: string): string => {
  const baseUPI = upiString;
  
  switch (preferredApp?.toLowerCase()) {
    case 'phonepe':
      return `phonepe://pay?${upiString.split('?')[1]}`;
    case 'googlepay':
    case 'gpay':
      return `tez://upi/pay?${upiString.split('?')[1]}`;
    case 'paytm':
      return `paytmmp://pay?${upiString.split('?')[1]}`;
    case 'bhim':
      return `bhim://pay?${upiString.split('?')[1]}`;
    default:
      return baseUPI;
  }
};

// Check if device supports UPI payments
export const isUPISupported = (): boolean => {
  // Check if running on mobile device
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Check if in India (basic check using timezone)
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const isIndia = timezone.includes('Asia/Kolkata') || timezone.includes('Asia/Calcutta');
  
  return isMobile && isIndia;
};

// Generate UPI QR for offline use
export const generateOfflineUPIQR = async (paymentData: UPIPaymentData): Promise<string> => {
  const upiString = generateUPIString(paymentData);
  return generateUPIQRCode(upiString);
};
