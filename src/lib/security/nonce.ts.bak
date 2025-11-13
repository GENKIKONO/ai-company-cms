export function generateNonce(): string {
  // Edge Runtime対応
  if (typeof window !== 'undefined' || typeof globalThis.crypto !== 'undefined') {
    // ブラウザ環境 or Edge Runtime
    const array = new Uint8Array(16);
    const cryptoAPI = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
    cryptoAPI.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }
  
  // Node.js環境
  const crypto = require('crypto');
  return crypto.randomBytes(16).toString('base64');
}

export function createCSRFToken(sessionId: string): string {
  // Edge Runtime対応
  if (typeof window !== 'undefined') {
    throw new Error('CSRF token creation not available in browser');
  }
  
  const crypto = require('crypto');
  return crypto
    .createHmac('sha256', process.env.CSRF_SECRET || 'default-secret')
    .update(sessionId)
    .digest('hex');
}