import { apiClient } from './client';
import { ClassLecture } from '../models/Schedule';

export interface ScheduleResponse {
  success: boolean;
  message?: string;
  classes?: ClassLecture[];
  pdfFileName?: string | null;
  uploadedAt?: string | null;
}

/**
 * Fetch active schedule for the logged-in student or faculty user
 */
export async function getCurrentScheduleApi(): Promise<ScheduleResponse> {
  const response = await apiClient.get<ScheduleResponse>('/schedule/current');
  return response.data;
}

/**
 * Fetch global master timetable schedule across all university rooms
 */
export async function getGlobalScheduleApi(): Promise<ScheduleResponse> {
  const response = await apiClient.get<ScheduleResponse>('/schedule/global');
  return response.data;
}
