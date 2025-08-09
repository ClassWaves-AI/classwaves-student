import { apiClient } from '@/lib/api-client'

export interface JoinSessionRequest {
  sessionCode: string
  studentName: string
  gradeLevel?: string
  dateOfBirth?: string
}

export interface JoinSessionResponse {
  token: string
  student: { id: string; displayName: string }
  session: { id: string }
  group?: { id: string; name: string } | null
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
    },
  )
  return resp.data
}


