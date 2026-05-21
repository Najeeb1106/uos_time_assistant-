# UOS Timetable App - Week-by-Week Implementation Guide

## Phase 1: Backend Setup (Weeks 1-2)

### Week 1: Firebase + Express Setup

#### Day 1-2: Project Initialization
```bash
# Create backend directory
mkdir uos-timetable-app
cd uos-timetable-app
mkdir backend
cd backend

# Initialize Node.js project
npm init -y

# Install dependencies
npm install express cors dotenv firebase-admin pdf-parse multer

# Create basic structure
mkdir src/{routes,controllers,middleware,utils,config}
touch src/app.js .env .env.example
```

#### Day 3: Firebase Configuration
1. Go to https://console.firebase.google.com
2. Create new project: "UOS Timetable"
3. Enable:
   - Authentication (Email/Password)
   - Firestore Database
   - Storage
4. Create service account key (Settings > Service Accounts > Generate new private key)
5. Save as `src/config/firebase-key.json` (add to .gitignore)

```javascript
// src/config/firebase.js
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'your-project.appspot.com'
});

const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket();

module.exports = { db, auth, bucket };
```

#### Day 4-5: Express Setup + Auth Endpoints
```javascript
// src/app.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const scheduleRoutes = require('./routes/schedule');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/schedule', scheduleRoutes);

app.listen(3000, () => {
  console.log('Backend running on http://localhost:3000');
});

module.exports = app;
```

```javascript
// src/routes/auth.js
const express = require('express');
const { register, login, logout, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

module.exports = router;
```

```javascript
// src/controllers/authController.js
const { auth, db } = require('../config/firebase');

exports.register = async (req, res) => {
  try {
    const { email, password, program, type, batch, semester } = req.body;

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password
    });

    // Store user data in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      createdAt: new Date(),
      profile: {
        program,
        type,
        batch,
        semester
      }
    });

    // Generate token
    const token = await auth.createCustomToken(userRecord.uid);

    res.status(201).json({
      success: true,
      uid: userRecord.uid,
      token,
      user: { email, program, type, batch, semester }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Note: For production, use Firebase SDK on client side
    // This is simplified for demo purposes
    const user = await auth.getUserByEmail(email);
    const token = await auth.createCustomToken(user.uid);

    const userData = await db.collection('users').doc(user.uid).get();

    res.json({
      success: true,
      uid: user.uid,
      token,
      user: userData.data().profile
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
};

exports.logout = async (req, res) => {
  // Token revocation handled on client side
  res.json({ success: true, message: 'Logged out' });
};

exports.getMe = async (req, res) => {
  try {
    const userData = await db.collection('users').doc(req.user.uid).get();
    res.json({ user: userData.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

```javascript
// src/middleware/auth.js
const { auth } = require('../config/firebase');

exports.authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await auth.verifyIdToken(token);
    req.user = { uid: decodedToken.uid };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

#### Day 5: Test Auth Endpoints
```bash
# Test register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@uos.edu.pk",
    "password": "password123",
    "program": "BS in Software Engineering",
    "type": "Regular",
    "batch": "2024-2028",
    "semester": 2
  }'
```

---

### Week 2: PDF Parsing + Schedule Routes

#### Day 1-2: PDF Parser Utility
```javascript
// src/utils/pdfParser.js
const pdf = require('pdf-parse');

exports.extractSchedule = async (pdfBuffer, batch, semester) => {
  try {
    const data = await pdf(pdfBuffer);
    const text = data.text;

    // Search for user's batch pattern
    const batchPattern = new RegExp(
      `BS in Software Engineering.*?\\(${batch.split('-')[0]}-${batch.split('-')[1]}\\).*?Semester#${semester}`,
      'i'
    );

    const batchMatch = text.match(batchPattern);
    if (!batchMatch) {
      throw new Error(`No classes found for ${batch} Semester ${semester}`);
    }

    // Extract classes (simplified - adjust based on actual PDF structure)
    const classes = [];
    
    const lines = text.split('\n');
    let foundBatch = false;
    let currentDay = null;
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    for (let line of lines) {
      if (line.includes(batch) && line.includes(`Semester#${semester}`)) {
        foundBatch = true;
        continue;
      }

      if (foundBatch && /^[A-Z][a-z]+day/.test(line.trim())) {
        currentDay = line.trim();
        continue;
      }

      // Parse class line (adjust regex based on PDF structure)
      if (foundBatch && currentDay) {
        const classMatch = line.match(/(.+?)\s+(CR\d+)\s+(.+?)\s+\((\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\)/);
        if (classMatch) {
          classes.push({
            name: classMatch[1].trim(),
            room: classMatch[2].trim(),
            teacher: classMatch[3].trim(),
            startTime: classMatch[4],
            endTime: classMatch[5],
            day: currentDay,
            batch,
            semester
          });
        }
      }
    }

    return classes;
  } catch (error) {
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
};
```

#### Day 3: Schedule Routes + Upload Handler
```javascript
// src/routes/schedule.js
const express = require('express');
const multer = require('multer');
const { 
  uploadSchedule, 
  getCurrentSchedule, 
  getWeekSchedule,
  getTodaySchedule 
} = require('../controllers/scheduleController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files allowed'));
    }
  }
});

router.post('/upload', authenticate, upload.single('file'), uploadSchedule);
router.get('/current', authenticate, getCurrentSchedule);
router.get('/week', authenticate, getWeekSchedule);
router.get('/today', authenticate, getTodaySchedule);

module.exports = router;
```

```javascript
// src/controllers/scheduleController.js
const { db, bucket } = require('../config/firebase');
const pdfParser = require('../utils/pdfParser');

exports.uploadSchedule = async (req, res) => {
  try {
    const { uid } = req.user;
    const pdfFile = req.file;
    
    // Get user data to find batch/semester
    const userDoc = await db.collection('users').doc(uid).get();
    const { batch, semester } = userDoc.data().profile;

    // Parse PDF
    const classes = await pdfParser.extractSchedule(pdfFile.buffer, batch, semester);

    // Save to Firestore
    await db.collection('schedules').doc(uid).set({
      uid,
      uploadedAt: new Date(),
      pdfFileName: pdfFile.originalname,
      parsedClasses: classes.map((c, i) => ({
        classId: `${uid}_${i}`,
        ...c
      })),
      isCurrent: true
    });

    // Optional: Save PDF file to Storage
    const fileName = `${uid}_${Date.now()}.pdf`;
    await bucket.file(`pdfs/${fileName}`).save(pdfFile.buffer);

    res.json({
      success: true,
      classCount: classes.length,
      classes,
      message: 'Schedule updated successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getCurrentSchedule = async (req, res) => {
  try {
    const { uid } = req.user;

    const doc = await db.collection('schedules').doc(uid).get();
    if (!doc.exists) {
      return res.json({ classes: [], uploadedAt: null });
    }

    const { parsedClasses, uploadedAt } = doc.data();

    res.json({
      classes: parsedClasses,
      uploadedAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getWeekSchedule = async (req, res) => {
  try {
    const { uid } = req.user;
    const { date } = req.query; // YYYY-MM-DD

    const doc = await db.collection('schedules').doc(uid).get();
    if (!doc.exists) {
      return res.json({ week: [] });
    }

    const { parsedClasses } = doc.data();
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    const week = days.map(day => ({
      day,
      classes: parsedClasses.filter(c => c.day === day)
    }));

    res.json({ week });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTodaySchedule = async (req, res) => {
  try {
    const { uid } = req.user;
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    const doc = await db.collection('schedules').doc(uid).get();
    if (!doc.exists) {
      return res.json({ today, classes: [], nextClass: null });
    }

    const { parsedClasses } = doc.data();
    const todayClasses = parsedClasses.filter(c => c.day === today);

    // Find next class
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const nextClass = todayClasses.find(c => c.startTime > currentTime) || null;

    res.json({
      today,
      classes: todayClasses,
      nextClass
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

#### Day 4-5: Deploy Backend
```bash
# Push to GitHub
git init
git add .
git commit -m "Initial backend setup"
git push origin main

# Deploy to Vercel
npm install -g vercel
vercel
```

Create `vercel.json`:
```json
{
  "buildCommand": "npm install",
  "outputDirectory": ".",
  "env": {
    "FIREBASE_PROJECT_ID": "@firebase_project_id",
    "FIREBASE_PRIVATE_KEY": "@firebase_private_key",
    "FIREBASE_CLIENT_EMAIL": "@firebase_client_email"
  }
}
```

---

## Phase 2: Web Frontend (Weeks 3-4)

### Week 3: React Setup + Auth Pages

#### Day 1: Project Setup
```bash
cd ..
npm create vite@latest web -- --template react
cd web

npm install
npm install axios redux @reduxjs/toolkit react-redux react-router-dom dotenv
npm run dev
```

#### Day 2-3: Auth Pages
```javascript
// src/pages/Login.jsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../store/auth/authSlice';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      dispatch(login({ user: data.user, token: data.token }));
      navigate('/dashboard');
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full">
        <h2 className="text-3xl font-bold mb-8">UOS Timetable</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <button 
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold"
          >
            Login
          </button>
        </form>
        <p className="mt-4 text-center">
          Don't have an account? <a href="/register" className="text-blue-600">Register</a>
        </p>
      </div>
    </div>
  );
}
```

#### Day 4-5: Redux Setup + Store
```javascript
// src/store/auth/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('token'),
    loading: false,
    error: null
  },
  reducers: {
    login: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem('token', action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
    }
  }
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
```

```javascript
// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth/authSlice';
import scheduleReducer from './schedule/scheduleSlice';

export default configureStore({
  reducer: {
    auth: authReducer,
    schedule: scheduleReducer
  }
});
```

---

### Week 4: Dashboard + Schedule Pages

#### Day 1-2: Dashboard Page
```javascript
// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

export default function Dashboard() {
  const { token } = useSelector(state => state.auth);
  const [todayClasses, setTodayClasses] = useState([]);
  const [nextClass, setNextClass] = useState(null);

  useEffect(() => {
    const fetchToday = async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/schedule/today`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setTodayClasses(data.classes);
      setNextClass(data.nextClass);
    };

    fetchToday();
  }, [token]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Today's Schedule</h1>

      {nextClass && (
        <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6">
          <h3 className="text-lg font-semibold">Next Class</h3>
          <p className="text-xl">{nextClass.name}</p>
          <p className="text-gray-600">{nextClass.startTime} - {nextClass.endTime} | Room: {nextClass.room}</p>
        </div>
      )}

      <div className="space-y-4">
        {todayClasses.map(cls => (
          <div key={cls.classId} className="p-4 border rounded-lg hover:shadow-md">
            <h3 className="font-bold text-lg">{cls.name}</h3>
            <p className="text-gray-600">{cls.startTime} - {cls.endTime}</p>
            <p className="text-gray-600">Room: {cls.room} | Teacher: {cls.teacher}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### Day 3-4: Schedule Page with Calendar
```javascript
// src/pages/Schedule.jsx
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

export default function Schedule() {
  const { token } = useSelector(state => state.auth);
  const [weekSchedule, setWeekSchedule] = useState([]);

  useEffect(() => {
    const fetchWeek = async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/schedule/week`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setWeekSchedule(data.week);
    };

    fetchWeek();
  }, [token]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Weekly Schedule</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {weekSchedule.map(dayData => (
          <div key={dayData.day} className="border rounded-lg p-4">
            <h3 className="font-bold text-lg mb-4">{dayData.day}</h3>
            <div className="space-y-3">
              {dayData.classes.length === 0 ? (
                <p className="text-gray-400 text-sm">No classes</p>
              ) : (
                dayData.classes.map(cls => (
                  <div key={cls.classId} className="bg-gray-50 p-2 rounded text-sm">
                    <p className="font-semibold text-xs">{cls.name}</p>
                    <p className="text-xs text-gray-600">{cls.startTime} - {cls.endTime}</p>
                    <p className="text-xs text-gray-600">{cls.room}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### Day 5: Deploy Web
```bash
npm run build
vercel
```

---

## Phase 3: Mobile Frontend (Weeks 5-6)

### Quick Start
```bash
flutter create mobile
cd mobile

# Add dependencies to pubspec.yaml
dependencies:
  http: ^1.1.0
  provider: ^6.0.0
  firebase_auth: ^4.0.0
  pdf: ^3.10.0
```

Build screens similar to web (Auth, Dashboard, Schedule, Upload).

---

## Phase 4: Testing & Iteration (Weeks 7-8)

### Week 7: Internal Testing
1. Invite 5 students to test
2. Share credentials / signup links
3. Collect feedback (bugs, missing features)
4. Fix critical bugs

### Week 8: Polish & Deploy
1. Fix remaining bugs
2. Optimize performance
3. Write README
4. Push to production
5. Submit mobile apps to stores

---

## Key Reminders

✅ **Commit frequently**: `git commit -m "feature: add upload endpoint"`
✅ **Test APIs early**: Use Postman before building UI
✅ **Get user feedback weekly**: Don't build in isolation
✅ **Deploy early**: Production code by week 4
✅ **Handle errors**: Show users clear error messages
✅ **Update data**: Every 2-3 weeks when timetable changes

---

## Common Issues & Solutions

| Problem | Solution |
|---------|----------|
| CORS errors | Add `cors()` middleware in Express |
| Token expired | Refresh token on 401 response |
| PDF parsing fails | Test with actual timetable PDF first |
| Mobile UI issues | Test on real device, not just emulator |
| Users can't find app | Build download link / share QR code |

---

**Start Week 1 on Monday. You got this.**
