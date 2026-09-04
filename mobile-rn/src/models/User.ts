export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: 'student' | 'teacher';
  program?: string;
  type?: 'Regular' | 'Self Support 1' | 'Self Support 2' | 'Weekend Self Support' | string;
  section?: string;
  batch?: string;
  semester?: number;
  department?: string;
  designation?: string;
  employeeId?: string;
  teachingId?: string;
  avatarUri?: string;
  createdAt?: string;
}

export interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
}
