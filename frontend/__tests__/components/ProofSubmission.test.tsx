import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProofSubmission from '@/components/ProofSubmission';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('ProofSubmission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  test('renders proof submission form', () => {
    render(<ProofSubmission diaryEntryId="test_entry" />);

    expect(screen.getByRole('button', { name: /submit proof/i })).toBeInTheDocument();
    expect(screen.getByText(/verify.*proof/i)).toBeInTheDocument();
  });

  test('displays diary entry details', () => {
    render(<ProofSubmission diaryEntryId="test_entry" />);

    // Should show that we're verifying a specific entry
    expect(screen.getByText(/entry/i)).toBeInTheDocument();
  });

  test('submits proof for verification', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        verified: true,
        confidence: 85,
        reason: 'Verified',
        feedback: 'Proof verified successfully!',
        needsSecondPhoto: false,
      }),
    });

    render(<ProofSubmission diaryEntryId="test_entry" />);

    const submitButton = screen.getByRole('button', { name: /submit proof/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/verify'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  test('shows loading state during verification', async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
    );

    render(<ProofSubmission diaryEntryId="test_entry" />);

    const submitButton = screen.getByRole('button', { name: /submit proof/i });
    fireEvent.click(submitButton);

    expect(screen.getByText(/verifying/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  test('displays success message on verification pass', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        verified: true,
        confidence: 90,
        reason: 'Verified',
        feedback: 'Proof verified! Your goal is confirmed.',
        needsSecondPhoto: false,
      }),
    });

    render(<ProofSubmission diaryEntryId="test_entry" />);

    const submitButton = screen.getByRole('button', { name: /submit proof/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/verified/i)).toBeInTheDocument();
      expect(screen.getByText(/90/)).toBeInTheDocument();
    });
  });

  test('displays error message on verification failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        verified: false,
        confidence: 30,
        reason: 'Reflection too short',
        feedback: 'Please provide a more detailed reflection.',
        needsSecondPhoto: false,
      }),
    });

    render(<ProofSubmission diaryEntryId="test_entry" />);

    const submitButton = screen.getByRole('button', { name: /submit proof/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/not verified/i)).toBeInTheDocument();
      expect(screen.getByText(/reflection too short/i)).toBeInTheDocument();
    });
  });

  test('requests second photo on low confidence', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        verified: false,
        confidence: 65,
        reason: 'Low confidence',
        feedback: 'Please submit a second photo for additional verification.',
        needsSecondPhoto: true,
      }),
    });

    render(<ProofSubmission diaryEntryId="test_entry" />);

    const submitButton = screen.getByRole('button', { name: /submit proof/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/second photo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/additional photo/i)).toBeInTheDocument();
    });
  });

  test('allows uploading second photo', async () => {
    // First call: needs second photo
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        verified: false,
        confidence: 65,
        feedback: 'Please submit a second photo.',
        needsSecondPhoto: true,
      }),
    });

    // Second call: verified with second photo
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        verified: true,
        confidence: 85,
        feedback: 'Verified with second photo!',
        needsSecondPhoto: false,
      }),
    });

    render(<ProofSubmission diaryEntryId="test_entry" />);

    const submitButton = screen.getByRole('button', { name: /submit proof/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/additional photo/i)).toBeInTheDocument();
    });

    const secondPhotoInput = screen.getByLabelText(/additional photo/i);
    const file = new File(['second photo'], 'photo2.png', { type: 'image/png' });
    fireEvent.change(secondPhotoInput, { target: { files: [file] } });

    const retryButton = screen.getByRole('button', { name: /submit.*second/i });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText(/verified/i)).toBeInTheDocument();
    });
  });

  test('displays confidence score', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        verified: true,
        confidence: 92,
        feedback: 'High confidence verification',
        needsSecondPhoto: false,
      }),
    });

    render(<ProofSubmission diaryEntryId="test_entry" />);

    const submitButton = screen.getByRole('button', { name: /submit proof/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/92%/i)).toBeInTheDocument();
    });
  });

  test('displays verification checks', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        verified: true,
        confidence: 88,
        feedback: 'All checks passed',
        checks: {
          validGoal: true,
          sufficientReflection: true,
          validImage: true,
          aiVerified: true,
        },
      }),
    });

    render(<ProofSubmission diaryEntryId="test_entry" />);

    const submitButton = screen.getByRole('button', { name: /submit proof/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/valid goal/i)).toBeInTheDocument();
      expect(screen.getByText(/reflection/i)).toBeInTheDocument();
      expect(screen.getByText(/image/i)).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<ProofSubmission diaryEntryId="test_entry" />);

    const submitButton = screen.getByRole('button', { name: /submit proof/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
      expect(screen.getByText(/try again/i)).toBeInTheDocument();
    });
  });

  test('allows retry after failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        verified: false,
        confidence: 40,
        feedback: 'Verification failed',
      }),
    });

    render(<ProofSubmission diaryEntryId="test_entry" />);

    const submitButton = screen.getByRole('button', { name: /submit proof/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/not verified/i)).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
  });

  test('disables submit during verification', async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
    );

    render(<ProofSubmission diaryEntryId="test_entry" />);

    const submitButton = screen.getByRole('button', { name: /submit proof/i });
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
  });

  test('shows feedback to user', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        verified: true,
        confidence: 85,
        feedback: 'Great job! Your proof clearly shows completion of the goal.',
      }),
    });

    render(<ProofSubmission diaryEntryId="test_entry" />);

    const submitButton = screen.getByRole('button', { name: /submit proof/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/great job/i)).toBeInTheDocument();
    });
  });
});
