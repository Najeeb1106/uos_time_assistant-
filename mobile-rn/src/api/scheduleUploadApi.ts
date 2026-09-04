import { Platform } from 'react-native';
import { apiClient } from './client';
import { ClassLecture, UserSchedule } from '../models/Schedule';

export interface UploadScheduleResponse {
  success: boolean;
  message?: string;
  classes?: ClassLecture[];
  pdfFileName?: string;
  isScannedFallback?: boolean;
}

export interface SaveScheduleResponse {
  success: boolean;
  message?: string;
  schedule?: UserSchedule;
}

/**
 * Upload PDF timetable file to backend for server-side parsing & coordinate extraction
 */
export async function uploadScheduleApi(
  fileUri: string,
  fileName: string,
  mimeType: string = 'application/pdf'
): Promise<UploadScheduleResponse> {
  const formData = new FormData();

  // Format React Native file object for multipart/form-data upload
  const fileToUpload = {
    uri: Platform.OS === 'android' ? fileUri : fileUri.replace('file://', ''),
    type: mimeType || 'application/pdf',
    name: fileName || 'timetable.pdf',
  };

  formData.append('file', fileToUpload as any);

  const response = await apiClient.post<UploadScheduleResponse>('/schedule/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 30000, // 30s timeout for PDF parsing
  });

  return response.data;
}

/**
 * Save / Confirm parsed timetable schedule to the user's account
 */
export async function saveScheduleApi(
  classes: ClassLecture[],
  pdfFileName: string = 'timetable.pdf'
): Promise<SaveScheduleResponse> {
  const response = await apiClient.post<SaveScheduleResponse>('/schedule', {
    classes,
    pdfFileName,
  });

  return response.data;
}
