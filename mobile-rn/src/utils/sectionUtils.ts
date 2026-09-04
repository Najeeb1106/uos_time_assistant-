export type CanonicalSection = 'Regular' | 'Self Support 1' | 'Self Support 2';

/**
 * Normalizes any section/type representation to one of the 3 canonical sections:
 * 'Regular', 'Self Support 1', or 'Self Support 2'.
 * Strict exact matching with harmless whitespace and casing tolerance.
 */
export function normalizeSection(
  type?: string | null,
  section?: string | number | null
): CanonicalSection {
  const cleanType = String(type || '').trim();
  const cleanSec = String(section || '').trim();

  // 1. Explicit 'Self Support 2' in the type string (highest priority)
  if (/self\s*support\s*2/i.test(cleanType)) {
    return 'Self Support 2';
  }

  // 2. Explicit 'Self Support 1' in the type string
  if (/self\s*support\s*1/i.test(cleanType)) {
    return 'Self Support 1';
  }

  // 3. Generic 'Self Support' type + explicit section digit in the section field
  if (/self/i.test(cleanType) && (cleanSec === '2' || cleanSec === '02')) {
    return 'Self Support 2';
  }
  if (/self/i.test(cleanType) && (cleanSec === '1' || cleanSec === '01')) {
    return 'Self Support 1';
  }

  // 4. Bare 'Self Support' with no usable section number — cannot determine which section.
  //    Return Regular to avoid a silent wrong-section match rather than guessing.
  if (/self/i.test(cleanType)) {
    return 'Regular';
  }

  // 5. Everything else is Regular
  return 'Regular';
}

/**
 * Derives the exact canonical section display string for any lecture record:
 * Returns 'Regular', 'Self Support 1', or 'Self Support 2'.
 */
export function getClassSectionDisplay(cls: {
  type?: string | null;
  section?: string | number | null;
}): CanonicalSection {
  if (!cls) return 'Regular';
  return normalizeSection(cls.type, cls.section);
}
