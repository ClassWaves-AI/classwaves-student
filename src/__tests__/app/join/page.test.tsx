import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import JoinPage from '@/app/join/[sessionId]/page';
import { joinSession } from '@/features/session-joining/api/join-session';
import { useStudentStore } from '@/stores/student-store';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/features/session-joining/api/join-session', () => ({
  joinSession: jest.fn(),
}));

jest.mock('@/stores/student-store', () => ({
  useStudentStore: jest.fn(() => ({
    setAuth: jest.fn(),
    setSession: jest.fn(),
    setGroup: jest.fn(),
  })),
}));

interface AgeModalProps { onVerified: (dob: Date, requiresConsent: boolean) => void; onCancel: () => void }
jest.mock('@/components/compliance/age-verification-modal', () => ({
  AgeVerificationModal: ({ onVerified, onCancel }: AgeModalProps) => (
    <div data-testid="age-verification-modal">
      <button onClick={() => onVerified(new Date('2010-01-01'), false)}>
        Verify Age (13+)
      </button>
      <button onClick={() => onVerified(new Date('2015-01-01'), true)}>
        Verify Age (Under 13)
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

interface ConsentProps { onCancel: () => void }
jest.mock('@/components/compliance/parental-consent-required', () => ({
  ParentalConsentRequired: ({ onCancel }: ConsentProps) => (
    <div data-testid="parental-consent-modal">
      <p>Parental consent required</p>
      <button onClick={onCancel}>Go Back</button>
    </div>
  ),
}));

describe('JoinPage', () => {
  const mockPush = jest.fn();
  const mockSetAuth = jest.fn();
  const mockSetSession = jest.fn();
  const mockSetGroup = jest.fn();

  const defaultProps = {
    params: {
      sessionId: 'ABC123',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (useStudentStore as unknown as jest.Mock).mockReturnValue({
      setAuth: mockSetAuth,
      setSession: mockSetSession,
      setGroup: mockSetGroup,
    });
  });

  it('renders the join form with session code', () => {
    render(<JoinPage {...defaultProps} />);

    expect(screen.getByText('Join Classroom Session')).toBeInTheDocument();
    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(screen.getByLabelText('Your Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Grade Level (Optional)')).toBeInTheDocument();
    expect(screen.getByText('Join Session')).toBeInTheDocument();
  });

  it('validates student name is required', async () => {
    const user = userEvent.setup();
    render(<JoinPage {...defaultProps} />);

    const joinButton = screen.getByText('Join Session');
    await user.click(joinButton);

    expect(screen.getByText('Please enter your name')).toBeInTheDocument();
    expect(joinSession).not.toHaveBeenCalled();
  });

  it('shows age verification modal when form is submitted', async () => {
    const user = userEvent.setup();
    render(<JoinPage {...defaultProps} />);

    const nameInput = screen.getByLabelText('Your Name');
    await user.type(nameInput, 'John Student');

    const joinButton = screen.getByText('Join Session');
    await user.click(joinButton);

    expect(screen.getByTestId('age-verification-modal')).toBeInTheDocument();
  });

  it('proceeds with join for students 13 and older', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      token: 'student-token',
      student: {
        id: 'student-123',
        displayName: 'John Student',
      },
      session: {
        id: 'session-123',
        title: 'Math Class',
        status: 'active',
      },
      group: {
        id: 'group-1',
        name: 'Group A',
      },
    };

    (joinSession as jest.Mock).mockResolvedValueOnce(mockResponse);

    render(<JoinPage {...defaultProps} />);

    // Fill form
    await user.type(screen.getByLabelText('Your Name'), 'John Student');
    await user.selectOptions(screen.getByLabelText('Grade Level (Optional)'), '5');
    await user.click(screen.getByText('Join Session'));

    // Age verification - select 13+
    await user.click(screen.getByText('Verify Age (13+)'));

    await waitFor(() => {
      expect(joinSession).toHaveBeenCalledWith({
        sessionCode: 'ABC123',
        studentName: 'John Student',
        gradeLevel: '5',
        dateOfBirth: new Date('2010-01-01').toISOString(),
      });
    });

    expect(mockSetAuth).toHaveBeenCalledWith('student-token', mockResponse.student);
    expect(mockSetSession).toHaveBeenCalledWith(mockResponse.session);
    expect(mockSetGroup).toHaveBeenCalledWith(mockResponse.group);
    expect(mockPush).toHaveBeenCalledWith('/session/session-123');
  });

  it('shows parental consent required for students under 13', async () => {
    const user = userEvent.setup();
    render(<JoinPage {...defaultProps} />);

    await user.type(screen.getByLabelText('Your Name'), 'Young Student');
    await user.click(screen.getByText('Join Session'));

    // Age verification - select under 13
    await user.click(screen.getByText('Verify Age (Under 13)'));

    expect(screen.getByTestId('parental-consent-modal')).toBeInTheDocument();
    expect(joinSession).not.toHaveBeenCalled();
  });

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup();
    (joinSession as jest.Mock).mockRejectedValueOnce({
      response: {
        status: 404,
        data: { message: 'Session not found' },
      },
    });

    render(<JoinPage {...defaultProps} />);

    await user.type(screen.getByLabelText('Your Name'), 'John Student');
    await user.click(screen.getByText('Join Session'));
    await user.click(screen.getByText('Verify Age (13+)'));

    await waitFor(() => {
      expect(screen.getByText('Session not found. Please check your code.')).toBeInTheDocument();
    });
  });

  it('handles session full error', async () => {
    const user = userEvent.setup();
    (joinSession as jest.Mock).mockRejectedValueOnce({
      response: {
        status: 400,
        data: { message: 'Session is full' },
      },
    });

    render(<JoinPage {...defaultProps} />);

    await user.type(screen.getByLabelText('Your Name'), 'John Student');
    await user.click(screen.getByText('Join Session'));
    await user.click(screen.getByText('Verify Age (13+)'));

    await waitFor(() => {
      expect(screen.getByText('Session is not accepting new students.')).toBeInTheDocument();
    });
  });

  it('disables form during submission', async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => { resolvePromise = resolve; });
    
    (joinSession as jest.Mock).mockReturnValueOnce(promise);

    render(<JoinPage {...defaultProps} />);

    await user.type(screen.getByLabelText('Your Name'), 'John Student');
    await user.click(screen.getByText('Join Session'));
    await user.click(screen.getByText('Verify Age (13+)'));

    // Check form is disabled
    expect(screen.getByLabelText('Your Name')).toBeDisabled();
    expect(screen.getByLabelText('Grade Level (Optional)')).toBeDisabled();
    expect(screen.getByText('Joining...')).toBeInTheDocument();

    // Resolve the promise
    resolvePromise!({
      token: 'token',
      student: { id: '123', displayName: 'John' },
      session: { id: 'session-123' },
    });
  });

  it('resets form when parental consent is cancelled', async () => {
    const user = userEvent.setup();
    render(<JoinPage {...defaultProps} />);

    await user.type(screen.getByLabelText('Your Name'), 'Young Student');
    await user.selectOptions(screen.getByLabelText('Grade Level (Optional)'), '3');
    await user.click(screen.getByText('Join Session'));
    await user.click(screen.getByText('Verify Age (Under 13)'));

    // Cancel parental consent
    await user.click(screen.getByText('Go Back'));

    // Form should be reset
    expect(screen.getByLabelText('Your Name')).toHaveValue('');
    expect(screen.getByLabelText('Grade Level (Optional)')).toHaveValue('');
  });

  it('navigates back when "Use a different code" is clicked', async () => {
    const user = userEvent.setup();
    render(<JoinPage {...defaultProps} />);

    await user.click(screen.getByText('Use a different code'));

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('preserves grade selection through age verification', async () => {
    const user = userEvent.setup();
    (joinSession as jest.Mock).mockResolvedValueOnce({
      token: 'token',
      student: { id: '123', displayName: 'John' },
      session: { id: 'session-123' },
    });

    render(<JoinPage {...defaultProps} />);

    await user.type(screen.getByLabelText('Your Name'), 'John Student');
    await user.selectOptions(screen.getByLabelText('Grade Level (Optional)'), '7');
    await user.click(screen.getByText('Join Session'));
    await user.click(screen.getByText('Verify Age (13+)'));

    await waitFor(() => {
      expect(joinSession).toHaveBeenCalledWith(
        expect.objectContaining({
          gradeLevel: '7',
        })
      );
    });
  });
});