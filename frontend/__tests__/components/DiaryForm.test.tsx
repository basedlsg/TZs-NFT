import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DiaryForm from '@/components/DiaryForm';
import * as diaryStorage from '@/lib/diaryStorage';
import * as ipfs from '@/lib/ipfs';

// Mock the storage and IPFS modules
jest.mock('@/lib/diaryStorage');
jest.mock('@/lib/ipfs');

describe('DiaryForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders form fields', () => {
    render(<DiaryForm />);

    expect(screen.getByLabelText(/goal/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reflection/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/photo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  test('requires goal selection', async () => {
    render(<DiaryForm />);

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/goal is required/i)).toBeInTheDocument();
    });
  });

  test('requires reflection text', async () => {
    render(<DiaryForm />);

    const goalSelect = screen.getByLabelText(/goal/i);
    fireEvent.change(goalSelect, { target: { value: 'run_5km' } });

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/reflection is required/i)).toBeInTheDocument();
    });
  });

  test('saves entry with valid data', async () => {
    const mockSaveDiaryEntry = jest.spyOn(diaryStorage, 'saveDiaryEntry')
      .mockResolvedValue('entry_123');

    render(<DiaryForm />);

    const goalSelect = screen.getByLabelText(/goal/i);
    fireEvent.change(goalSelect, { target: { value: 'run_5km' } });

    const reflectionTextarea = screen.getByLabelText(/reflection/i);
    fireEvent.change(reflectionTextarea, {
      target: { value: 'I ran 5km today! Felt great.' }
    });

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSaveDiaryEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          goalId: 'run_5km',
          reflection: 'I ran 5km today! Felt great.',
          timestamp: expect.any(Number),
        })
      );
    });
  });

  test('clears form after successful save', async () => {
    jest.spyOn(diaryStorage, 'saveDiaryEntry').mockResolvedValue('entry_123');

    render(<DiaryForm />);

    const goalSelect = screen.getByLabelText(/goal/i) as HTMLSelectElement;
    const reflectionTextarea = screen.getByLabelText(/reflection/i) as HTMLTextAreaElement;

    fireEvent.change(goalSelect, { target: { value: 'run_5km' } });
    fireEvent.change(reflectionTextarea, { target: { value: 'Test reflection' } });

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(goalSelect.value).toBe('');
      expect(reflectionTextarea.value).toBe('');
    });
  });

  test('shows success message after save', async () => {
    jest.spyOn(diaryStorage, 'saveDiaryEntry').mockResolvedValue('entry_123');

    render(<DiaryForm />);

    const goalSelect = screen.getByLabelText(/goal/i);
    fireEvent.change(goalSelect, { target: { value: 'run_5km' } });

    const reflectionTextarea = screen.getByLabelText(/reflection/i);
    fireEvent.change(reflectionTextarea, { target: { value: 'Test reflection' } });

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/entry saved/i)).toBeInTheDocument();
    });
  });

  test('shows error message on save failure', async () => {
    jest.spyOn(diaryStorage, 'saveDiaryEntry')
      .mockRejectedValue(new Error('Storage failed'));

    render(<DiaryForm />);

    const goalSelect = screen.getByLabelText(/goal/i);
    fireEvent.change(goalSelect, { target: { value: 'run_5km' } });

    const reflectionTextarea = screen.getByLabelText(/reflection/i);
    fireEvent.change(reflectionTextarea, { target: { value: 'Test reflection' } });

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to save/i)).toBeInTheDocument();
    });
  });

  test('optionally pins to IPFS when checkbox enabled', async () => {
    jest.spyOn(diaryStorage, 'saveDiaryEntry').mockResolvedValue('entry_123');
    const mockPinDiaryEntry = jest.spyOn(ipfs, 'pinDiaryEntry')
      .mockResolvedValue('ipfs://Qm123...');

    render(<DiaryForm />);

    const goalSelect = screen.getByLabelText(/goal/i);
    fireEvent.change(goalSelect, { target: { value: 'run_5km' } });

    const reflectionTextarea = screen.getByLabelText(/reflection/i);
    fireEvent.change(reflectionTextarea, { target: { value: 'Test reflection' } });

    const ipfsCheckbox = screen.getByLabelText(/backup to ipfs/i);
    fireEvent.click(ipfsCheckbox);

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockPinDiaryEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          goalId: 'run_5km',
          reflection: 'Test reflection',
        })
      );
    });
  });

  test('handles photo upload', async () => {
    const mockSaveDiaryEntry = jest.spyOn(diaryStorage, 'saveDiaryEntry')
      .mockResolvedValue('entry_123');

    render(<DiaryForm />);

    const goalSelect = screen.getByLabelText(/goal/i);
    fireEvent.change(goalSelect, { target: { value: 'run_5km' } });

    const reflectionTextarea = screen.getByLabelText(/reflection/i);
    fireEvent.change(reflectionTextarea, { target: { value: 'Test' } });

    const photoInput = screen.getByLabelText(/photo/i);
    const file = new File(['fake image'], 'photo.png', { type: 'image/png' });

    fireEvent.change(photoInput, { target: { files: [file] } });

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSaveDiaryEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          imageDataUrl: expect.stringContaining('data:image/png;base64,'),
        })
      );
    });
  });

  test('disables save button while saving', async () => {
    jest.spyOn(diaryStorage, 'saveDiaryEntry')
      .mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('entry_123'), 100)));

    render(<DiaryForm />);

    const goalSelect = screen.getByLabelText(/goal/i);
    fireEvent.change(goalSelect, { target: { value: 'run_5km' } });

    const reflectionTextarea = screen.getByLabelText(/reflection/i);
    fireEvent.change(reflectionTextarea, { target: { value: 'Test' } });

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    expect(saveButton).toBeDisabled();

    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });
  });

  test('validates image file type', async () => {
    render(<DiaryForm />);

    const photoInput = screen.getByLabelText(/photo/i);
    const file = new File(['fake pdf'], 'document.pdf', { type: 'application/pdf' });

    fireEvent.change(photoInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/only images allowed/i)).toBeInTheDocument();
    });
  });

  test('validates image file size', async () => {
    render(<DiaryForm />);

    const photoInput = screen.getByLabelText(/photo/i);
    // Create a mock file that's > 5MB
    const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.png', {
      type: 'image/png'
    });

    fireEvent.change(photoInput, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(screen.getByText(/image too large/i)).toBeInTheDocument();
    });
  });
});
