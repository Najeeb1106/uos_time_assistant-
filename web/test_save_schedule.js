async function run() {
  const loginUrl = 'http://localhost:3000/api/auth/login';
  const scheduleUrl = 'http://localhost:3000/api/schedule';

  console.log('1. Attempting login as teststudent@uos.edu.pk...');
  try {
    const loginRes = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'teststudent@uos.edu.pk',
        password: 'Abc123'
      })
    });

    const loginData = await loginRes.json();
    console.log('Login Response:', loginData);

    if (!loginData.success) {
      console.error('Login failed!');
      return;
    }

    const token = loginData.token;
    console.log('Auth Token obtained:', token);

    console.log('\n2. Attempting to save dummy schedule classes...');
    const scheduleRes = await fetch(scheduleUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        pdfFileName: 'Class Timetable SE.pdf',
        classes: [
          {
            classId: 'test_class_1',
            name: 'Software Project Management',
            code: 'SECC-401',
            room: 'Room Department of Software Engineering NAB CR- 224',
            day: 'Wednesday',
            startTime: '08:00',
            endTime: '09:30',
            teacher: 'Abid Rafique',
            batch: '2023-2027',
            semester: 6,
            type: 'Regular'
          }
        ]
      })
    });

    const scheduleData = await scheduleRes.json();
    console.log('Schedule Save Response Status:', scheduleRes.status);
    console.log('Schedule Save Response Body:', scheduleData);

  } catch (error) {
    console.error('Error during test execution:', error);
  }
}

run();
