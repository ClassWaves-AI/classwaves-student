import { apiClient } from '@/lib/api-client'

export interface KioskAuthRequest {
  sessionCode: string
  groupId: string
  deviceIdentifier: string
}

export interface KioskAuthResponse {
  group_access_token: string
  groupInfo: {
    id: string
    name: string
    sessionId: string
    groupNumber: number
    maxMembers: number
    currentMembers: number
  }
  session: {
    id: string
    title: string
    status: string
  }
  expiresAt: string
}

async function authenticateKiosk(
  data: KioskAuthRequest,
): Promise<KioskAuthResponse> {
  const response = await apiClient.post<KioskAuthResponse>(
    `/kiosk/groups/${data.groupId}/auth`,
    {
      sessionCode: data.sessionCode,
      deviceIdentifier: data.deviceIdentifier,
    },
  )

  if (response.data.group_access_token) {
    localStorage.setItem('group_access_token', response.data.group_access_token)
    localStorage.setItem('groupInfo', JSON.stringify(response.data.groupInfo))
    localStorage.setItem('sessionInfo', JSON.stringify(response.data.session))
  }
  return response.data
}

async function updateGroupStatus(
  groupId: string,
  isReady: boolean,
): Promise<void> {
  await apiClient.post(`/kiosk/groups/${groupId}/status`, {
    isReady,
  })
}

async function leaveGroup(groupId: string): Promise<void> {
  try {
    await apiClient.post(`/kiosk/groups/${groupId}/leave`)
  } finally {
    localStorage.removeItem('group_access_token')
    localStorage.removeItem('groupInfo')
    localStorage.removeItem('sessionInfo')
  }
}

function getStoredGroupInfo(): KioskAuthResponse['groupInfo'] | null {
  const groupInfo = localStorage.getItem('groupInfo')
  return groupInfo ? JSON.parse(groupInfo) : null
}

function isAuthenticated(): boolean {
  return !!localStorage.getItem('group_access_token')
}

export const kioskApi = {
  authenticateKiosk,
  updateGroupStatus,
  leaveGroup,
  getStoredGroupInfo,
  isAuthenticated,
}


