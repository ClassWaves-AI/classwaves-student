import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add group access token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('group_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('group_access_token');
      localStorage.removeItem('groupInfo');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export interface KioskAuthRequest {
  sessionCode: string;
  groupId: string;
  deviceIdentifier: string;
}

export interface KioskAuthResponse {
  group_access_token: string;
  groupInfo: {
    id: string;
    name: string;
    sessionId: string;
    groupNumber: number;
    maxMembers: number;
    currentMembers: number;
  };
  session: {
    id: string;
    title: string;
    status: string;
  };
  expiresAt: string;
}

export const kioskApi = {
  async authenticateKiosk(data: KioskAuthRequest): Promise<KioskAuthResponse> {
    const response = await apiClient.post<KioskAuthResponse>(`/kiosk/groups/${data.groupId}/auth`, {
      sessionCode: data.sessionCode,
      deviceIdentifier: data.deviceIdentifier,
    });
    
    // Store the group access token and group info
    if (response.data.group_access_token) {
      localStorage.setItem('group_access_token', response.data.group_access_token);
      localStorage.setItem('groupInfo', JSON.stringify(response.data.groupInfo));
      localStorage.setItem('sessionInfo', JSON.stringify(response.data.session));
    }
    return response.data;
  },

  async updateGroupStatus(groupId: string, isReady: boolean): Promise<void> {
    await apiClient.post(`/kiosk/groups/${groupId}/status`, {
      isReady,
    });
  },

  async leaveGroup(groupId: string): Promise<void> {
    try {
      await apiClient.post(`/kiosk/groups/${groupId}/leave`);
    } finally {
      // Always clear local storage, even if the API call fails
      localStorage.removeItem('group_access_token');
      localStorage.removeItem('groupInfo');
      localStorage.removeItem('sessionInfo');
    }
  },

  // Helper method to get stored group info
  getStoredGroupInfo(): KioskAuthResponse['groupInfo'] | null {
    const groupInfo = localStorage.getItem('groupInfo');
    return groupInfo ? JSON.parse(groupInfo) : null;
  },

  // Helper method to check if authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('group_access_token');
  },
};