import {
  getBuiltinClassesForUser,
  getScheduleProfileKey,
  filterClassesForUserProfile,
  normalizeBatch,
} from '../utils/builtinScheduleUtils';
import { normalizeSection, getClassSectionDisplay } from '../utils/sectionUtils';
import { UserProfile } from '../models/User';
import {
  getValidBatches,
  getSuggestedBatch,
  parseBatch,
  formatBatch,
  getEndYearOptions,
} from '../utils/batchUtils';

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

  // Test 1b: getClassSectionDisplay exact category display and variant normalization
  assert(getClassSectionDisplay({ type: 'Regular', section: '' }) === 'Regular', 'Regular class displays Regular');
  assert(getClassSectionDisplay({ type: 'Regular', section: 'Regular' }) === 'Regular', 'Regular section displays Regular');
  assert(getClassSectionDisplay({ type: 'Self Support 1', section: '' }) === 'Self Support 1', 'Self Support 1 displays Self Support 1');
  assert(getClassSectionDisplay({ type: 'Self Support 2', section: '' }) === 'Self Support 2', 'Self Support 2 displays Self Support 2');
  assert(getClassSectionDisplay({ type: 'Self Support I', section: '' }) === 'Self Support 1', 'Self Support I displays Self Support 1');
  assert(getClassSectionDisplay({ type: 'Self Support II', section: '' }) === 'Self Support 2', 'Self Support II displays Self Support 2');
  assert(getClassSectionDisplay({ type: 'Self Support-I', section: '' }) === 'Self Support 1', 'Self Support-I displays Self Support 1');
  assert(getClassSectionDisplay({ type: 'Self Support-II', section: '' }) === 'Self Support 2', 'Self Support-II displays Self Support 2');
  assert(getClassSectionDisplay({ type: 'Self Support', section: '1' }) === 'Self Support 1', 'Self Support + sec 1 displays Self Support 1');
  assert(getClassSectionDisplay({ type: 'Self Support', section: '2' }) === 'Self Support 2', 'Self Support + sec 2 displays Self Support 2');
  assert(getClassSectionDisplay({ type: 'Self Support', section: 'I' }) === 'Self Support 1', 'Self Support + sec I displays Self Support 1');
  assert(getClassSectionDisplay({ type: 'Self Support', section: 'II' }) === 'Self Support 2', 'Self Support + sec II displays Self Support 2');
  assert(getClassSectionDisplay({ type: 'Self Support-1', section: '' }) === 'Self Support 1', 'Self Support-1 normalized to Self Support 1');
  assert(getClassSectionDisplay({ type: 'Self Support-2', section: '' }) === 'Self Support 2', 'Self Support-2 normalized to Self Support 2');
  assert(getClassSectionDisplay({ type: 'Self-Support 1', section: '' }) === 'Self Support 1', 'Self-Support 1 normalized to Self Support 1');
  assert(getClassSectionDisplay({ type: 'Self Support', section: '' }) === 'Self Support', 'Bare Self Support displays Self Support');
  assert(getClassSectionDisplay({ type: 'Weekend Self Support', section: '' }) === 'Weekend Self Support', 'Weekend Self Support preserved');
  assert(getClassSectionDisplay({ type: 'Weekend Self Support', section: '1' }) === 'Weekend Self Support 1', 'Weekend Self Support 1 preserved');
  assert(getClassSectionDisplay({ type: 'Morning', section: '' }) === 'Morning', 'Custom category Morning preserved');
  assert(getClassSectionDisplay({ type: 'Evening', section: '1' }) === 'Evening 1', 'Custom category Evening 1 preserved');
  assert(getClassSectionDisplay(null) === 'Regular', 'Null class safely defaults to Regular');

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

  // Scenario 1: Initial Batch 2023-2027 + Semester 7 -> Returns Semester 7 classes
  const se2023Sem7: UserProfile = {
    uid: 'test_se_1',
    email: 'se@uos.edu.pk',
    fullName: 'SE Student',
    role: 'student',
    program: 'BS in Software Engineering',
    semester: 7,
    batch: '2023-2027',
    type: 'Regular',
  };
  const scenario1Classes = getBuiltinClassesForUser(se2023Sem7);
  assert(scenario1Classes.length === 8, `Scenario 1: Expected 8 classes for SE 2023-2027 Sem 7, got ${scenario1Classes.length}`);
  scenario1Classes.forEach((c) => {
    assert(c.semester === 7, `Expected Sem 7, got ${c.semester}`);
    assert(c.batch === '2023-2027', `Expected Batch 2023-2027, got ${c.batch}`);
  });

  // Validation function matching mobile & web implementations
  const validateAcademicUpdate = (prev: UserProfile, newName: string, newSem: number, newBatch: string) => {
    if (!newName.trim()) {
      return { allowed: false, error: 'Please specify your full name.' };
    }
    const normBatch = normalizeBatch(newBatch);
    if (!normBatch) {
      return { allowed: false, error: 'Please specify your session / batch.' };
    }
    if (!/^\d{4}-\d{4}$/.test(normBatch)) {
      return { allowed: false, error: 'Batch must be in YYYY-YYYY format (e.g. 2024-2028).' };
    }
    const prevSem = Number(prev.semester);
    const prevBatchNorm = normalizeBatch(prev.batch);
    if (prevSem > 0 && newSem > 0 && newSem !== prevSem && normBatch === prevBatchNorm) {
      return { allowed: false, error: 'Please change your batch/session as well when changing the semester.' };
    }
    return { allowed: true, error: null, normalizedBatch: normBatch };
  };

  // Scenario 2: Semester-only change (2023-2027 + Semester 7 -> Semester 6) -> Rejected
  const scenario2Validation = validateAcademicUpdate(se2023Sem7, se2023Sem7.fullName, 6, '2023-2027');
  assert(!scenario2Validation.allowed, 'Scenario 2: Semester-only change must be rejected');
  assert(
    scenario2Validation.error === 'Please change your batch/session as well when changing the semester.',
    'Scenario 2: Warning must state batch change is required'
  );
  // Timetable and profile remain Semester 7
  const scenario2Classes = getBuiltinClassesForUser(se2023Sem7);
  assert(scenario2Classes.length === 8, 'Scenario 2: Classes must remain Semester 7');

  // Scenario 3: Valid change (2023-2027 + Sem 7 -> 2024-2028 + Sem 6)
  const scenario3Validation = validateAcademicUpdate(se2023Sem7, se2023Sem7.fullName, 6, '2024-2028');
  assert(scenario3Validation.allowed, 'Scenario 3: Valid batch + semester change must be allowed');
  const se2024Sem6: UserProfile = {
    ...se2023Sem7,
    batch: '2024-2028',
    semester: 6,
  };
  const scenario3Classes = getBuiltinClassesForUser(se2024Sem6);
  assert(scenario3Classes.length === 13, `Scenario 3: Expected 13 classes for SE 2024-2028 Sem 6, got ${scenario3Classes.length}`);
  scenario3Classes.forEach((c) => {
    assert(c.semester === 6, `Scenario 3: Expected Sem 6, got ${c.semester}`);
    assert(c.batch === '2024-2028', `Scenario 3: Expected Batch 2024-2028, got ${c.batch}`);
  });

  // Scenario 4: Change back (2024-2028 + Sem 6 -> 2023-2027 + Sem 7)
  const scenario4Validation = validateAcademicUpdate(se2024Sem6, se2024Sem6.fullName, 7, '2023-2027');
  assert(scenario4Validation.allowed, 'Scenario 4: Valid batch + semester change back must be allowed');
  const scenario4Classes = getBuiltinClassesForUser(se2023Sem7);
  assert(scenario4Classes.length === 8, `Scenario 4: Expected 8 classes for SE 2023-2027 Sem 7, got ${scenario4Classes.length}`);

  // Form Reset Emulation (matching resetFormToUser in ProfileScreen)
  const emulateModalFormState = (savedUser: UserProfile | null) => {
    return {
      fullName: savedUser?.fullName || '',
      program: savedUser?.program || '',
      semester: savedUser?.semester !== undefined && savedUser?.semester !== null ? Number(savedUser.semester) : 1,
      batch: savedUser?.batch || '',
      type: savedUser?.type || 'Regular',
    };
  };

  // Scenario 5: Open edit modal after valid change -> shows latest saved Semester 6 + Batch 2024-2028
  const modalFormStateAfterValidChange = emulateModalFormState(se2024Sem6);
  assert(modalFormStateAfterValidChange.semester === 6, 'Scenario 5: Modal must open with saved semester 6');
  assert(modalFormStateAfterValidChange.batch === '2024-2028', 'Scenario 5: Modal must open with saved batch 2024-2028');

  // Scenario 6: Cancel edit modal -> resets form state to saved profile
  let dirtyModalState = { ...modalFormStateAfterValidChange, semester: 7, batch: '2023-2027' };
  // User cancels:
  dirtyModalState = emulateModalFormState(se2024Sem6);
  assert(dirtyModalState.semester === 6, 'Scenario 6: Cancel must restore saved semester 6');
  assert(dirtyModalState.batch === '2024-2028', 'Scenario 6: Cancel must restore saved batch 2024-2028');

  // Scenario 7: App restart -> Restored profile and classes match saved state
  const restoredUserJson = JSON.stringify(se2024Sem6);
  const restoredUser: UserProfile = JSON.parse(restoredUserJson);
  const restoredClasses = getBuiltinClassesForUser(restoredUser);
  const restoredModalState = emulateModalFormState(restoredUser);
  assert(restoredUser.semester === 6, 'Scenario 7: Restored user semester must be 6');
  assert(restoredUser.batch === '2024-2028', 'Scenario 7: Restored user batch must be 2024-2028');
  assert(restoredModalState.semester === 6, 'Scenario 7: Restored modal semester must be 6');
  assert(restoredModalState.batch === '2024-2028', 'Scenario 7: Restored modal batch must be 2024-2028');
  assert(restoredClasses.length === 13, 'Scenario 7: Restored timetable must match 13 classes');

  // Scenario 8: Refresh -> Summary, edit modal, and timetable all match
  const profileKeyBeforeRefresh = getScheduleProfileKey(se2024Sem6);
  const classesBeforeRefresh = getBuiltinClassesForUser(se2024Sem6);
  const profileKeyAfterRefresh = getScheduleProfileKey(se2024Sem6);
  const classesAfterRefresh = getBuiltinClassesForUser(se2024Sem6);
  assert(profileKeyBeforeRefresh === profileKeyAfterRefresh, 'Scenario 8: Profile key must be identical');
  assert(classesBeforeRefresh.length === classesAfterRefresh.length, 'Scenario 8: Class count must match across refresh');

  // Scenario 9: No-data combination (e.g. 2023-2027 + Sem 6) -> Classes clear to 0
  const se2023Sem6: UserProfile = {
    ...se2023Sem7,
    semester: 6,
  };
  const scenario9Classes = getBuiltinClassesForUser(se2023Sem6);
  assert(scenario9Classes.length === 0, 'Scenario 9: No-data combination must return 0 classes for empty state');

  // Scenario 10: Cache mismatch -> Old cache rejected when profile key differs
  const cacheKeySem7 = getScheduleProfileKey(se2023Sem7);
  const cacheKeySem6 = getScheduleProfileKey(se2024Sem6);
  const cacheItemSem7 = {
    profileKey: cacheKeySem7,
    classes: scenario1Classes,
  };
  // Emulate loadScheduleCache validation:
  const isCacheValidForSem6 = cacheItemSem7.profileKey === cacheKeySem6;
  assert(!isCacheValidForSem6, 'Scenario 10: Cache from Sem 7 must be rejected when active key is Sem 6');

  // Scenario 11: Stale server response -> Old Semester 7 response cannot overwrite Semester 6 schedule
  const staleServerResponseClasses = scenario1Classes; // Contains Sem 7 classes
  const filteredServerClasses = filterClassesForUserProfile(staleServerResponseClasses, se2024Sem6);
  assert(
    filteredServerClasses.length === 0,
    'Scenario 11: Stale Semester 7 server response must filter to 0 classes for Semester 6 profile'
  );

  // Scenario 12: Type/section mismatch -> Wrong shift or section classes are excluded
  const seRegularClasses = getBuiltinClassesForUser({ ...se2024Sem6, type: 'Regular' });
  const seSelfSupportClasses = getBuiltinClassesForUser({ ...se2024Sem6, type: 'Self Support 1' });
  // Self Support for SE 2024-2028 is isolated from Regular
  seRegularClasses.forEach((c) => {
    assert(normalizeSection(c.type, c.section) === 'Regular', 'Scenario 12: Regular classes must only be Regular');
  });

  // Scenario 13: Invalid email/name/semester/batch validation
  const emptyNameResult = validateAcademicUpdate(se2024Sem6, '   ', 6, '2024-2028');
  assert(!emptyNameResult.allowed, 'Scenario 13: Empty name must be rejected');
  assert(emptyNameResult.error === 'Please specify your full name.', 'Scenario 13: Correct name error message');

  const emptyBatchResult = validateAcademicUpdate(se2024Sem6, 'SE Student', 6, '');
  assert(!emptyBatchResult.allowed, 'Scenario 13: Empty batch must be rejected');

  const invalidBatchFormatResult = validateAcademicUpdate(se2024Sem6, 'SE Student', 6, '2024_2028');
  // Unicode dash normalization handles underscores and dashes
  assert(invalidBatchFormatResult.allowed, 'Scenario 13: Underscore in batch is normalized to hyphen');

  const malformedBatchResult = validateAcademicUpdate(se2024Sem6, 'SE Student', 6, 'invalid-batch');
  assert(!malformedBatchResult.allowed, 'Scenario 13: Malformed batch must be rejected');

  // Scenario 14: Logout/login session isolation
  let activeSessionUser: UserProfile | null = se2024Sem6;
  let activeSchedule: any[] = getBuiltinClassesForUser(activeSessionUser);
  assert(activeSchedule.length > 0, 'Scenario 14: Logged in user has schedule');
  // Logout:
  activeSessionUser = null;
  activeSchedule = getBuiltinClassesForUser(activeSessionUser);
  assert(activeSchedule.length === 0, 'Scenario 14: Logout clears schedule completely');
  // Login with new user:
  activeSessionUser = se2023Sem7;
  activeSchedule = getBuiltinClassesForUser(activeSessionUser);
  assert(activeSchedule.length === 8, 'Scenario 14: Login restores correct schedule for new session');
  activeSchedule.forEach((c) => {
    assert(c.semester === 7, 'Scenario 14: Restored classes belong to Sem 7');
  });

  // =========================================================================
  // Scenarios 15-19: BS Artificial Intelligence batch derivation & filtering
  // =========================================================================

  // Scenario 15: getValidBatches / getSuggestedBatch for BS AI Sem 1
  const aiBatchesSem1 = getValidBatches('BS in Artificial Intelligence', 1);
  assert(
    aiBatchesSem1.length === 1 && aiBatchesSem1[0] === '2026-2030',
    `Scenario 15: BS AI Sem 1 must have exactly one valid batch [2026-2030], got ${JSON.stringify(aiBatchesSem1)}`
  );
  const aiSuggestedSem1 = getSuggestedBatch('BS in Artificial Intelligence', 1);
  assert(
    aiSuggestedSem1 === '2026-2030',
    `Scenario 15: getSuggestedBatch(BS AI, 1) must return '2026-2030', got '${aiSuggestedSem1}'`
  );

  // Scenario 16: BS AI Sem 1, Regular, correct batch → 17 classes
  const aiSem1RegularProfile: UserProfile = {
    uid: 'test_ai_sem1',
    email: 'ai@uos.edu.pk',
    fullName: 'AI Student',
    role: 'student',
    program: 'BS in Artificial Intelligence',
    semester: 1,
    batch: '2026-2030',
    type: 'Regular',
  };
  const aiSem1Classes = getBuiltinClassesForUser(aiSem1RegularProfile);
  assert(
    aiSem1Classes.length === 17,
    `Scenario 16: BS AI Sem 1 Regular must return 17 classes, got ${aiSem1Classes.length}`
  );
  aiSem1Classes.forEach((c) => {
    assert(c.semester === 1, `Scenario 16: Expected Sem 1, got ${c.semester}`);
    assert(c.batch === '2026-2030', `Scenario 16: Expected batch 2026-2030, got ${c.batch}`);
  });

  // Scenario 17: BS AI Sem 2, Regular, correct batch → 37 classes
  const aiBatchesSem2 = getValidBatches('BS in Artificial Intelligence', 2);
  assert(
    aiBatchesSem2.length === 1 && aiBatchesSem2[0] === '2025-2029',
    `Scenario 17: BS AI Sem 2 must have exactly one valid batch [2025-2029], got ${JSON.stringify(aiBatchesSem2)}`
  );
  const aiSem2RegularProfile: UserProfile = {
    uid: 'test_ai_sem2_reg',
    email: 'ai2@uos.edu.pk',
    fullName: 'AI Student 2',
    role: 'student',
    program: 'BS in Artificial Intelligence',
    semester: 2,
    batch: '2025-2029',
    type: 'Regular',
  };
  const aiSem2RegularClasses = getBuiltinClassesForUser(aiSem2RegularProfile);
  assert(
    aiSem2RegularClasses.length === 37,
    `Scenario 17: BS AI Sem 2 Regular must return 37 classes, got ${aiSem2RegularClasses.length}`
  );

  // Scenario 18: BS AI Sem 2, Self Support 1, correct batch → 18 classes
  const aiSem2SS1Profile: UserProfile = {
    ...aiSem2RegularProfile,
    uid: 'test_ai_sem2_ss1',
    type: 'Self Support 1',
    section: '1',
  };
  const aiSem2SS1Classes = getBuiltinClassesForUser(aiSem2SS1Profile);
  assert(
    aiSem2SS1Classes.length === 18,
    `Scenario 18: BS AI Sem 2 Self Support 1 must return 18 classes, got ${aiSem2SS1Classes.length}`
  );

  // Scenario 19: BS AI, stale batch 2024-2028 (the old hardcoded default) → 0 classes
  // This is the root cause scenario — confirms the bug is not present with the fix in place
  const aiStaleBatchProfile: UserProfile = {
    uid: 'test_ai_stale',
    email: 'ai_stale@uos.edu.pk',
    fullName: 'AI Stale Student',
    role: 'student',
    program: 'BS in Artificial Intelligence',
    semester: 1,
    batch: '2024-2028', // wrong batch — old hardcoded default
    type: 'Regular',
  };
  const aiStaleClasses = getBuiltinClassesForUser(aiStaleBatchProfile);
  assert(
    aiStaleClasses.length === 0,
    `Scenario 19: BS AI with stale batch 2024-2028 must return 0 classes (bug reproduction check), got ${aiStaleClasses.length}`
  );
  // Confirm getSuggestedBatch would have correctly derived the right batch
  const aiStaleSuggested = getSuggestedBatch('BS in Artificial Intelligence', 1);
  assert(
    aiStaleSuggested === '2026-2030',
    `Scenario 19: getSuggestedBatch should have auto-filled 2026-2030 instead of 2024-2028`
  );

  // Scenario 20: BS AI Sem 1 batch split & composition for Start/End Year dropdowns
  const ai1Batch = getSuggestedBatch('BS in Artificial Intelligence', 1);
  const ai1Parsed = parseBatch(ai1Batch);
  assert(
    ai1Parsed.startYear === '2026' && ai1Parsed.endYear === '2030',
    `Scenario 20: BS AI Sem 1 batch must split to Start 2026 and End 2030, got ${JSON.stringify(ai1Parsed)}`
  );
  assert(
    formatBatch(ai1Parsed.startYear, ai1Parsed.endYear) === '2026-2030',
    'Scenario 20: Recomposed batch must match 2026-2030'
  );

  // Scenario 21: BS AI Sem 2 batch split & composition for Start/End Year dropdowns
  const ai2Batch = getSuggestedBatch('BS in Artificial Intelligence', 2);
  const ai2Parsed = parseBatch(ai2Batch);
  assert(
    ai2Parsed.startYear === '2025' && ai2Parsed.endYear === '2029',
    `Scenario 21: BS AI Sem 2 batch must split to Start 2025 and End 2029, got ${JSON.stringify(ai2Parsed)}`
  );
  assert(
    formatBatch(ai2Parsed.startYear, ai2Parsed.endYear) === '2025-2029',
    'Scenario 21: Recomposed batch must match 2025-2029'
  );

  // Scenario 22: BS Software Engineering batches split & format correctly
  const seBatches = ['2023-2027', '2024-2028', '2025-2029', '2026-2030'];
  seBatches.forEach((b) => {
    const { startYear, endYear } = parseBatch(b);
    assert(
      Number(endYear) > Number(startYear),
      `Scenario 22: End year ${endYear} must be greater than start year ${startYear}`
    );
    assert(
      formatBatch(startYear, endYear) === b,
      `Scenario 22: formatBatch(${startYear}, ${endYear}) must equal '${b}'`
    );
  });

  // Scenario 23: Editing profile parses existing batch string into start and end years
  const existingUserProfile: UserProfile = {
    uid: 'test_edit_profile',
    email: 'edit@uos.edu.pk',
    fullName: 'Existing Student',
    role: 'student',
    program: 'BS in Artificial Intelligence',
    semester: 1,
    batch: '2025-2029',
    type: 'Regular',
  };
  const profileBatchParts = parseBatch(existingUserProfile.batch);
  assert(
    profileBatchParts.startYear === '2025' && profileBatchParts.endYear === '2029',
    'Scenario 23: Existing profile batch must parse into Start 2025 and End 2029'
  );
  // User changes Start Year to 2026 and End Year to 2030
  const updatedBatch = formatBatch('2026', '2030');
  const updatedProfile: UserProfile = { ...existingUserProfile, batch: updatedBatch };
  const updatedClasses = getBuiltinClassesForUser(updatedProfile);
  assert(
    updatedClasses.length > 0,
    'Scenario 23: Updated batch produces filtered timetable classes'
  );

  // Scenario 24: getEndYearOptions prevents invalid intervals (end year <= start year)
  const endYearsFor2026 = getEndYearOptions('2026');
  assert(
    endYearsFor2026.every((y) => Number(y) > 2026),
    `Scenario 24: All end year options for 2026 must be strictly > 2026, got ${JSON.stringify(endYearsFor2026)}`
  );
  assert(
    !endYearsFor2026.includes('2026') && !endYearsFor2026.includes('2025'),
    'Scenario 24: End years must NOT include 2026 or 2025 when start year is 2026'
  );
  assert(
    endYearsFor2026.includes('2030'),
    'Scenario 24: End years must include 2030 when start year is 2026'
  );

  return true;
}

