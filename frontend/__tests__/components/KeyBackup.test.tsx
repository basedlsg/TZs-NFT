import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import KeyBackup from '@/components/KeyBackup';
import * as keyManager from '@/lib/keyManager';

// Mock the keyManager module
jest.mock('@/lib/keyManager');

describe('KeyBackup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  describe('Export Key', () => {
    test('renders export button', () => {
      render(<KeyBackup />);
      expect(screen.getByRole('button', { name: /export key/i })).toBeInTheDocument();
    });

    test('exports key and triggers download', async () => {
      const mockJwk = {
        kty: 'oct',
        k: 'mock-key-data',
        alg: 'A256GCM',
        ext: true,
      };

      jest.spyOn(keyManager, 'exportKeyForBackup').mockResolvedValue(mockJwk);

      // Mock createElement to spy on link clicks
      const mockLink = document.createElement('a');
      const clickSpy = jest.spyOn(mockLink, 'click');
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink);

      render(<KeyBackup />);

      const exportButton = screen.getByRole('button', { name: /export key/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(keyManager.exportKeyForBackup).toHaveBeenCalled();
        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(clickSpy).toHaveBeenCalled();
      });
    });

    test('shows success message after export', async () => {
      const mockJwk = { kty: 'oct', k: 'mock-key-data' };
      jest.spyOn(keyManager, 'exportKeyForBackup').mockResolvedValue(mockJwk);

      render(<KeyBackup />);

      const exportButton = screen.getByRole('button', { name: /export key/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText(/key exported/i)).toBeInTheDocument();
      });
    });

    test('shows error when no key exists', async () => {
      jest.spyOn(keyManager, 'exportKeyForBackup').mockResolvedValue(null);

      render(<KeyBackup />);

      const exportButton = screen.getByRole('button', { name: /export key/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText(/no key found/i)).toBeInTheDocument();
      });
    });

    test('shows error on export failure', async () => {
      jest.spyOn(keyManager, 'exportKeyForBackup')
        .mockRejectedValue(new Error('Export failed'));

      render(<KeyBackup />);

      const exportButton = screen.getByRole('button', { name: /export key/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to export/i)).toBeInTheDocument();
      });
    });
  });

  describe('Import Key', () => {
    test('renders import section', () => {
      render(<KeyBackup />);
      expect(screen.getByText(/import key/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/choose file/i)).toBeInTheDocument();
    });

    test('imports key from file', async () => {
      jest.spyOn(keyManager, 'importKeyFromBackup').mockResolvedValue();

      render(<KeyBackup />);

      const mockJwk = { kty: 'oct', k: 'mock-key-data', alg: 'A256GCM' };
      const fileContent = JSON.stringify(mockJwk);
      const file = new File([fileContent], 'backup-key.json', {
        type: 'application/json',
      });

      const fileInput = screen.getByLabelText(/choose file/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(keyManager.importKeyFromBackup).toHaveBeenCalledWith(mockJwk);
      });
    });

    test('shows success message after import', async () => {
      jest.spyOn(keyManager, 'importKeyFromBackup').mockResolvedValue();

      render(<KeyBackup />);

      const mockJwk = { kty: 'oct', k: 'mock-key' };
      const file = new File([JSON.stringify(mockJwk)], 'key.json', {
        type: 'application/json',
      });

      const fileInput = screen.getByLabelText(/choose file/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/key imported/i)).toBeInTheDocument();
      });
    });

    test('shows error for invalid JSON', async () => {
      render(<KeyBackup />);

      const file = new File(['invalid json{'], 'key.json', {
        type: 'application/json',
      });

      const fileInput = screen.getByLabelText(/choose file/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/invalid key file/i)).toBeInTheDocument();
      });
    });

    test('shows error on import failure', async () => {
      jest.spyOn(keyManager, 'importKeyFromBackup')
        .mockRejectedValue(new Error('Import failed'));

      render(<KeyBackup />);

      const file = new File([JSON.stringify({ kty: 'oct' })], 'key.json', {
        type: 'application/json',
      });

      const fileInput = screen.getByLabelText(/choose file/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/failed to import/i)).toBeInTheDocument();
      });
    });

    test('validates key file type', async () => {
      render(<KeyBackup />);

      const file = new File(['key data'], 'key.txt', { type: 'text/plain' });

      const fileInput = screen.getByLabelText(/choose file/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/only json files/i)).toBeInTheDocument();
      });
    });
  });

  describe('Security Warnings', () => {
    test('displays security warning', () => {
      render(<KeyBackup />);
      expect(screen.getByText(/keep your key safe/i)).toBeInTheDocument();
    });

    test('warns about key loss', () => {
      render(<KeyBackup />);
      expect(screen.getByText(/cannot recover/i)).toBeInTheDocument();
    });
  });

  describe('Key Status', () => {
    test('shows when key exists', async () => {
      jest.spyOn(keyManager, 'retrieveKey').mockResolvedValue({} as CryptoKey);

      render(<KeyBackup />);

      await waitFor(() => {
        expect(screen.getByText(/key is backed up/i)).toBeInTheDocument();
      });
    });

    test('shows when no key exists', async () => {
      jest.spyOn(keyManager, 'retrieveKey').mockResolvedValue(null);

      render(<KeyBackup />);

      await waitFor(() => {
        expect(screen.getByText(/no key found/i)).toBeInTheDocument();
      });
    });
  });
});
