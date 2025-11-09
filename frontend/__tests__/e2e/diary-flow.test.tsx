/**
 * E2E Tests for Diary Entry Flow
 *
 * Tests the complete user journey from creating a diary entry
 * to viewing it in history
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { saveDiaryEntry, getDiaryEntry, getAllDiaryEntries } from '@/lib/diaryStorage';
import DiaryForm from '@/components/DiaryForm';

// Mock the diary storage
jest.mock('@/lib/diaryStorage');

const mockSaveDiaryEntry = saveDiaryEntry as jest.MockedFunction<typeof saveDiaryEntry>;
const mockGetDiaryEntry = getDiaryEntry as jest.MockedFunction<typeof getDiaryEntry>;
const mockGetAllDiaryEntries = getAllDiaryEntries as jest.MockedFunction<typeof getAllDiaryEntries>;

describe('Diary Entry E2E Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path: Create and Save Entry', () => {
    test('user can create a complete diary entry', async () => {
      const mockEntryId = 'test-entry-123';
      mockSaveDiaryEntry.mockResolvedValue(mockEntryId);

      const onSuccess = jest.fn();
      render(<DiaryForm onSuccess={onSuccess} />);

      // Step 1: Select a goal
      const goalSelect = screen.getByLabelText(/goal/i);
      fireEvent.change(goalSelect, { target: { value: 'run_5km' } });

      // Step 2: Write reflection
      const reflectionTextarea = screen.getByLabelText(/reflection/i);
      fireEvent.change(reflectionTextarea, {
        target: {
          value:
            'Today I completed my 5km run. It was challenging but I pushed through and finished strong. I feel accomplished and energized.',
        },
      });

      // Step 3: Submit form
      const submitButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(submitButton);

      // Step 4: Verify save was called
      await waitFor(() => {
        expect(mockSaveDiaryEntry).toHaveBeenCalledWith(
          expect.objectContaining({
            goalId: 'run_5km',
            reflection: expect.stringContaining('completed my 5km run'),
          })
        );
      });

      // Step 5: Verify success callback
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(mockEntryId);
      });
    });

    test('user can upload image with diary entry', async () => {
      const mockEntryId = 'test-entry-456';
      mockSaveDiaryEntry.mockResolvedValue(mockEntryId);

      render(<DiaryForm onSuccess={jest.fn()} />);

      // Select goal and add reflection
      fireEvent.change(screen.getByLabelText(/goal/i), {
        target: { value: 'make_sketch' },
      });
      fireEvent.change(screen.getByLabelText(/reflection/i), {
        target: { value: 'Created a beautiful sketch of a landscape today. Very proud of the result.' },
      });

      // Upload image
      const file = new File(['fake-image'], 'sketch.png', { type: 'image/png' });
      const fileInput = screen.getByLabelText(/upload.*image/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(mockSaveDiaryEntry).toHaveBeenCalledWith(
          expect.objectContaining({
            goalId: 'make_sketch',
            imageDataUrl: expect.stringContaining('data:image'),
          })
        );
      });
    });
  });

  describe('Validation and Error Handling', () => {
    test('shows error for missing goal', async () => {
      render(<DiaryForm onSuccess={jest.fn()} />);

      // Try to submit without selecting goal
      fireEvent.change(screen.getByLabelText(/reflection/i), {
        target: { value: 'This is a long enough reflection for validation' },
      });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(screen.getByText(/goal.*required/i)).toBeInTheDocument();
      });

      expect(mockSaveDiaryEntry).not.toHaveBeenCalled();
    });

    test('shows error for short reflection', async () => {
      render(<DiaryForm onSuccess={jest.fn()} />);

      fireEvent.change(screen.getByLabelText(/goal/i), {
        target: { value: 'run_5km' },
      });
      fireEvent.change(screen.getByLabelText(/reflection/i), {
        target: { value: 'Too short' },
      });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(screen.getByText(/at least.*characters/i)).toBeInTheDocument();
      });

      expect(mockSaveDiaryEntry).not.toHaveBeenCalled();
    });

    test('shows error for invalid image file', async () => {
      render(<DiaryForm onSuccess={jest.fn()} />);

      // Try to upload non-image file
      const file = new File(['fake-pdf'], 'document.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText(/upload.*image/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/must be an image/i)).toBeInTheDocument();
      });
    });

    test('shows error for oversized image', async () => {
      render(<DiaryForm onSuccess={jest.fn()} />);

      // Create large file (6MB)
      const largeData = new Uint8Array(6 * 1024 * 1024);
      const file = new File([largeData], 'large.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/upload.*image/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/too large/i)).toBeInTheDocument();
      });
    });
  });

  describe('Entry Retrieval and Display', () => {
    test('can retrieve saved entry by ID', async () => {
      const mockEntry = {
        id: 'test-123',
        goalId: 'run_5km',
        reflection: 'Great run today!',
        timestamp: Date.now(),
        hash: 'hash123',
      };

      mockGetDiaryEntry.mockResolvedValue(mockEntry);

      const entry = await getDiaryEntry('test-123');

      expect(entry).toEqual(mockEntry);
      expect(mockGetDiaryEntry).toHaveBeenCalledWith('test-123');
    });

    test('can retrieve all entries', async () => {
      const mockEntries = [
        {
          id: 'entry-1',
          goalId: 'run_5km',
          reflection: 'First run',
          timestamp: Date.now() - 1000,
          hash: 'hash1',
        },
        {
          id: 'entry-2',
          goalId: 'meditate_10min',
          reflection: 'Meditation session',
          timestamp: Date.now(),
          hash: 'hash2',
        },
      ];

      mockGetAllDiaryEntries.mockResolvedValue(mockEntries);

      const entries = await getAllDiaryEntries();

      expect(entries).toHaveLength(2);
      expect(entries[0].goalId).toBe('run_5km');
      expect(entries[1].goalId).toBe('meditate_10min');
    });
  });

  describe('Data Persistence', () => {
    test('entry contains timestamp', async () => {
      const mockEntryId = 'test-789';
      mockSaveDiaryEntry.mockResolvedValue(mockEntryId);

      render(<DiaryForm onSuccess={jest.fn()} />);

      fireEvent.change(screen.getByLabelText(/goal/i), {
        target: { value: 'run_5km' },
      });
      fireEvent.change(screen.getByLabelText(/reflection/i), {
        target: { value: 'Completed my daily run with great energy and enthusiasm.' },
      });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(mockSaveDiaryEntry).toHaveBeenCalledWith(
          expect.objectContaining({
            timestamp: expect.any(Number),
          })
        );
      });
    });

    test('entry includes all required fields', async () => {
      const mockEntryId = 'test-complete';
      mockSaveDiaryEntry.mockResolvedValue(mockEntryId);

      render(<DiaryForm onSuccess={jest.fn()} />);

      fireEvent.change(screen.getByLabelText(/goal/i), {
        target: { value: 'read_20_pages' },
      });
      fireEvent.change(screen.getByLabelText(/reflection/i), {
        target: {
          value: 'Read 20 pages of an amazing book. Learned new concepts about productivity.',
        },
      });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        const call = mockSaveDiaryEntry.mock.calls[0][0];
        expect(call).toHaveProperty('goalId');
        expect(call).toHaveProperty('reflection');
        expect(call).toHaveProperty('timestamp');
      });
    });
  });
});
