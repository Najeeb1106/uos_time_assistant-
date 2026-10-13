const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'uos-timetable-development-secret-key';
const SERVER_URL = 'http://127.0.0.1:3000/api';

async function runLiveServerDeviceFlow() {
  console.log('====================================================');
  console.log('📱 TESTING PHYSICAL-DEVICE HTTP FLOW ON LOCAL BACKEND');
  console.log(`Target Server: ${SERVER_URL}`);
  console.log('====================================================\n');

  // Step 1: Register or Login test student profile
  const testEmail = `devtest_${Date.now()}@uos.edu.pk`;
  const registerRes = await fetch(`${SERVER_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'password123',
      fullName: 'Device Test Student',
      role: 'student',
      program: 'BS in Software Engineering',
      semester: 7,
      batch: '2023-2027',
      type: 'Regular'
    })
  });

  const registerData = await registerRes.json();
  if (!registerData.success || !registerData.token) {
    throw new Error(`Failed to register test user: ${registerData.message}`);
  }
  const token = registerData.token;
  console.log(`✓ Step 1: Registered test user (${testEmail}) with token.`);

  // Step 2: Test PDF Upload with Class Timetable SE 04.10.26.pdf
  console.log('\n--- Step 2: Testing PDF Upload (Class Timetable SE 04.10.26.pdf) ---');
  const pdfPath = path.resolve(__dirname, '../../Class Timetable SE 04.10.26.pdf');
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF file not found at ${pdfPath}`);
  }
  const pdfBuffer = fs.readFileSync(pdfPath);
  console.log(`Loaded PDF: ${path.basename(pdfPath)} (${pdfBuffer.length} bytes)`);

  const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
  const pdfFormData = new FormData();
  pdfFormData.append('file', pdfBlob, 'Class Timetable SE 04.10.26.pdf');

  const pdfUploadRes = await fetch(`${SERVER_URL}/schedule/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: pdfFormData
  });

  const pdfUploadData = await pdfUploadRes.json();
  console.log(`PDF Upload HTTP Status: ${pdfUploadRes.status}`);
  console.log(`Response message: "${pdfUploadData.message}"`);
  console.log(`Success: ${pdfUploadData.success}`);

  if (pdfUploadData.classes) {
    console.log(`Total classes parsed for profile: ${pdfUploadData.classes.length}`);

    // Verify Cyber Security
    const cyber = pdfUploadData.classes.find(c => c.day === 'Monday' && c.startTime === '08:00');
    console.log('\nVerifying Monday 08:00 Cyber Security:');
    if (cyber) {
      console.log(`  Course: "${cyber.name}" (${cyber.code})`);
      console.log(`  Room: "${cyber.room}"`);
      console.log(`  Teacher: "${cyber.teacher}"`);
      const roomOk = cyber.room.includes('NAB CR-227');
      console.log(`  Room contains NAB CR-227: ${roomOk ? 'YES (PASSED)' : 'NO (FAILED)'}`);
    } else {
      console.error('  ❌ FAILED: Cyber Security Monday 08:00 not found');
    }

    // Verify Enterprise Resource Planning Systems
    const erp = pdfUploadData.classes.find(c => c.code === 'SEEC-406');
    console.log('\nVerifying Enterprise Resource Planning Systems:');
    if (erp) {
      console.log(`  Course: "${erp.name}" (${erp.code})`);
      const nameOk = erp.name.includes('Enterprise Resource Planning Systems');
      console.log(`  Full name preserved: ${nameOk ? 'YES (PASSED)' : 'NO (FAILED)'}`);
    } else {
      console.error('  ❌ FAILED: SEEC-406 not found');
    }

    // Verify Practical detection
    const practicalCount = pdfUploadData.classes.filter(c => c.isPractical).length;
    console.log(`\nPractical classes detected: ${practicalCount}`);
  }

  // Step 3: Test Image Upload with new method.jpeg
  console.log('\n--- Step 3: Testing Image Upload (new method.jpeg) ---');
  const imgPath = path.resolve(__dirname, '../../new method.jpeg');
  if (!fs.existsSync(imgPath)) {
    throw new Error(`Image file not found at ${imgPath}`);
  }
  const imgBuffer = fs.readFileSync(imgPath);
  console.log(`Loaded Image: ${path.basename(imgPath)} (${imgBuffer.length} bytes)`);

  const imgBlob = new Blob([imgBuffer], { type: 'image/jpeg' });
  const imgFormData = new FormData();
  imgFormData.append('file', imgBlob, 'new method.jpeg');

  const imgUploadRes = await fetch(`${SERVER_URL}/schedule/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: imgFormData
  });

  const imgUploadData = await imgUploadRes.json();
  console.log(`Image Upload HTTP Status: ${imgUploadRes.status}`);
  console.log(`Response message: "${imgUploadData.message}"`);
  console.log(`Success: ${imgUploadData.success}`);

  if (!imgUploadData.success && imgUploadData.message?.includes('Cloud AI Vision is not configured')) {
    console.log('✓ Safe behavior confirmed: Server correctly declined live image processing because GEMINI_API_KEY is not configured in backend/.env.');
    console.log('  (No hallucinated results were returned; clear error returned to client).');
  } else if (imgUploadData.success) {
    console.log(`Extracted ${imgUploadData.classes?.length} classes via configured Cloud AI!`);
  }

  // Step 4: Test Timetable Save flow
  console.log('\n--- Step 4: Testing Save Schedule API ---');
  if (pdfUploadData.classes && pdfUploadData.classes.length > 0) {
    const saveRes = await fetch(`${SERVER_URL}/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        classes: pdfUploadData.classes,
        pdfFileName: 'Class Timetable SE 04.10.26.pdf'
      })
    });
    const saveData = await saveRes.json();
    console.log(`Save Schedule HTTP Status: ${saveRes.status}`);
    console.log(`Save Response message: "${saveData.message}"`);
    console.log(`Saved successfully: ${saveData.success}`);
  }

  console.log('\n====================================================');
  console.log('🏁 PHYSICAL-DEVICE FLOW TEST FINISHED');
  console.log('====================================================\n');
}

runLiveServerDeviceFlow().catch(err => {
  console.error('Fatal error running live server test:', err);
  process.exit(1);
});
