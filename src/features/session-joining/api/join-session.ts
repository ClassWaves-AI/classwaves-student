import { apiClient } from '@/lib/api-client'

export interface JoinSessionRequest {
  sessionCode: string
  studentName: string
  gradeLevel?: string
  dateOfBirth?: string
  email?: string // Add email for group leader identification
}

export interface JoinSessionResponse {
  token: string
  student: { 
    id: string; 
    displayName: string;
    email?: string;
    isGroupLeader: boolean;
    rosterId?: string;
    isFromRoster?: boolean;
  }
  session: { id: string }
  group?: { id: string; name: string; leaderId?: string } | null
}

export async function joinSession(
  data: JoinSessionRequest,
): Promise<JoinSessionResponse> {
  const resp = await apiClient.post<JoinSessionResponse>(
    `/sessions/${data.sessionCode}/join`,
    {
      sessionCode: data.sessionCode,
      studentName: data.studentName,
      gradeLevel: data.gradeLevel,
      dateOfBirth: data.dateOfBirth,
      email: data.email,
    },
  )
  return resp.data
}


