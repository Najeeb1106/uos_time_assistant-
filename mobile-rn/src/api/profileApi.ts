import { apiClient } from './client';
import { UserProfile } from '../models/User';

export interface UpdateProfilePayload {
  fullName: string;
  program?: string;
  type?: 'Regular' | 'Self Support 1' | 'Self Support 2';
  batch?: string;
  semester?: number;
  password?: string;
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  user: UserProfile;
}

/**
 * Update current user profile (PUT /api/auth/profile)
 */
export async function updateProfileApi(payload: UpdateProfilePayload): Promise<ProfileResponse> {
  const response = await apiClient.put<ProfileResponse>('/auth/profile', payload);
  return response.data;
}
