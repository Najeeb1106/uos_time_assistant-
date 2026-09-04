import { apiClient } from './client';
import { UserProfile } from '../models/User';

export interface LoginPayload {
  email: string;
  password: string;
  teachingId?: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  role?: 'student' | 'teacher';
  program?: string;
  type?: string;
  batch?: string;
  semester?: number;
  department?: string;
  designation?: string;
  employeeId?: string;
  teachingId?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: UserProfile;
}

/**
 * Authenticate user with credentials
 */
export async function loginApi(payload: LoginPayload): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/login', payload);
  return response.data;
}

/**
 * Register a new user account
 */
export async function registerApi(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/register', payload);
  return response.data;
}

/**
 * Send password reset email
 */
export async function forgotPasswordApi(email: string): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post<{ success: boolean; message: string }>('/auth/forgot-password', { email });
  return response.data;
}

/**
 * Fetch current authenticated user profile
 */
export async function getCurrentUserApi(): Promise<{ success: boolean; user: UserProfile }> {
  const response = await apiClient.get<{ success: boolean; user: UserProfile }>('/auth/me');
  return response.data;
}
