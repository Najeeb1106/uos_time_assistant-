import builtinData from '../constants/builtinTimetable.json';
import { normalizeProgramKey, normalizeBatch } from './builtinScheduleUtils';
import {
  findProgramByOfficialOrLegacyName,
  generateDynamicBatches as registryGenerateBatches,
} from '../constants/academicRegistry';

const CURRENT_CALENDAR_YEAR = new Date().getFullYear();
const MAX_FUTURE_START_YEAR = Math.max(CURRENT_CALENDAR_YEAR + 12, 2038);

/**
 * Standard selectable start years for university cohorts (2018 up to at least 10 years beyond current year).
 */
export const START_YEAR_OPTIONS: string[] = (() => {
  const years: string[] = [];
  for (let y = 2018; y <= MAX_FUTURE_START_YEAR; y++) {
    years.push(String(y));
  }
  return years;
})();

/**
 * Standard selectable end years (up to 2045).
 */
export const ALL_END_YEARS: string[] = (() => {
  const years: string[] = [];
  for (let y = 2020; y <= MAX_FUTURE_START_YEAR + 6; y++) {
    years.push(String(y));
  }
  return years;
})();

/**
 * Dynamically generates a descending list of valid YYYY-YYYY batches for a program.
 * Accommodates 4-year BS, 2-year/3-year MS, and 3-year PhD cohorts.
 * Generates batches for at least 10 years beyond the current year plus historical batches back to 2018.
 */
export function getDynamicProgramBatches(program?: string | null, degreeLevel?: string | null): string[] {
  const pDef = findProgramByOfficialOrLegacyName(program);
  if (pDef) {
    return registryGenerateBatches(pDef, 2018, 10);
  }

  // Fallback based on degreeLevel or heuristic
  const isPostGrad = (degreeLevel === 'MS' || degreeLevel === 'PhD') ||
    (program && (program.includes('MS') || program.includes('PhD')));
  const duration = isPostGrad ? 2 : 4;

  const batches = new Set<string>();
  for (let s = MAX_FUTURE_START_YEAR; s >= 2018; s--) {
    batches.add(`${s}-${s + duration}`);
    if (isPostGrad) {
      batches.add(`${s}-${s + 3}`); // Support 3-year MS cohorts like MS AI
    }
  }
  return Array.from(batches).sort((a, b) => b.localeCompare(a));
}

/**
 * Returns available end year options for a given start year.
 * Only years strictly greater than startYear are returned to prevent invalid intervals.
 */
export function getEndYearOptions(startYear?: string | number | null): string[] {
  if (!startYear) return ALL_END_YEARS;
  const startNum = Number(startYear);
  if (isNaN(startNum)) return ALL_END_YEARS;

  const valid = ALL_END_YEARS.filter((y) => Number(y) > startNum);
  if (valid.length > 0) return valid;

  // Fallback if startYear is at the upper edge
  return [
    String(startNum + 1),
    String(startNum + 2),
    String(startNum + 3),
    String(startNum + 4),
    String(startNum + 5),
  ];
}

/**
 * Parses a combined batch string (e.g. "2026-2030" or "2026 - 2030")
 * into its individual startYear and endYear components.
 */
export function parseBatch(batch: string | null | undefined): {
  startYear: string;
  endYear: string;
} {
  if (!batch) return { startYear: '', endYear: '' };
  const cleaned = batch.replace(/\s+/g, '');
  const parts = cleaned.split('-');
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return { startYear: parts[0], endYear: parts[1] };
  }
  return { startYear: '', endYear: '' };
}

/**
 * Combines startYear and endYear into a canonical batch string (e.g. "2026-2030").
 */
export function formatBatch(
  startYear: string | number | null | undefined,
  endYear: string | number | null | undefined
): string {
  const s = String(startYear || '').trim();
  const e = String(endYear || '').trim();
  if (s && e) return `${s}-${e}`;
  if (s) return s;
  return '';
}

/**
 * Derives all unique, valid batch strings for a given program and semester
 * directly from the builtin timetable dataset.
 *
 * Returns batches sorted in descending order (newest cohort first).
 *
 * @param program - Full program name, e.g. 'BS in Artificial Intelligence'
 * @param semester - Semester number, e.g. 1 or 2
 * @returns Sorted array of unique batch strings that have real timetable data
 */
export function getValidBatches(
  program: string | null | undefined,
  semester: number | null | undefined
): string[] {
  if (!program || !semester) return [];

  const userProg = normalizeProgramKey(program);
  if (!userProg) return [];

  const sem = Number(semester);
  if (!sem || sem <= 0) return [];

  const batches = new Set<string>();

  for (const cls of builtinData as any[]) {
    if (!cls.program || !cls.batch || cls.semester === undefined) continue;
    if (Number(cls.semester) !== sem) continue;

    const clsProg = normalizeProgramKey(cls.program);
    if (!clsProg) continue;
    if (clsProg.degree !== userProg.degree || clsProg.key !== userProg.key) continue;

    const b = normalizeBatch(cls.batch);
    if (b) batches.add(b);
  }

  // Sort descending (newest batch year first)
  return Array.from(batches).sort((a, b) => b.localeCompare(a));
}

/**
 * Returns the single recommended batch for a (program, semester) pair when
 * exactly one batch exists in the timetable for that combination.
 *
 * Returns null when:
 *  - No timetable data exists for the combination (unknown program/sem)
 *  - Multiple valid batches exist (user must choose explicitly)
 *
 * @param program - Full program name
 * @param semester - Semester number
 * @returns The unique batch string, or null
 */
export function getSuggestedBatch(
  program: string | null | undefined,
  semester: number | null | undefined
): string | null {
  const valid = getValidBatches(program, semester);
  return valid.length === 1 ? valid[0] : null;
}

