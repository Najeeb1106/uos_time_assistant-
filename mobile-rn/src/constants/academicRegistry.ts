/**
 * SchedUOS Academic Registry
 * Centralized, extensible source of truth for:
 * - Departments & internal timetable mappings
 * - Degree Levels (BS, MS, PhD)
 * - Programs & Specializations (preserving official PDF names)
 * - Batch ranges, durations, study shifts, and sections
 */

export type DepartmentId = 'cs' | 'se' | 'it' | 'ai' | 'cys' | 'ds';
export type DegreeLevel = 'BS' | 'MS' | 'PhD';
export type IntakeTerm = 'Fall' | 'Spring';
export type StudyShift = 'Regular' | 'Self Support' | 'Weekend Self Support';

export interface DepartmentOption {
  id: DepartmentId;
  name: string;
  code: string;
  timetableSource: 'CS' | 'SE' | 'IT';
}

export interface ProgramDefinition {
  id: string;
  label: string;
  officialPdfName: string;
  departmentId: DepartmentId;
  degreeLevel: DegreeLevel;
  durationYears: number;
  availableDurations?: number[];
  allowedIntakes: IntakeTerm[];
  allowedShifts: StudyShift[];
  sectionsByShift: {
    'Regular'?: string[];
    'Self Support'?: string[];
    'Weekend Self Support'?: string[];
  };
}

export const DEPARTMENTS: DepartmentOption[] = [
  { id: 'cs', name: 'Computer Science', code: 'CS', timetableSource: 'CS' },
  { id: 'se', name: 'Software Engineering', code: 'SE', timetableSource: 'SE' },
  { id: 'it', name: 'Information Technology', code: 'IT', timetableSource: 'IT' },
  { id: 'ai', name: 'Artificial Intelligence', code: 'AI', timetableSource: 'CS' },
  { id: 'cys', name: 'Cyber Security', code: 'CYS', timetableSource: 'IT' },
  { id: 'ds', name: 'Data Science', code: 'DS', timetableSource: 'CS' },
];

export const DEGREE_LEVELS: DegreeLevel[] = ['BS', 'MS', 'PhD'];

export const INTAKE_TERMS: IntakeTerm[] = ['Fall', 'Spring'];

export const SEMESTER_OPTIONS = [
  { value: 1, label: 'Semester 1' },
  { value: 2, label: 'Semester 2' },
  { value: 3, label: 'Semester 3' },
  { value: 4, label: 'Semester 4' },
  { value: 5, label: 'Semester 5' },
  { value: 6, label: 'Semester 6' },
  { value: 7, label: 'Semester 7' },
  { value: 8, label: 'Semester 8' },
];

export const ACADEMIC_PROGRAMS: ProgramDefinition[] = [
  // ── 1. Computer Science (CS) ──────────────────────────────────────────
  {
    id: 'bs_cs',
    label: 'BS Computer Science',
    officialPdfName: 'BS in Computer Science',
    departmentId: 'cs',
    degreeLevel: 'BS',
    durationYears: 4,
    allowedIntakes: ['Fall', 'Spring'],
    allowedShifts: ['Regular', 'Self Support'],
    sectionsByShift: {
      'Regular': ['1'],
      'Self Support': ['1', '2'],
    },
  },
  {
    id: 'ms_cs',
    label: 'MS Computer Science',
    officialPdfName: 'MS in Computer Science',
    departmentId: 'cs',
    degreeLevel: 'MS',
    durationYears: 2,
    availableDurations: [2, 3],
    allowedIntakes: ['Fall', 'Spring'],
    allowedShifts: ['Self Support', 'Regular'],
    sectionsByShift: {
      'Self Support': ['1'],
      'Regular': ['1'],
    },
  },
  {
    id: 'phd_cs',
    label: 'PhD Computer Science',
    officialPdfName: 'PhD in Computer Science',
    departmentId: 'cs',
    degreeLevel: 'PhD',
    durationYears: 2,
    availableDurations: [2, 3],
    allowedIntakes: ['Fall', 'Spring'],
    allowedShifts: ['Self Support'],
    sectionsByShift: {
      'Self Support': ['1'],
    },
  },

  // ── 2. Software Engineering (SE) ──────────────────────────────────────
  {
    id: 'bs_se',
    label: 'BS Software Engineering',
    officialPdfName: 'BS in Software Engineering',
    departmentId: 'se',
    degreeLevel: 'BS',
    durationYears: 4,
    allowedIntakes: ['Fall', 'Spring'],
    allowedShifts: ['Regular', 'Self Support'],
    sectionsByShift: {
      'Regular': ['1'],
      'Self Support': ['1', '2'],
    },
  },
  {
    id: 'bs_cs_spec_se',
    label: 'BS CS (Spec. in Software Engineering)',
    officialPdfName: 'BS in Computer Science - Specialization in Software Engineering',
    departmentId: 'se',
    degreeLevel: 'BS',
    durationYears: 4,
    allowedIntakes: ['Fall'],
    allowedShifts: ['Regular', 'Self Support'],
    sectionsByShift: {
      'Regular': ['1'],
      'Self Support': ['1'],
    },
  },
  {
    id: 'bs_cs_spec_ds_se',
    label: 'BS CS (Spec. in Data Science - SE Dept)',
    officialPdfName: 'BS in Computer Science - Specialization in Data Science',
    departmentId: 'se',
    degreeLevel: 'BS',
    durationYears: 4,
    allowedIntakes: ['Fall'],
    allowedShifts: ['Regular'],
    sectionsByShift: {
      'Regular': ['1'],
    },
  },
  {
    id: 'ms_se',
    label: 'MS Software Engineering',
    officialPdfName: 'MS in Software Engineering',
    departmentId: 'se',
    degreeLevel: 'MS',
    durationYears: 2,
    availableDurations: [2, 3, 4],
    allowedIntakes: ['Fall', 'Spring'],
    allowedShifts: ['Self Support', 'Regular'],
    sectionsByShift: {
      'Self Support': ['1'],
      'Regular': ['1'],
    },
  },
  {
    id: 'ms_se_weekend',
    label: 'MS Software Engineering (Weekend)',
    officialPdfName: 'MS in Software Engineering (Weekend)',
    departmentId: 'se',
    degreeLevel: 'MS',
    durationYears: 2,
    availableDurations: [2, 3, 4],
    allowedIntakes: ['Fall', 'Spring'],
    allowedShifts: ['Weekend Self Support'],
    sectionsByShift: {
      'Weekend Self Support': ['1'],
    },
  },
  {
    id: 'phd_se',
    label: 'PhD Software Engineering',
    officialPdfName: 'PhD in Software Engineering',
    departmentId: 'se',
    degreeLevel: 'PhD',
    durationYears: 3,
    availableDurations: [2, 3],
    allowedIntakes: ['Fall', 'Spring'],
    allowedShifts: ['Self Support'],
    sectionsByShift: {
      'Self Support': ['1'],
    },
  },

  // ── 3. Information Technology (IT) ────────────────────────────────────
  {
    id: 'bs_it',
    label: 'BS Information Technology',
    officialPdfName: 'BS in Information Technology',
    departmentId: 'it',
    degreeLevel: 'BS',
    durationYears: 4,
    allowedIntakes: ['Fall', 'Spring'],
    allowedShifts: ['Regular', 'Self Support'],
    sectionsByShift: {
      'Regular': ['0', '1'],
      'Self Support': ['1', '2'],
    },
  },
  {
    id: 'bs_cs_spec_it',
    label: 'BS CS (Spec. in Information Technology)',
    officialPdfName: 'BS in Computer Science - Specialization in Information Technology',
    departmentId: 'it',
    degreeLevel: 'BS',
    durationYears: 4,
    allowedIntakes: ['Fall'],
    allowedShifts: ['Regular', 'Self Support'],
    sectionsByShift: {
      'Regular': ['0', '1'],
      'Self Support': ['1'],
    },
  },
  {
    id: 'bs_cs_spec_cloud',
    label: 'BS CS (Spec. in Cloud Computing)',
    officialPdfName: 'BS in Computer Science - Specialization in Cloud Computing',
    departmentId: 'it',
    degreeLevel: 'BS',
    durationYears: 4,
    allowedIntakes: ['Fall'],
    allowedShifts: ['Regular'],
    sectionsByShift: {
      'Regular': ['0', '1'],
    },
  },
  {
    id: 'ms_it',
    label: 'MS Information Technology',
    officialPdfName: 'MS in Information Technology',
    departmentId: 'it',
    degreeLevel: 'MS',
    durationYears: 2,
    availableDurations: [2, 4],
    allowedIntakes: ['Fall', 'Spring'],
    allowedShifts: ['Self Support'],
    sectionsByShift: {
      'Self Support': ['0', '1'],
    },
  },
  {
    id: 'phd_it',
    label: 'PhD Information Technology (Weekend)',
    officialPdfName: 'PhD in Information Technology',
    departmentId: 'it',
    degreeLevel: 'PhD',
    durationYears: 3,
    availableDurations: [2, 3],
    allowedIntakes: ['Fall', 'Spring'],
    allowedShifts: ['Weekend Self Support', 'Self Support'],
    sectionsByShift: {
      'Weekend Self Support': ['1'],
      'Self Support': ['1'],
    },
  },

  // ── 4. Artificial Intelligence (AI) ───────────────────────────────────
  {
    id: 'bs_ai',
    label: 'BS Artificial Intelligence',
    officialPdfName: 'BS in Artificial Intelligence',
    departmentId: 'ai',
    degreeLevel: 'BS',
    durationYears: 4,
    allowedIntakes: ['Fall', 'Spring'],
    allowedShifts: ['Regular', 'Self Support'],
    sectionsByShift: {
      'Regular': ['1'],
      'Self Support': ['1', '2'],
    },
  },
  {
    id: 'ms_ai',
    label: 'MS Artificial Intelligence',
    officialPdfName: 'MS in Artificial Intelligence',
    departmentId: 'ai',
    degreeLevel: 'MS',
    durationYears: 2,
    availableDurations: [2, 3],
    allowedIntakes: ['Fall', 'Spring'],
    allowedShifts: ['Self Support'],
    sectionsByShift: {
      'Self Support': ['1'],
    },
  },
  {
    id: 'phd_ai',
    label: 'PhD Artificial Intelligence',
    officialPdfName: 'PhD in Artificial Intelligence',
    departmentId: 'ai',
    degreeLevel: 'PhD',
    durationYears: 3,
    availableDurations: [2, 3],
    allowedIntakes: ['Fall', 'Spring'],
    allowedShifts: ['Self Support'],
    sectionsByShift: {
      'Self Support': ['1'],
    },
  },

  // ── 5. Cyber Security (CYS) ───────────────────────────────────────────
  {
    id: 'bs_cys',
    label: 'BS Cyber Security',
    officialPdfName: 'BS in Cyber Security',
    departmentId: 'cys',
    degreeLevel: 'BS',
    durationYears: 4,
    allowedIntakes: ['Fall', 'Spring'],
    allowedShifts: ['Regular', 'Self Support'],
    sectionsByShift: {
      'Regular': ['0', '1'],
      'Self Support': ['1', '2'],
    },
  },
  {
    id: 'ms_cys',
    label: 'MS Cyber Security',
    officialPdfName: 'MS in Cyber Security',
    departmentId: 'cys',
    degreeLevel: 'MS',
    durationYears: 2,
    availableDurations: [2, 3],
    allowedIntakes: ['Fall', 'Spring'],
    allowedShifts: ['Self Support'],
    sectionsByShift: {
      'Self Support': ['1'],
    },
  },
  {
    id: 'phd_cys',
    label: 'PhD Cyber Security',
    officialPdfName: 'PhD in Cyber Security',
    departmentId: 'cys',
    degreeLevel: 'PhD',
    durationYears: 3,
    availableDurations: [2, 3],
    allowedIntakes: ['Fall', 'Spring'],
    allowedShifts: ['Self Support'],
    sectionsByShift: {
      'Self Support': ['1'],
    },
  },

  // ── 6. Data Science (DS) ──────────────────────────────────────────────
  {
    id: 'bs_ds',
    label: 'BS Data Science',
    officialPdfName: 'BS in Data Science',
    departmentId: 'ds',
    degreeLevel: 'BS',
    durationYears: 4,
    allowedIntakes: ['Fall', 'Spring'],
    allowedShifts: ['Regular', 'Self Support'],
    sectionsByShift: {
      'Regular': ['1'],
      'Self Support': ['1', '2'],
    },
  },
  {
    id: 'ms_ds',
    label: 'MS Data Science',
    officialPdfName: 'MS in Data Science',
    departmentId: 'ds',
    degreeLevel: 'MS',
    durationYears: 2,
    availableDurations: [2, 3],
    allowedIntakes: ['Fall', 'Spring'],
    allowedShifts: ['Self Support'],
    sectionsByShift: {
      'Self Support': ['1'],
    },
  },
  {
    id: 'phd_ds',
    label: 'PhD Data Science',
    officialPdfName: 'PhD in Data Science',
    departmentId: 'ds',
    degreeLevel: 'PhD',
    durationYears: 3,
    availableDurations: [2, 3],
    allowedIntakes: ['Fall', 'Spring'],
    allowedShifts: ['Self Support'],
    sectionsByShift: {
      'Self Support': ['1'],
    },
  },
];

// ── Registry Lookup Helpers ─────────────────────────────────────────────

export function getDepartments(): DepartmentOption[] {
  return DEPARTMENTS;
}

export function getDepartmentById(id?: string | null): DepartmentOption | undefined {
  if (!id) return undefined;
  return DEPARTMENTS.find((d) => d.id === id || d.name.toLowerCase() === id.toLowerCase() || d.code.toLowerCase() === id.toLowerCase());
}

export function getProgramsByDepartmentAndLevel(
  departmentId: DepartmentId | string,
  degreeLevel: DegreeLevel | string
): ProgramDefinition[] {
  return ACADEMIC_PROGRAMS.filter(
    (p) => p.departmentId === departmentId && p.degreeLevel === degreeLevel
  );
}

export function getProgramById(id?: string | null): ProgramDefinition | undefined {
  if (!id) return undefined;
  return ACADEMIC_PROGRAMS.find((p) => p.id === id);
}

export function findProgramByOfficialOrLegacyName(name?: string | null): ProgramDefinition | undefined {
  if (!name) return undefined;
  const clean = name.trim().toLowerCase();
  // Exact or official match
  const exact = ACADEMIC_PROGRAMS.find(
    (p) => p.officialPdfName.toLowerCase() === clean || p.label.toLowerCase() === clean || p.id === clean
  );
  if (exact) return exact;

  // Normalized alphanumeric match
  const norm = clean.replace(/[^a-z0-9]/g, '');
  return ACADEMIC_PROGRAMS.find((p) => {
    const pNorm = p.officialPdfName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const lNorm = p.label.toLowerCase().replace(/[^a-z0-9]/g, '');
    return pNorm === norm || lNorm === norm;
  });
}

export function getAvailableShiftsForProgram(programDef?: ProgramDefinition | null): StudyShift[] {
  if (!programDef) return ['Regular', 'Self Support'];
  return programDef.allowedShifts;
}

export function getAvailableSectionsForShift(
  programDef?: ProgramDefinition | null,
  shift?: StudyShift | string | null
): string[] {
  if (!programDef || !shift) return ['1'];
  const sections = programDef.sectionsByShift[shift as StudyShift];
  if (sections && sections.length > 0) return sections;
  if (shift === 'Self Support') return ['1', '2'];
  return ['1'];
}

/**
 * Dynamically generates valid batch strings (YYYY-YYYY) for a program based on its
 * standard duration and verified alternative durations (e.g., 3-year MS AI cohorts).
 * Generates options for at least 10 years beyond current year, plus historical batches back to 2018.
 */
export function generateDynamicBatches(
  programDef?: ProgramDefinition | null,
  startYearMin = 2018,
  yearsAhead = 10
): string[] {
  const currentYear = new Date().getFullYear();
  const maxStartYear = Math.max(currentYear + yearsAhead, 2038);
  const batches = new Set<string>();

  const durations = programDef?.availableDurations && programDef.availableDurations.length > 0
    ? programDef.availableDurations
    : [programDef?.durationYears || 4];

  for (let start = maxStartYear; start >= startYearMin; start--) {
    for (const d of durations) {
      batches.add(`${start}-${start + d}`);
    }
  }

  // Descending sort (newest cohorts first)
  return Array.from(batches).sort((a, b) => b.localeCompare(a));
}

/**
 * Converts a (studyShift, sectionNumber) pair into the canonical legacy `type` string.
 * Ensures full backward compatibility with existing users, backend filters, and cache keys.
 */
export function deriveLegacyType(shift?: StudyShift | string | null, sectionNumber?: string | number | null): string {
  const cleanShift = String(shift || 'Regular').trim();
  const cleanSec = String(sectionNumber || '1').trim();

  if (cleanShift === 'Weekend Self Support') {
    return 'Weekend Self Support';
  }
  if (cleanShift === 'Self Support') {
    if (cleanSec === '0') return 'Self Support 0';
    if (cleanSec === '2') return 'Self Support 2';
    return 'Self Support 1';
  }
  // Regular
  if (cleanSec === '0') return 'Regular 0';
  if (cleanSec === '2') return 'Regular 2';
  return 'Regular';
}

/**
 * Decomposes a legacy `type` string into canonical `studyShift` and `sectionNumber`.
 */
export function parseLegacyType(typeStr?: string | null): { studyShift: StudyShift; sectionNumber: string } {
  const clean = String(typeStr || '').trim().toLowerCase();

  if (clean.includes('weekend')) {
    return { studyShift: 'Weekend Self Support', sectionNumber: '1' };
  }
  if (clean.includes('self')) {
    if (clean.includes('2')) return { studyShift: 'Self Support', sectionNumber: '2' };
    if (clean.includes('0')) return { studyShift: 'Self Support', sectionNumber: '0' };
    return { studyShift: 'Self Support', sectionNumber: '1' };
  }
  if (clean.includes('0')) {
    return { studyShift: 'Regular', sectionNumber: '0' };
  }
  if (clean.includes('2')) {
    return { studyShift: 'Regular', sectionNumber: '2' };
  }
  return { studyShift: 'Regular', sectionNumber: '1' };
}
