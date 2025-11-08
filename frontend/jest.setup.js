// Jest setup file
import '@testing-library/jest-dom';

// Mock Web Crypto API
const crypto = {
  subtle: {
    generateKey: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
    digest: jest.fn(),
    exportKey: jest.fn(),
    importKey: jest.fn(),
  },
  getRandomValues: jest.fn((arr) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }),
};

global.crypto = crypto as any;

// Mock IndexedDB
global.indexedDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
  databases: jest.fn(),
} as any;

// Mock FileReader
global.FileReader = class FileReader {
  result: string | ArrayBuffer | null = null;
  onload: ((this: FileReader, ev: ProgressEvent) => any) | null = null;

  readAsDataURL(blob: Blob) {
    setTimeout(() => {
      this.result = 'data:image/png;base64,fake-image-data';
      if (this.onload) {
        this.onload.call(this, new ProgressEvent('load'));
      }
    }, 0);
  }

  readAsArrayBuffer(blob: Blob) {
    setTimeout(() => {
      this.result = new ArrayBuffer(8);
      if (this.onload) {
        this.onload.call(this, new ProgressEvent('load'));
      }
    }, 0);
  }

  readAsText(blob: Blob) {
    setTimeout(() => {
      this.result = 'fake text content';
      if (this.onload) {
        this.onload.call(this, new ProgressEvent('load'));
      }
    }, 0);
  }
} as any;
