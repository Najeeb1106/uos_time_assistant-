import { ClassLecture } from '../models/Schedule';
import { UserProfile } from '../models/User';
import { normalizeSection, CanonicalSection } from './sectionUtils';
import builtinData from '../constants/builtinTimetable.json';

export const BUILTIN_TIMETABLE_VERSION = '1.2.0';
export const BUILTIN_TIMETABLE_NAME = 'Built-in Department Timetable';
export const BUILTIN_TIMETABLE_UPLOADED_AT = '2026-09-01T00:00:00.000Z';

/**
 * Returns the entire master timetable dataset (968 classes across all computing departments).
 * Used for Free Room Finder and global campus room occupancy calculations.
 */
export function getBuiltinMasterClasses(): ClassLecture[] {
  return builtinData as ClassLecture[];
}

/**
 * Extracts a normalized program key to accurately match computing programs.
 */
export function normalizeProgramKey(p: string | null | undefined): { degree: 'BS' | 'MS' | 'PhD'; key: string } | null {
  if (!p) return null;
  const clean = p.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!clean) return null;

  let degree: 'BS' | 'MS' | 'PhD' = 'BS';
  if (clean.startsWith('phd')) {
    degree = 'PhD';
  } else if (clean.startsWith('ms')) {
    degree = 'MS';
  } else {
    degree = 'BS';
  }

  let key = '';
  if (clean.includes('cyber')) {
    key = 'cybersecurity';
  } else if (clean.includes('software')) {
    key = 'softwareengineering';
  } else if (clean.includes('informationtech') || clean.includes('bsit') || clean.includes('msit') || clean.includes('phdit')) {
    key = 'informationtechnology';
  } else if (clean.includes('datascience')) {
    key = 'datascience';
  } else if (clean.includes('artificialintel') || clean.includes('ai')) {
    key = 'artificialintelligence';
  } else if (clean.includes('cloud')) {
    key = 'cloudcomputing';
  } else if (clean.includes('computer')) {
    key = 'computerscience';
  } else {
    key = clean;
  }

  return { degree, key };
}

/**
 * Normalizes batch strings across en-dashes (–), em-dashes (—), hyphens (-), slashes, and whitespace.
 * e.g., "2023–2027", "2023 - 2027", "2023-2027" -> "2023-2027"
 */
export function normalizeBatch(batch: string | null | undefined): string {
  if (!batch) return '';
  return batch
    .trim()
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\/\\_]/g, '-')
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, '');
}

/**
 * Normalizes teacher names for matching against teacher profile full names.
 */
export function normalizeTeacherName(name: string | null | undefined): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/^dr\.?\s+/i, '')
    .replace(/^prof\.?\s+/i, '')
    .replace(/^engr\.?\s+/i, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Generates a unique, deterministic profile key signature.
 * e.g. "student:bs_informationtechnology:sem6:batch2024-2028:secself support 2"
 */
export function getScheduleProfileKey(user: UserProfile | null | undefined): string {
  if (!user) return 'anonymous';
  if (user.role === 'teacher') {
    const normTeacher = normalizeTeacherName(user.fullName);
    return `teacher:${normTeacher || 'unknown'}`;
  }
  const prog = normalizeProgramKey(user.program);
  const progKey = prog ? `${prog.degree}_${prog.key}` : (user.program || '').trim().toLowerCase();
  const sem = Number(user.semester) || 0;
  const batch = normalizeBatch(user.batch);
  const section = normalizeSection(user.type, user.section);
  return `student:${progKey}:sem${sem}:batch${batch}:sec${section}`.toLowerCase();
}

/**
 * Filters any arbitrary class list (including server response or custom uploaded schedules)
 * to strictly match the active user's academic parameters.
 */
export function filterClassesForUserProfile(
  classes: ClassLecture[] | null | undefined,
  user: UserProfile | null | undefined
): ClassLecture[] {
  if (!classes || !Array.isArray(classes) || classes.length === 0 || !user) {
    return [];
  }

  // Teacher Profile Filtering
  if (user.role === 'teacher') {
    const normUserTeacher = normalizeTeacherName(user.fullName);
    if (!normUserTeacher || normUserTeacher.length < 3) return [];
    return classes.filter((c) => {
      const normClsTeacher = normalizeTeacherName(c.teacher);
      return (
        normClsTeacher.includes(normUserTeacher) ||
        normUserTeacher.includes(normClsTeacher)
      );
    });
  }

  // Student Profile Filtering
  const userProg = normalizeProgramKey(user.program);
  const userSem = Number(user.semester) || 0;
  const userBatch = normalizeBatch(user.batch);
  const userSection: CanonicalSection = normalizeSection(user.type, user.section);

  return classes.filter((c) => {
    // A. Degree Program Strict Match
    if (userProg && c.program) {
      const clsProg = normalizeProgramKey(c.program);
      if (!clsProg || clsProg.degree !== userProg.degree || clsProg.key !== userProg.key) {
        return false;
      }
    }

    // B. Semester Strict Match (Must match exact semester)
    if (userSem > 0 && c.semester !== undefined && Number(c.semester) !== userSem) {
      return false;
    }

    // C. Batch Strict Match (Timetable MUST match BOTH Batch AND Semester together)
    if (userBatch && c.batch) {
      const clsBatch = normalizeBatch(c.batch);
      if (!clsBatch || clsBatch !== userBatch) {
        return false;
      }
    }

    // D. Exact Section Match
    if (c.section || c.type) {
      const clsSection = normalizeSection(c.type, c.section);
      if (clsSection !== userSection) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Filters the built-in timetable dataset to match the active user's profile.
 * - For Teachers: matches by instructor name.
 * - For Students: strictly matches by Degree Program, Active Semester, Session/Batch, and Section.
 * - Timetable MUST be filtered by BOTH Batch and Semester together.
 * - Returns empty array if user is not set or if no authentic classes exist for the profile.
 */
export function getBuiltinClassesForUser(user: UserProfile | null | undefined): ClassLecture[] {
  if (!user) return [];
  const master = getBuiltinMasterClasses();
  return filterClassesForUserProfile(master, user);
}
