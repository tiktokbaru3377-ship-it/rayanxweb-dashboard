import { useState, useCallback } from 'react';

export const useSecureDecrypt = () => {
  const [isDecrypting, setIsDecrypting] = useState(false);

  const decryptPayload = useCallback(async (encryptedHex, secretKeyBase64) => {
    setIsDecrypting(true);
    try {
      // 1. Konversi Secret Key dari format Base64 ke CryptoKey Object
      const keyBuffer = Uint8Array.from(atob(secretKeyBase64), c => c.charCodeAt(0));
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      // 2. Pecah string Hex menjadi komponen: IV (12-byte), Ciphertext, dan Auth Tag (16-byte)
      const rawBuffer = Uint8Array.from(encryptedHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      
      const iv = rawBuffer.slice(0, 12);
      const ciphertextWithTag = rawBuffer.slice(12);

      // 3. Eksekusi dekripsi tingkat rendah menggunakan Web Crypto API
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv, tagLength: 128 },
        cryptoKey,
        ciphertextWithTag
      );

      // 4. Dekode array biner menjadi string teks biasa (Plaintext)
      const plaintext = new TextDecoder().decode(decryptedBuffer);
      setIsDecrypting(false);
      return JSON.parse(plaintext);

    } catch (err) {
      console.error('=== CRYPTOGRAPHIC INTEGRITY FAULT ===\nAuth Tag mismatch or corrupt key structure.');
      setIsDecrypting(false);
      return null;
    }
  }, []);

  return { decryptPayload, isDecrypting };
};
