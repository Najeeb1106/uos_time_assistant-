export interface ClassLecture {
  classId: string;
  name: string;
  code: string;
  room: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' | string;
  startTime: string;
  endTime: string;
  teacher: string;
  batch?: string;
  semester?: number;
  type?: string;
  section?: string;
  program?: string;
  isPractical?: boolean;
  page?: number;
}

export interface UserSchedule {
  uid: string;
  classes: ClassLecture[];
  pdfFileName: string | null;
  uploadedAt: string | null;
  isBuiltin?: boolean;
}
