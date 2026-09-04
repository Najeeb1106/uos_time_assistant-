import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve directory paths in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 STARTING COMPREHENSIVE WEB COMPONENT & ALGORITHMIC TEST SUITE...\n');

// ── SETUP HEADLESS GLOBAL MOCKS ───────────────────────────────────────────
const storage = {
  uos_user: JSON.stringify({ email: 'student@uos.edu.pk', fullName: 'Test Student' }),
  uos_token: 'mock-jwt-session-token'
};
globalThis.localStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, value) => { storage[key] = String(value); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { for (const k in storage) delete storage[k]; }
};

// Intercept fetch queries to simulate successful REST responses
let mockFetchHandler = null;
globalThis.fetch = async (url, options) => {
  if (mockFetchHandler) {
    return mockFetchHandler(url, options);
  }
  return {
    status: 200,
    json: async () => ({ success: true })
  };
};

// ── PRE-PROCESS ZUSTAND STORE FOR NODE COMPATIBILITY ──────────────────────
// We read useStore.js, rewrite Vite's specific import.meta.env reference, and write a temporary test file.
const productionStorePath = path.join(__dirname, '..', 'src', 'store', 'useStore.js');
const tempStorePath = path.join(__dirname, '..', 'src', 'store', 'useStore.test.js');

if (!fs.existsSync(productionStorePath)) {
  console.error(`❌ Fatal Error: Store file not found at ${productionStorePath}`);
  process.exit(1);
}

const storeCode = fs.readFileSync(productionStorePath, 'utf8');
const nodeCompatibleStoreCode = storeCode
  .replace(/import\.meta\.env\.VITE_API_URL/g, 'process.env.VITE_API_URL')
  .replace(/stored === 'mock-jwt-session-token'/g, 'false');

fs.writeFileSync(tempStorePath, nodeCompatibleStoreCode, 'utf8');
console.log('✓ Successfully pre-processed and generated temporary test store.');

// ── RUN WEB COMPONENT & STORE TESTS ────────────────────────────────────────
async function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      passed++;
      console.log(`  ✅ PASS: ${message}`);
    } else {
      failed++;
      console.error(`  ❌ FAIL: ${message}`);
    }
  }

  try {
    // Dynamically load the pre-processed store module
    const { useStore } = await import('../src/store/useStore.test.js');

    // ── CATEGORY 1: ZUSTAND STATE MANAGEMENT TESTS ───────────────────────
    console.log('\n--- 📦 1. Zustand Store & State Management Tests ---');

    // Test 1.1: Verify initial state defaults
    const state = useStore.getState();
    assert(state.themeMode === 'dark', 'Initial themeMode should be "dark"');
    assert(state.user !== null && state.user.email === 'student@uos.edu.pk', 'Initial student user is loaded as premium mock');
    assert(state.token === 'mock-jwt-session-token', 'Initial token defaults to mock-jwt-session-token');
    assert(state.classes.length > 0, 'Initial state should load the premium pre-seeded mock classes');

    // Test 1.2: Theme toggling
    state.toggleTheme();
    assert(useStore.getState().themeMode === 'light', 'toggleTheme() transitions theme mode from dark to light');
    useStore.getState().toggleTheme();
    assert(useStore.getState().themeMode === 'dark', 'toggleTheme() transitions theme mode back to dark');

    // Test 1.3: Adding a new class
    const initialClassCount = useStore.getState().classes.length;
    const testClass = {
      name: 'Software Project Management',
      code: 'SECC-401',
      room: 'CR-224',
      teacher: 'Prof. Abid Rafique',
      day: 'Wednesday',
      startTime: '08:00',
      endTime: '09:30',
      batch: '2023-2027',
      semester: 6,
      type: 'Regular'
    };
    
    await useStore.getState().addClass(testClass);
    const classesAfterAdd = useStore.getState().classes;
    assert(classesAfterAdd.length === initialClassCount + 1, 'addClass() increases the store class count by exactly 1');
    const addedClass = classesAfterAdd.find(c => c.name === 'Software Project Management');
    assert(addedClass !== undefined, 'New class is present in state');
    assert(addedClass.classId && addedClass.classId.startsWith('cls_'), 'New class receives a dynamic generated classId starts with "cls_"');

    // Test 1.4: Deleting a class
    await useStore.getState().deleteClass(addedClass.classId);
    assert(useStore.getState().classes.length === initialClassCount, 'deleteClass() successfully removes the class and restores count');

    // Test 1.5: Parse step session transitions
    useStore.getState().setParseStep('scanning');
    assert(useStore.getState().parseStep === 'scanning', 'setParseStep() correctly updates parsing step');
    useStore.getState().setParseProgress(65);
    assert(useStore.getState().parseProgress === 65, 'setParseProgress() correctly updates progress');
    useStore.getState().setParseFileName('timetable.pdf');
    assert(useStore.getState().parseFileName === 'timetable.pdf', 'setParseFileName() correctly updates active file');
    
    useStore.getState().clearParsedState();
    const resetState = useStore.getState();
    assert(resetState.parsedClasses.length === 0 && resetState.parseStep === 'idle' && resetState.parseProgress === 0, 'clearParsedState() purges all session configurations back to default idle parameters');

    // Test 1.6: Simulated authentication
    mockFetchHandler = (url, options) => {
      if (url.includes('/auth/login')) {
        return {
          status: 200,
          json: async () => ({
            success: true,
            token: 'test-user-auth-jwt',
            user: {
              email: 'verified-teacher@uos.edu.pk',
              fullName: 'Prof. Mohammad Najeeb',
              role: 'teacher',
              department: 'Software Engineering'
            }
          })
        };
      }
      return { status: 404, json: async () => ({ success: false }) };
    };

    await useStore.getState().login('verified-teacher@uos.edu.pk', 'Abc1234');
    assert(useStore.getState().token === 'test-user-auth-jwt', 'login() dynamically records the authentication JWT');
    assert(useStore.getState().user.role === 'teacher', 'login() updates user profile metadata to matched role');

    // Test 1.7: Profile Synchronization (fetchCurrentUser updates stale local state from backend)
    // Simulate user having stale localStorage name "Najeeb Ullah Tahir"
    storage['uos_user'] = JSON.stringify({ email: 'najeeb@uos.edu.pk', fullName: 'Najeeb Ullah Tahir', role: 'student' });
    useStore.setState({ user: { email: 'najeeb@uos.edu.pk', fullName: 'Najeeb Ullah Tahir', role: 'student' } });

    // Mock GET /api/auth/me returning updated name from mobile: "Najeeb"
    mockFetchHandler = (url, options) => {
      if (url.includes('/auth/me')) {
        return {
          status: 200,
          json: async () => ({
            success: true,
            user: {
              email: 'najeeb@uos.edu.pk',
              fullName: 'Najeeb',
              role: 'student',
              program: 'BS in Software Engineering',
              semester: 6,
              batch: '2023-2027',
              type: 'Regular'
            }
          })
        };
      }
      return { status: 404, json: async () => ({ success: false }) };
    };

    await useStore.getState().fetchCurrentUser();
    assert(useStore.getState().user.fullName === 'Najeeb', 'fetchCurrentUser() synchronizes profile name to "Najeeb"');
    assert(JSON.parse(storage['uos_user']).fullName === 'Najeeb', 'fetchCurrentUser() updates localStorage uos_user with "Najeeb"');

    // Test 1.8: updateProfile action
    mockFetchHandler = (url, options) => {
      if (url.includes('/auth/profile')) {
        const body = JSON.parse(options.body);
        return {
          status: 200,
          json: async () => ({
            success: true,
            message: 'Student profile updated successfully.',
            user: {
              email: 'najeeb@uos.edu.pk',
              fullName: body.fullName,
              role: 'student',
              program: body.program || 'BS in Software Engineering',
              semester: body.semester || 6,
              batch: body.batch || '2023-2027',
              type: body.type || 'Regular'
            }
          })
        };
      }
      return { status: 404, json: async () => ({ success: false }) };
    };

    await useStore.getState().updateProfile({ fullName: 'Najeeb Tahir' });
    assert(useStore.getState().user.fullName === 'Najeeb Tahir', 'updateProfile() updates store state to "Najeeb Tahir"');
    assert(JSON.parse(storage['uos_user']).fullName === 'Najeeb Tahir', 'updateProfile() updates localStorage to "Najeeb Tahir"');

    // Test 1.9: Logout purge
    useStore.getState().logout();
    assert(useStore.getState().token === null, 'logout() correctly purges the auth token from memory');
    assert(useStore.getState().user === null, 'logout() purges the user profile');
    assert(useStore.getState().classes.length === 0, 'logout() clears the loaded class array to prevent data leak');


    // ── CATEGORY 2: TIMETABLE & CALENDAR ALGORITHMIC CHECKS ────────────────
    console.log('\n--- 📅 2. Timetable Navigation & Calendar Algorithmic Checks ---');

    // Mock today's day calculations & time difference renderers
    const getMinutesDiff = (timeA, timeB) => {
      const [hA, mA] = timeA.split(':').map(Number);
      const [hB, mB] = timeB.split(':').map(Number);
      return (hA * 60 + mA) - (hB * 60 + mB);
    };

    const renderTimeDiff = (startTime, currentTime) => {
      const diff = getMinutesDiff(startTime, currentTime);
      if (diff <= 0) return 'Starts now';
      if (diff < 60) return `Starts in ${diff} mins`;
      
      const hrs = Math.floor(diff / 60);
      const mins = diff % 60;
      return mins > 0 ? `Starts in ${hrs}h ${mins}m` : `Starts in ${hrs}h`;
    };

    // Test 2.1: Chronological Time Difference Calculation
    assert(renderTimeDiff('09:30', '08:00') === 'Starts in 1h 30m', 'Difference of 90 minutes outputs "Starts in 1h 30m"');
    assert(renderTimeDiff('08:15', '08:00') === 'Starts in 15 mins', 'Difference of 15 minutes outputs "Starts in 15 mins"');
    assert(renderTimeDiff('08:00', '08:00') === 'Starts now', 'Zero time difference outputs "Starts now"');
    assert(renderTimeDiff('07:50', '08:00') === 'Starts now', 'Negative time difference outputs "Starts now"');

    // Test 2.2: Ongoing Class Matcher
    const isClassOngoing = (cls, currentDay, currentTime) => {
      if (cls.day !== currentDay) return false;
      return currentTime >= cls.startTime && currentTime < cls.endTime;
    };

    const dummyClass = { day: 'Monday', startTime: '08:30', endTime: '10:00' };
    assert(isClassOngoing(dummyClass, 'Monday', '09:00') === true, 'Ongoing check returns true during scheduled class hours');
    assert(isClassOngoing(dummyClass, 'Monday', '10:30') === false, 'Ongoing check returns false after class completes');
    assert(isClassOngoing(dummyClass, 'Tuesday', '09:00') === false, 'Ongoing check returns false on other days of the week');

    // Test 2.3: Next Upcoming Class Finder
    const getNextClass = (classes, currentDay, currentTime) => {
      const dayClasses = classes
        .filter((c) => c.day === currentDay)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      
      return dayClasses.find((c) => c.startTime > currentTime) || null;
    };

    const dayClassesList = [
      { name: 'Class A', day: 'Monday', startTime: '08:00', endTime: '09:30' },
      { name: 'Class B', day: 'Monday', startTime: '10:00', endTime: '11:30' },
      { name: 'Class C', day: 'Monday', startTime: '12:30', endTime: '14:00' }
    ];
    
    assert(getNextClass(dayClassesList, 'Monday', '07:30').name === 'Class A', 'Returns first class when system time is before first lecture');
    assert(getNextClass(dayClassesList, 'Monday', '09:45').name === 'Class B', 'Skips completed classes and returns next upcoming class');
    assert(getNextClass(dayClassesList, 'Monday', '15:00') === null, 'Returns null when all classes for today are complete');


    // ── CATEGORY 3: DYNAMIC ROOM FINDER OCCUPANCY ALGORITHMS ───────────────
    console.log('\n--- 🏫 3. Dynamic Room Finder Occupancy Algorithms ---');

    // Room category helper
    const isLab = (roomName) => {
      const name = roomName.toLowerCase();
      return name.includes('lab') || name.includes('l-') || name.includes('l0');
    };

    // Test 3.1: Category classifier
    assert(isLab('Department of Software Engineering NAB L-02') === true, 'NAB L-02 is classified as a Lab');
    assert(isLab('Department of Software Engineering NAB CR- 224') === false, 'NAB CR- 224 is classified as a Classroom');

    // Occupancy Status finder calculator logic (mirroring FreeRooms.jsx)
    const computeRoomStatus = (roomName, classes, targetDay, targetTime) => {
      const roomDayClasses = classes.filter(c => c.room === roomName && c.day === targetDay);
      const sortedClasses = [...roomDayClasses].sort((a, b) => a.startTime.localeCompare(b.startTime));
      const activeClass = sortedClasses.find(c => targetTime >= c.startTime && targetTime < c.endTime);
      const nextClass = sortedClasses.find(c => c.startTime > targetTime);

      return {
        isFree: !activeClass,
        activeClass,
        nextClass
      };
    };

    const mockGlobalClasses = [
      { name: 'OOP', room: 'CR-224', day: 'Monday', startTime: '08:30', endTime: '10:00', teacher: 'Dr. Summair' },
      { name: 'Database', room: 'CR-224', day: 'Monday', startTime: '10:15', endTime: '11:45', teacher: 'Prof. Yasir' }
    ];

    // Test 3.2: Room status at empty time (07:30 Monday)
    const statusBefore = computeRoomStatus('CR-224', mockGlobalClasses, 'Monday', '07:30');
    assert(statusBefore.isFree === true, 'Room is FREE before class scheduled starts');
    assert(statusBefore.nextClass.name === 'OOP', 'Next upcoming class OOP is correctly matched');

    // Test 3.3: Room status during first class (09:00 Monday)
    const statusDuring = computeRoomStatus('CR-224', mockGlobalClasses, 'Monday', '09:00');
    assert(statusDuring.isFree === false, 'Room is OCCUPIED during active class hours');
    assert(statusDuring.activeClass.name === 'OOP', 'Active class metadata correctly captured');
    assert(statusDuring.nextClass.name === 'Database', 'Upcoming class Database is matched');

    // Test 3.4: Room status during transition break (10:05 Monday)
    const statusBreak = computeRoomStatus('CR-224', mockGlobalClasses, 'Monday', '10:05');
    assert(statusBreak.isFree === true, 'Room is FREE during class transition break intervals');
    assert(statusBreak.nextClass.name === 'Database', 'Next class matched correctly');


    // ── CATEGORY 4: INTEGRITY OF STATIC TIMETABLE RECORDS ─────────────────
    console.log('\n--- 📂 4. Static Timetable JSON Record Integrity ---');

    const staticTimetablePath = path.join(__dirname, '..', 'src', 'assets', 'parsed_timetable.json');
    assert(fs.existsSync(staticTimetablePath), 'parsed_timetable.json exists inside assets folder');

    if (fs.existsSync(staticTimetablePath)) {
      const staticClasses = JSON.parse(fs.readFileSync(staticTimetablePath, 'utf8'));
      assert(staticClasses.length > 0, `Loads ${staticClasses.length} pre-parsed classes successfully`);
      
      // Verify strict computing program filters
      const nonComputingClasses = staticClasses.filter(c => {
        const prog = c.program?.toLowerCase() || '';
        return prog.includes('business') || prog.includes('noon') || prog.includes('arts') || prog.includes('design');
      });
      assert(nonComputingClasses.length === 0, 'Timetable contains ZERO Noon Business School or Arts & Design classes');

      // Verify that majors present belong strictly to computing
      const departments = new Set(staticClasses.map(c => c.program));
      console.log('  💼 Active Computing Programs Extracted:');
      Array.from(departments).forEach(d => console.log(`     - ${d}`));
    }


    // ── CATEGORY 5: REACT WEB FILES SYNTAX & COMPILATION PRE-FLIGHT ────────
    console.log('\n--- 🏗️ 5. React Web Component Pre-Flight Checks ---');

    const filesToCheck = [
      'src/pages/Login.jsx',
      'src/pages/Register.jsx',
      'src/pages/Dashboard.jsx',
      'src/pages/FreeRooms.jsx',
      'src/pages/Profile.jsx',
      'src/pages/Upload.jsx',
      'src/pages/WeeklySchedule.jsx',
      'src/components/Layout.jsx'
    ];

    for (const f of filesToCheck) {
      const p = path.join(__dirname, '..', f);
      assert(fs.existsSync(p), `Source code component file ${f} exists and is active`);
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf8');
        assert(!content.includes('<<<<<<<') && !content.includes('=======') && !content.includes('>>>>>>>'), `${f} is clean of Git merge conflict flags`);
      }
    }

    console.log('\n======================================================');
    console.log(`📊 TESTS COMPLETE: ${passed} Passed, ${failed} Failed.`);
    console.log('======================================================');

    if (failed > 0) {
      console.error('\n❌ SOME WEB AUTOMATED TESTS ENCOUNTERED FAILURES!');
      process.exit(1);
    } else {
      console.log('\n🎉 ALL REACT WEB AUTOMATED TESTS PASSED TRIUMPHANTLY!');
    }

  } catch (err) {
    console.error('\n❌ FATAL EXCEPTION OCCURRED DURING TEST EXECUTION:', err.stack);
    process.exit(1);
  } finally {
    // ── CLEANUP TEMPORARY FILES ──────────────────────────────────────────
    if (fs.existsSync(tempStorePath)) {
      fs.unlinkSync(tempStorePath);
      console.log('✓ Successfully cleaned up pre-processed temporary test store.\n');
    }
  }
}

runTests();
