import CryptoJS from 'crypto-js';

export const generateCodeVerifier = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
};

export const generateCodeChallenge = (codeVerifier: string): string => {
  const hash = CryptoJS.SHA256(codeVerifier);
  return base64URLEncode(hash.words);
};

const base64URLEncode = (buffer: Uint8Array | number[]): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

export const storePKCEParams = (codeVerifier: string, codeChallenge: string): void => {
  sessionStorage.setItem('pkce_code_verifier', codeVerifier);
  sessionStorage.setItem('pkce_code_challenge', codeChallenge);
};

export const getPKCEParams = (): { codeVerifier: string; codeChallenge: string } | null => {
  const codeVerifier = sessionStorage.getItem('pkce_code_verifier');
  const codeChallenge = sessionStorage.getItem('pkce_code_challenge');
  
  if (codeVerifier && codeChallenge) {
    return { codeVerifier, codeChallenge };
  }
  
  return null;
};

export const clearPKCEParams = (): void => {
  sessionStorage.removeItem('pkce_code_verifier');
  sessionStorage.removeItem('pkce_code_challenge');
}; 