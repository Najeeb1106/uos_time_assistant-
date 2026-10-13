import { ACADEMIC_PROGRAMS } from './academicRegistry';

export interface DegreeProgramOption {
  value: string;
  label: string;
}

export const DEGREE_PROGRAMS: DegreeProgramOption[] = ACADEMIC_PROGRAMS.map((p) => ({
  value: p.officialPdfName,
  label: p.label,
}));

