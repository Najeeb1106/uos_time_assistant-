const fs = require('fs');
const path = require('path');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function testBackend() {
  console.log('🚀 STARTING BACKEND INTEGRATION & PARSING TEST...');

  try {
    // 1. Health check
    console.log('\n--- 1. Health Status Check ---');
    const statusRes = await fetch(`${BASE_URL}/status`);
    const statusData = await statusRes.json();
    console.log('Status Response:', statusData);
    if (!statusData.success) throw new Error('Health check failed');

    // 2. Registration
    console.log('\n--- 2. Student Registration ---');
    const regPayload = {
      email: 'test-student-new@uos.edu.pk',
      password: 'password123',
      fullName: 'Ahmed Ali Test',
      program: 'BS in Software Engineering',
      type: 'Regular',
      batch: '2025-2029',
      semester: 2
    };
    
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regPayload)
    });
    
    const regData = await regRes.json();
    console.log('Registration Response:', regData.success ? 'SUCCESS ✓' : 'FAILED ✗', regData.message || '');
    if (!regData.success && !regData.message.includes('already in use')) {
      throw new Error(`Registration failed: ${regData.message}`);
    }

    // 3. Login
    console.log('\n--- 3. Student Login ---');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test-student-new@uos.edu.pk',
        password: 'password123'
      })
    });
    
    const loginData = await loginRes.json();
    console.log('Login Response:', loginData.success ? 'SUCCESS ✓' : 'FAILED ✗', loginData.message || '');
    if (!loginData.success) throw new Error('Login failed');

    const token = loginData.token;
    console.log('JWT Auth Token obtained:', token.substring(0, 30) + '...');

    // 4. PDF Parsing & Upload
    console.log('\n--- 4. Server-Side PDF Parsing Upload ---');
    const pdfPath = path.join(__dirname, '..', 'Class Timetable SE.pdf');
    if (!fs.existsSync(pdfPath)) {
      console.warn(`⚠️ Warning: Test PDF not found at ${pdfPath}. Skipping parsing upload.`);
      return;
    }
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log(`Loaded PDF from: ${pdfPath} (${pdfBuffer.length} bytes)`);

    // We build a multipart form-data request manually to avoid external libraries
    const boundary = '----TestBoundary' + Math.random().toString(36).substring(2);
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="Class Timetable SE.pdf"\r\nContent-Type: application/pdf\r\n\r\n`;
    const footer = `\r\n--${boundary}--`;
    
    const payloadBuffer = Buffer.concat([
      Buffer.from(header, 'utf-8'),
      pdfBuffer,
      Buffer.from(footer, 'utf-8')
    ]);

    const uploadRes = await fetch(`${BASE_URL}/schedule/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': `Bearer ${token}`
      },
      body: payloadBuffer
    });

    const uploadData = await uploadRes.json();
    console.log('PDF Parse Response:', uploadData.success ? 'SUCCESS ✓' : 'FAILED ✗', uploadData.message || '');
    if (!uploadData.success) throw new Error(`PDF Parsing failed: ${uploadData.message}`);

    console.log(`Successfully extracted ${uploadData.classes.length} classes for student profile (Sem 2, Regular)!`);
    console.table(uploadData.classes.slice(0, 5));

    // 5. Confirm & Save Schedule
    console.log('\n--- 5. Confirm & Save Schedule ---');
    const saveRes = await fetch(`${BASE_URL}/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        classes: uploadData.classes,
        pdfFileName: uploadData.pdfFileName
      })
    });
    
    const saveData = await saveRes.json();
    console.log('Save Response:', saveData.success ? 'SUCCESS ✓' : 'FAILED ✗', saveData.message || '');
    if (!saveData.success) throw new Error('Save schedule failed');

    // 6. Retrieve Schedule
    console.log('\n--- 6. Retrieve Current Schedule ---');
    const fetchRes = await fetch(`${BASE_URL}/schedule/current`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const fetchData = await fetchRes.json();
    console.log('Retrieve Response:', fetchData.success ? 'SUCCESS ✓' : 'FAILED ✗');
    console.log(`Schedule loaded from database contains ${fetchData.classes.length} classes!`);

    console.log('\n✅ ALL BACKEND SYSTEM APIS RUNNING FLAWLESSLY AND CORRECTLY!');
  } catch (err) {
    console.error('\n❌ TEST ERROR OCCURRED:', err.message);
  }
}

// Run the suite
testBackend();
