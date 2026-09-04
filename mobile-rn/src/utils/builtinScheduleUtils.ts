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
 * Normalizes teacher names for matching against teacher profile full names.
 */
function normalizeTeacherName(name: string | null | undefined): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/^dr\.?\s+/i, '')
    .replace(/^prof\.?\s+/i, '')
    .replace(/^engr\.?\s+/i, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Filters the built-in timetable dataset to match the active user's profile.
 * - For Teachers: matches by instructor name.
 * - For Students: strictly matches by Degree Program, Active Semester, Session/Batch, and Section (Self Support 1, Self Support 2, Regular).
 * - Exact equality: selectedSection === lectureSection.
 * - Returns empty array if user is not set or if no authentic classes exist for the profile.
 */
export function getBuiltinClassesForUser(user: UserProfile | null | undefined): ClassLecture[] {
  if (!user) return [];

  const master = getBuiltinMasterClasses();

  // 1. Teacher Profile Filtering
  if (user.role === 'teacher') {
    const normUserTeacher = normalizeTeacherName(user.fullName);
    if (!normUserTeacher || normUserTeacher.length < 3) {
      return [];
    }

    return master.filter((c) => {
      const normClsTeacher = normalizeTeacherName(c.teacher);
      return (
        normClsTeacher.includes(normUserTeacher) ||
        normUserTeacher.includes(normClsTeacher)
      );
    });
  }

  // 2. Student Profile Filtering
  const userProg = normalizeProgramKey(user.program);
  const userSem = Number(user.semester) || 0;
  const userBatch = (user.batch || '').trim();
  const userSection: CanonicalSection = normalizeSection(user.type, user.section);

  const matched = master.filter((c) => {
    // A. Degree Program Strict Match
    if (userProg) {
      const clsProg = normalizeProgramKey(c.program);
      if (!clsProg || clsProg.degree !== userProg.degree || clsProg.key !== userProg.key) {
        return false;
      }
    } else {
      return false;
    }

    // B. Semester Strict Match
    if (userSem > 0 && c.semester !== userSem) {
      return false;
    }

    // C. Batch Strict Match (if specified and present in dataset)
    if (userBatch && c.batch && c.batch.trim() && c.batch.trim() !== userBatch) {
      return false;
    }

    // D. Exact Section Match (selectedSection === lectureSection)
    const clsSection = normalizeSection(c.type, c.section);
    if (clsSection !== userSection) {
      return false;
    }

    return true;
  });

  return matched;
}
