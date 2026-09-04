import { getBuiltinClassesForUser } from '../utils/builtinScheduleUtils';
import { normalizeSection, getClassSectionDisplay } from '../utils/sectionUtils';
import { UserProfile } from '../models/User';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export function runSectionFilterTests() {
  const baseProfile: UserProfile = {
    uid: 'test_student_123',
    email: 'student@uos.edu.pk',
    fullName: 'Cyber Student',
    role: 'student',
    program: 'BS in Cyber Security',
    semester: 3,
    batch: '2025-2029',
  };

  // Test 1: normalizeSection exact mappings and formatting tolerance
  assert(normalizeSection('Regular') === 'Regular', 'Regular must normalize to Regular');
  assert(normalizeSection('regular') === 'Regular', 'regular must normalize to Regular');
  assert(normalizeSection('Regular 0') === 'Regular', 'Regular 0 must normalize to Regular');

  assert(normalizeSection('Self Support 1') === 'Self Support 1', 'Self Support 1 must normalize to Self Support 1');
  assert(normalizeSection('self support 1') === 'Self Support 1', 'self support 1 must normalize to Self Support 1');
  assert(normalizeSection('Self Support', '1') === 'Self Support 1', 'Self Support + 1 must normalize to Self Support 1');

  assert(normalizeSection('Self Support 2') === 'Self Support 2', 'Self Support 2 must normalize to Self Support 2');
  assert(normalizeSection('self support 2') === 'Self Support 2', 'self support 2 must normalize to Self Support 2');
  assert(normalizeSection('Self Support', '2') === 'Self Support 2', 'Self Support + 2 must normalize to Self Support 2');

  // Safe fallback: bare 'Self Support' with no usable section number must NOT guess SS1
  assert(normalizeSection('Self Support', '') === 'Regular', 'Bare Self Support with empty section must return Regular (safe fallback)');
  assert(normalizeSection('Self Support', '0') === 'Regular', 'Bare Self Support with section 0 must return Regular (safe fallback)');
  assert(normalizeSection('Self Support') === 'Regular', 'Bare Self Support with no section must return Regular (safe fallback)');

  // Test 2: Cyber Security Semester 3, 2025-2029, Self Support 2 gets ONLY Self Support 2 classes
  const userSS2: UserProfile = {
    ...baseProfile,
    type: 'Self Support 2',
    section: '2',
  };

  const classesSS2 = getBuiltinClassesForUser(userSS2);
  assert(classesSS2.length === 12, `Expected 12 classes for SS2, got ${classesSS2.length}`);

  classesSS2.forEach((cls) => {
    const sectionLabel = getClassSectionDisplay(cls);
    assert(sectionLabel === 'Self Support 2', `Display label must be Self Support 2, got ${sectionLabel}`);
    assert(cls.semester === 3, `Semester must be 3, got ${cls.semester}`);
  });

  // Ensure Artificial Intelligence on Tuesday 11:30 is present (SS2 course)
  const hasAiSS2 = classesSS2.some(
    (c) => c.name.includes('Artificial Intelligence') && c.day === 'Tuesday' && c.startTime === '11:30'
  );
  assert(hasAiSS2, 'SS2 should contain Tuesday 11:30 AI lecture');

  // Ensure SS1 Friday Artificial Intelligence (14:00) is NOT present in SS2
  const hasAiSS1 = classesSS2.some(
    (c) => c.name.includes('Artificial Intelligence') && c.day === 'Friday' && c.startTime === '14:00'
  );
  assert(!hasAiSS1, 'SS2 must NOT contain Friday 14:00 AI lecture from SS1');

  // Test 3: Cyber Security Semester 3, 2025-2029, Self Support 1 gets ONLY Self Support 1 classes
  const userSS1: UserProfile = {
    ...baseProfile,
    type: 'Self Support 1',
    section: '1',
  };

  const classesSS1 = getBuiltinClassesForUser(userSS1);
  assert(classesSS1.length === 16, `Expected 16 classes for SS1, got ${classesSS1.length}`);

  classesSS1.forEach((cls) => {
    const sectionLabel = getClassSectionDisplay(cls);
    assert(sectionLabel === 'Self Support 1', `Display label must be Self Support 1, got ${sectionLabel}`);
    assert(cls.semester === 3, `Semester must be 3, got ${cls.semester}`);
  });

  // Test 4: Cyber Security Semester 3, 2025-2029, Regular gets ONLY Regular classes
  const userReg: UserProfile = {
    ...baseProfile,
    type: 'Regular',
    section: 'Regular',
  };

  const classesReg = getBuiltinClassesForUser(userReg);
  assert(classesReg.length === 14, `Expected 14 classes for Regular, got ${classesReg.length}`);

  classesReg.forEach((cls) => {
    const sectionLabel = getClassSectionDisplay(cls);
    assert(sectionLabel === 'Regular', `Display label must be Regular, got ${sectionLabel}`);
    assert(cls.semester === 3, `Semester must be 3, got ${cls.semester}`);
  });

  // Test 5: Zero overlap between Self Support 1 and Self Support 2 datasets
  const ss1Fingerprints = new Set(
    classesSS1.map((c) => `${c.day}_${c.startTime}_${c.endTime}_${c.code}_${c.room}`)
  );

  const overlap = classesSS2.filter((c) =>
    ss1Fingerprints.has(`${c.day}_${c.startTime}_${c.endTime}_${c.code}_${c.room}`)
  );

  assert(overlap.length === 0, `Expected 0 overlap between SS1 and SS2, found ${overlap.length}`);

  // Test 6: Same course (Data Structures) in different sections has isolated schedule slots
  const dsSS1 = getBuiltinClassesForUser({ ...baseProfile, type: 'Self Support 1' }).filter(
    (c) => c.name.includes('Data Structures')
  );
  const dsSS2 = getBuiltinClassesForUser({ ...baseProfile, type: 'Self Support 2' }).filter(
    (c) => c.name.includes('Data Structures')
  );
  const dsReg = getBuiltinClassesForUser({ ...baseProfile, type: 'Regular' }).filter(
    (c) => c.name.includes('Data Structures')
  );

  assert(dsSS1.length === 4, `Expected 4 DS classes in SS1, got ${dsSS1.length}`);
  assert(dsSS2.length === 4, `Expected 4 DS classes in SS2, got ${dsSS2.length}`);
  assert(dsReg.length === 4, `Expected 4 DS classes in Regular, got ${dsReg.length}`);

  // Verify room/instructor distinction for Thursday slot
  const thursSS1 = dsSS1.find((c) => c.day === 'Thursday' && c.startTime === '14:00');
  const thursSS2 = dsSS2.find((c) => c.day === 'Thursday' && c.startTime === '14:00');
  if (!thursSS1 || !thursSS2) {
    throw new Error('Both SS1 and SS2 must have Thursday 14:00 slot');
  }
  assert(thursSS1.room !== thursSS2.room, 'Thursday 14:00 slot must be in different rooms for SS1 and SS2');

  return true;
}
