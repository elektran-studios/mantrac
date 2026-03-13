import CryptoJS from 'crypto-js';

export function md5Hash(text: string): string {
  return CryptoJS.MD5(text).toString();
}

export function getBrowserInfo(): string {
  if (typeof window === 'undefined') return 'Unknown';
  
  const userAgent = window.navigator.userAgent;
  const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/?([\d.]+)/);
  
  if (browserMatch) {
    return `${browserMatch[1]}/${browserMatch[2]}`;
  }
  
  return 'Unknown';
}
