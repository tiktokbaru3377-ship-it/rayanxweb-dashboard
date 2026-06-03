import '@testing-library/jest-dom';

// Jaminan Mocking untuk fungsionalitas window.matchMedia (Dibutuhkan oleh sistem tema & komponen Recharts)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mocking Web Crypto API untuk pengujian enkripsi lokal
Object.defineProperty(window, 'crypto', {
  value: {
    subtle: {
      importKey: jest.fn(),
      decrypt: jest.fn(),
    },
  },
});
