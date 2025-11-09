/**
 * E2E Tests for Proof Verification Flow
 *
 * Tests the complete proof submission and verification workflow
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProofSubmission from '@/components/ProofSubmission';
import { getDiaryEntry } from '@/lib/diaryStorage';
import { useWallet } from '@/contexts/WalletContext';
import { useNotification } from '@/contexts/NotificationContext';

// Mock dependencies
jest.mock('@/lib/diaryStorage');
jest.mock('@/contexts/WalletContext');
jest.mock('@/contexts/NotificationContext');
jest.mock('@/lib/soulNFT');

const mockGetDiaryEntry = getDiaryEntry as jest.MockedFunction<typeof getDiaryEntry>;
const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>;
const mockUseNotification = useNotification as jest.MockedFunction<typeof useNotification>;

// Mock fetch globally
global.fetch = jest.fn();

describe('Proof Verification E2E Flow', () => {
  const mockEntry = {
    id: 'entry-123',
    goalId: 'run_5km',
    reflection: 'Completed a great 5km run today. Felt strong and energized throughout the entire distance.',
    imageDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    timestamp: Date.now(),
    hash: 'hash123',
  };

  const mockNotification = {
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showWarning: jest.fn(),
    showInfo: jest.fn(),
    showNotification: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDiaryEntry.mockResolvedValue(mockEntry);
    mockUseWallet.mockReturnValue({
      account: 'tz1TestAccount123',
      connect: jest.fn(),
      disconnect: jest.fn(),
      isConnected: true,
    });
    mockUseNotification.mockReturnValue(mockNotification);

    (global.fetch as jest.Mock).mockClear();
  });

  describe('Happy Path: Successful Verification', () => {
    test('submits proof and shows verification result', async () => {
      const mockVerificationResult = {
        verified: true,
        confidence: 85,
        reason: 'All checks passed',
        feedback: 'Great proof submission!',
        needsSecondPhoto: false,
        checks: {
          validGoal: true,
          sufficientReflection: true,
          validImage: true,
          aiVerified: true,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVerificationResult,
      });

      const onSuccess = jest.fn();
      render(<ProofSubmission diaryEntryId="entry-123" onSuccess={onSuccess} />);

      // Wait for entry to load
      await waitFor(() => {
        expect(mockGetDiaryEntry).toHaveBeenCalledWith('entry-123');
      });

      // Submit proof
      const submitButton = await screen.findByRole('button', { name: /submit.*proof/i });
      fireEvent.click(submitButton);

      // Verify API was called
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/verify'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('run_5km'),
          })
        );
      });

      // Check success notification
      await waitFor(() => {
        expect(mockNotification.showSuccess).toHaveBeenCalledWith(
          expect.stringContaining('85%')
        );
      });

      // Check onSuccess callback
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(mockVerificationResult);
      });
    });

    test('handles second photo request flow', async () => {
      const lowConfidenceResult = {
        verified: false,
        confidence: 65,
        reason: 'Low confidence',
        feedback: 'Please provide a second photo',
        needsSecondPhoto: true,
        checks: {
          validGoal: true,
          sufficientReflection: true,
          validImage: true,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => lowConfidenceResult,
      });

      render(<ProofSubmission diaryEntryId="entry-123" />);

      await waitFor(() => {
        expect(mockGetDiaryEntry).toHaveBeenCalled();
      });

      const submitButton = await screen.findByRole('button', { name: /submit.*proof/i });
      fireEvent.click(submitButton);

      // Should show warning for second photo
      await waitFor(() => {
        expect(mockNotification.showWarning).toHaveBeenCalledWith(
          expect.stringContaining('second photo')
        );
      });

      // UI should show second photo upload option
      await waitFor(() => {
        expect(screen.getByText(/provide.*second.*photo/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Scenarios', () => {
    test('handles network error gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));

      render(<ProofSubmission diaryEntryId="entry-123" />);

      await waitFor(() => {
        expect(mockGetDiaryEntry).toHaveBeenCalled();
      });

      const submitButton = await screen.findByRole('button', { name: /submit.*proof/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNotification.showError).toHaveBeenCalledWith(
          expect.stringContaining('connection')
        );
      });
    });

    test('handles API error response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Invalid request data' }),
      });

      render(<ProofSubmission diaryEntryId="entry-123" />);

      await waitFor(() => {
        expect(mockGetDiaryEntry).toHaveBeenCalled();
      });

      const submitButton = await screen.findByRole('button', { name: /submit.*proof/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNotification.showError).toHaveBeenCalled();
      });
    });

    test('handles rate limit error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ detail: 'Rate limit exceeded. Please wait.' }),
      });

      render(<ProofSubmission diaryEntryId="entry-123" />);

      await waitFor(() => {
        expect(mockGetDiaryEntry).toHaveBeenCalled();
      });

      const submitButton = await screen.findByRole('button', { name: /submit.*proof/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNotification.showError).toHaveBeenCalledWith(
          expect.stringContaining('too many requests')
        );
      });
    });

    test('handles missing diary entry', async () => {
      mockGetDiaryEntry.mockResolvedValueOnce(null);

      render(<ProofSubmission diaryEntryId="nonexistent-123" />);

      await waitFor(() => {
        expect(mockNotification.showError).toHaveBeenCalledWith(
          expect.stringContaining('not found')
        );
      });
    });
  });

  describe('Validation Before Submission', () => {
    test('validates image data before submitting', async () => {
      const entryWithoutImage = { ...mockEntry, imageDataUrl: undefined };
      mockGetDiaryEntry.mockResolvedValueOnce(entryWithoutImage);

      render(<ProofSubmission diaryEntryId="entry-123" />);

      await waitFor(() => {
        expect(mockGetDiaryEntry).toHaveBeenCalled();
      });

      const submitButton = await screen.findByRole('button', { name: /submit.*proof/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNotification.showError).toHaveBeenCalledWith(
          expect.stringContaining('No image')
        );
      });

      // Should not call API
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('validates second photo before resubmission', async () => {
      // First submission with low confidence
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          verified: false,
          confidence: 65,
          needsSecondPhoto: true,
          checks: { validGoal: true, sufficientReflection: true, validImage: true },
          reason: 'Low confidence',
          feedback: 'Please provide second photo',
        }),
      });

      render(<ProofSubmission diaryEntryId="entry-123" />);

      await waitFor(() => {
        expect(mockGetDiaryEntry).toHaveBeenCalled();
      });

      // Submit first time
      const submitButton = await screen.findByRole('button', { name: /submit.*proof/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/provide.*second.*photo/i)).toBeInTheDocument();
      });

      // Upload invalid second photo (wrong format)
      const invalidFile = new File(['data'], 'test.txt', { type: 'text/plain' });
      const fileInput = screen.getByLabelText(/second.*photo/i);
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });

      await waitFor(() => {
        expect(mockNotification.showError).toHaveBeenCalledWith(
          expect.stringContaining('must be an image')
        );
      });
    });
  });

  describe('Loading States', () => {
    test('shows loading state during verification', async () => {
      let resolveVerification: any;
      const verificationPromise = new Promise((resolve) => {
        resolveVerification = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(verificationPromise);

      render(<ProofSubmission diaryEntryId="entry-123" />);

      await waitFor(() => {
        expect(mockGetDiaryEntry).toHaveBeenCalled();
      });

      const submitButton = await screen.findByRole('button', { name: /submit.*proof/i });
      fireEvent.click(submitButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/verifying/i)).toBeInTheDocument();
      });

      // Resolve verification
      resolveVerification({
        ok: true,
        json: async () => ({
          verified: true,
          confidence: 90,
          reason: 'Passed',
          feedback: 'Good',
          checks: { validGoal: true, sufficientReflection: true, validImage: true },
        }),
      });

      // Loading should disappear
      await waitFor(() => {
        expect(screen.queryByText(/verifying/i)).not.toBeInTheDocument();
      });
    });
  });
});
