import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeaderReadyControl } from '@/components/LeaderReadyControl';
import { useStudentStore } from '@/stores/student-store';
import { websocketService } from '@/lib/websocket';

// Mock dependencies
jest.mock('@/stores/student-store');
jest.mock('@/lib/websocket');

describe('LeaderReadyControl', () => {
  const mockSetGroupReadiness = jest.fn();
  const mockMarkLeaderReady = jest.fn();
  const mockIsConnected = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock websocket service
    (websocketService.markLeaderReady as jest.Mock) = mockMarkLeaderReady;
    (websocketService.isConnected as jest.Mock) = mockIsConnected;
    mockIsConnected.mockReturnValue(true);

    // Default mock store state
    (useStudentStore as jest.Mock).mockReturnValue({
      student: { id: 'student-123', name: 'John Doe' },
      session: { id: 'session-456', status: 'active' },
      group: { 
        id: 'group-789', 
        name: 'Group A', 
        isLeader: true, 
        isReady: false 
      },
      setGroupReadiness: mockSetGroupReadiness,
    });
  });

  it('should show ready control only for leaders', () => {
    render(<LeaderReadyControl data-testid="leader-control" />);

    expect(screen.getByTestId('leader-control')).toBeInTheDocument();
    expect(screen.getByText('Group Leader')).toBeInTheDocument();
    expect(screen.getByText('You are the leader of Group A')).toBeInTheDocument();
  });

  it('should not render for non-leaders', () => {
    (useStudentStore as jest.Mock).mockReturnValue({
      student: { id: 'student-123', name: 'John Doe' },
      session: { id: 'session-456', status: 'active' },
      group: { 
        id: 'group-789', 
        name: 'Group A', 
        isLeader: false, 
        isReady: false 
      },
      setGroupReadiness: mockSetGroupReadiness,
    });

    const { container } = render(<LeaderReadyControl />);
    expect(container.firstChild).toBeNull();
  });

  it('should emit group:leader_ready event on toggle', async () => {
    const user = userEvent.setup();
    
    render(<LeaderReadyControl />);

    const toggleButton = screen.getByTestId('leader-ready-toggle');
    expect(toggleButton).toHaveTextContent('Mark Ready');

    await user.click(toggleButton);

    expect(mockMarkLeaderReady).toHaveBeenCalledWith('session-456', 'group-789', true);
    expect(mockSetGroupReadiness).toHaveBeenCalledWith(true);
  });

  it('should display current readiness status', () => {
    // Test "not ready" state
    render(<LeaderReadyControl />);
    
    expect(screen.getByText('Not Ready')).toBeInTheDocument();
    expect(screen.getByText('Mark your group as ready when everyone is present')).toBeInTheDocument();
    expect(screen.getByTestId('leader-ready-toggle')).toHaveTextContent('Mark Ready');

    // Test "ready" state
    (useStudentStore as jest.Mock).mockReturnValue({
      student: { id: 'student-123', name: 'John Doe' },
      session: { id: 'session-456', status: 'active' },
      group: { 
        id: 'group-789', 
        name: 'Group A', 
        isLeader: true, 
        isReady: true 
      },
      setGroupReadiness: mockSetGroupReadiness,
    });

    render(<LeaderReadyControl />);

    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('Your group is marked as ready')).toBeInTheDocument();
    expect(screen.getByTestId('leader-ready-toggle')).toHaveTextContent('Mark Not Ready');
  });

  it('should disable when WebSocket disconnected', () => {
    mockIsConnected.mockReturnValue(false);

    render(<LeaderReadyControl />);

    const toggleButton = screen.getByTestId('leader-ready-toggle');
    expect(toggleButton).toBeDisabled();
    
    expect(screen.getByText('Not connected - ready status cannot be updated')).toBeInTheDocument();
  });

  it('should show loading state during update', async () => {
    const user = userEvent.setup();
    
    // Mock a slow websocket call
    mockMarkLeaderReady.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<LeaderReadyControl />);

    const toggleButton = screen.getByTestId('leader-ready-toggle');
    await user.click(toggleButton);

    expect(screen.getByText('Updating...')).toBeInTheDocument();
    expect(toggleButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText('Updating...')).not.toBeInTheDocument();
    });
  });

  it('should handle errors gracefully', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    mockMarkLeaderReady.mockRejectedValue(new Error('WebSocket error'));

    render(<LeaderReadyControl />);

    const toggleButton = screen.getByTestId('leader-ready-toggle');
    await user.click(toggleButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update leader ready status:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('should handle missing required data', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    // Mock missing session data
    (useStudentStore as jest.Mock).mockReturnValue({
      student: { id: 'student-123', name: 'John Doe' },
      session: null,
      group: { 
        id: 'group-789', 
        name: 'Group A', 
        isLeader: true, 
        isReady: false 
      },
      setGroupReadiness: mockSetGroupReadiness,
    });

    render(<LeaderReadyControl />);

    const toggleButton = screen.getByTestId('leader-ready-toggle');
    await user.click(toggleButton);

    expect(consoleSpy).toHaveBeenCalledWith('Missing required data for leader ready toggle');
    expect(mockMarkLeaderReady).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should toggle from ready to not ready', async () => {
    const user = userEvent.setup();

    // Start with ready state
    (useStudentStore as jest.Mock).mockReturnValue({
      student: { id: 'student-123', name: 'John Doe' },
      session: { id: 'session-456', status: 'active' },
      group: { 
        id: 'group-789', 
        name: 'Group A', 
        isLeader: true, 
        isReady: true 
      },
      setGroupReadiness: mockSetGroupReadiness,
    });

    render(<LeaderReadyControl />);

    const toggleButton = screen.getByTestId('leader-ready-toggle');
    expect(toggleButton).toHaveTextContent('Mark Not Ready');

    await user.click(toggleButton);

    expect(mockMarkLeaderReady).toHaveBeenCalledWith('session-456', 'group-789', false);
    expect(mockSetGroupReadiness).toHaveBeenCalledWith(false);
  });

  it('should show appropriate icons for different states', () => {
    // Test not ready state
    render(<LeaderReadyControl />);
    
    // Crown icon should be present
    expect(document.querySelector('.lucide-crown')).toBeInTheDocument();
    // Clock icon for not ready state
    expect(document.querySelector('.lucide-clock')).toBeInTheDocument();

    // Test ready state
    (useStudentStore as jest.Mock).mockReturnValue({
      student: { id: 'student-123', name: 'John Doe' },
      session: { id: 'session-456', status: 'active' },
      group: { 
        id: 'group-789', 
        name: 'Group A', 
        isLeader: true, 
        isReady: true 
      },
      setGroupReadiness: mockSetGroupReadiness,
    });

    render(<LeaderReadyControl />);

    // Crown icon should still be present
    expect(document.querySelector('.lucide-crown')).toBeInTheDocument();
    // Check circle icon for ready state
    expect(document.querySelector('.lucide-check-circle')).toBeInTheDocument();
  });

  it('should apply correct styling for different states', () => {
    // Test not ready styling
    render(<LeaderReadyControl />);
    
    const toggleButton = screen.getByTestId('leader-ready-toggle');
    expect(toggleButton).toHaveClass('bg-blue-600');

    // Test ready styling
    (useStudentStore as jest.Mock).mockReturnValue({
      student: { id: 'student-123', name: 'John Doe' },
      session: { id: 'session-456', status: 'active' },
      group: { 
        id: 'group-789', 
        name: 'Group A', 
        isLeader: true, 
        isReady: true 
      },
      setGroupReadiness: mockSetGroupReadiness,
    });

    render(<LeaderReadyControl />);

    const readyToggleButton = screen.getByTestId('leader-ready-toggle');
    expect(readyToggleButton).toHaveClass('bg-green-600');
  });

  it('should use custom test id when provided', () => {
    render(<LeaderReadyControl data-testid="custom-leader-control" />);

    expect(screen.getByTestId('custom-leader-control')).toBeInTheDocument();
    expect(screen.queryByTestId('leader-ready-control')).not.toBeInTheDocument();
  });
});
