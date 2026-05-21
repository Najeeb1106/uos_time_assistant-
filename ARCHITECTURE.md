# UOS Timetable App - System Architecture

## 1. System Overview

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Web App   │         │  Mobile App  │         │   Backend   │
│  (React)    │────────▶│  (Flutter)   │◀────────│  (Node.js)  │
└─────────────┘         └──────────────┘         └─────────────┘
                               │                         │
                               └─────────────┬───────────┘
                                             │
                                    ┌────────▼────────┐
                                    │   Firebase DB   │
                                    │   + Storage     │
                                    └─────────────────┘
```

---

## 2. Tech Stack

### Frontend
- **Web**: React 18 + Vite
- **Mobile**: Flutter (cross-platform: iOS + Android)
- **State Management**: Redux or Zustand
- **Styling**: Tailwind CSS (web), Flutter Material/Cupertino
- **PDF Parsing**: pdf-parse (Node.js backend) + pdf.js (for preview)

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore (NoSQL)
- **File Storage**: Firebase Storage (for PDFs)
- **PDF Parsing**: pdf-parse library

### Deployment
- **Backend**: Vercel or Heroku (free tier to start)
- **Frontend (Web)**: Vercel
- **Frontend (Mobile)**: TestFlight (iOS) + Google Play Console (Android)
- **Database**: Firebase (free tier includes 1GB storage)

---

## 3. Database Schema

### Collections

#### `users`
```javascript
{
  uid: "firebase_user_id",
  email: "student@uos.edu.pk",
  createdAt: timestamp,
  profile: {
    program: "BS in Software Engineering",
    type: "Regular",  // or "Self Support"
    batch: "2024-2028",  // graduation year
    semester: 2,
    fullName: "Ahmed Ali"
  }
}
```

#### `schedules`
```javascript
{
  uid: "firebase_user_id",
  uploadedAt: timestamp,
  pdfFileName: "timetable_2024.pdf",
  pdfStorageUrl: "gs://bucket/...",
  parsedClasses: [
    {
      classId: "unique_id",
      name: "Object Oriented Programming",
      code: "#CE1201",
      room: "CR224",
      teacher: "Dr. Muhammad Summair Raza",
      day: "Monday",  // or "Tuesday", etc.
      startTime: "08:00",
      endTime: "09:30",
      batch: "2024-2028",
      semester: 2,
      type: "Regular"
    }
    // ... more classes
  ],
  isCurrent: true  // latest upload
}
```

#### `uploads_history`
```javascript
{
  uid: "firebase_user_id",
  uploadedAt: timestamp,
  pdfStorageUrl: "gs://bucket/...",
  parseStatus: "success" | "failed",
  errorMessage: null | "error details"
}
```

### Indexes
- `users.uid` (primary)
- `schedules.uid + schedules.isCurrent`
- `uploads_history.uid + uploadedAt`

---

## 4. API Endpoints

### Authentication
```
POST /api/auth/register
  Input: { email, password, program, type, batch, semester }
  Output: { uid, token, user }

POST /api/auth/login
  Input: { email, password }
  Output: { uid, token, user }

POST /api/auth/logout
  Input: { token }
  Output: { success: true }

GET /api/auth/me
  Headers: { Authorization: "Bearer token" }
  Output: { user }
```

### Timetable Management
```
POST /api/schedule/upload
  Headers: { Authorization: "Bearer token" }
  Body: FormData { file: PDF }
  Output: { 
    success: true, 
    classes: [...],
    message: "Schedule updated"
  }

GET /api/schedule/current
  Headers: { Authorization: "Bearer token" }
  Output: { 
    classes: [{ classId, name, room, teacher, day, startTime, endTime }],
    uploadedAt: timestamp
  }

GET /api/schedule/week
  Headers: { Authorization: "Bearer token" }
  Query: { date: "2025-01-20" }
  Output: { 
    week: [
      { day: "Monday", classes: [...] },
      { day: "Tuesday", classes: [...] },
      ...
    ]
  }

GET /api/schedule/today
  Headers: { Authorization: "Bearer token" }
  Output: { 
    today: "Monday",
    classes: [...],
    nextClass: { name, room, startTime, endTime }
  }

GET /api/schedule/history
  Headers: { Authorization: "Bearer token" }
  Output: { 
    uploads: [
      { uploadedAt, pdfStorageUrl, classCount }
    ]
  }

DELETE /api/schedule/{uploadId}
  Headers: { Authorization: "Bearer token" }
  Output: { success: true }
```

---

## 5. PDF Parsing Logic

### Algorithm
```javascript
1. Receive PDF file upload
2. Extract text from PDF (pdf-parse library)
3. Search for user's batch + semester pattern
   Pattern: "BS in Software Engineering [Type] ( [Batch] ) Semester#[Sem]"
4. Extract all classes under that section until next section
5. Parse each line for:
   - Class name & code
   - Room number
   - Teacher name
   - Time (HH:MM - HH:MM)
   - Day (inferred from column position in PDF)
6. Validate extracted data
7. Store in database
8. Return parsed classes to frontend
```

### Example Parse
```
Input: "Object Oriented Programming #CE1201 CR224 Dr. Muhammad Summair Raza (08:00 - 09:30)"

Output: {
  classId: "hash_of_details",
  name: "Object Oriented Programming",
  code: "CE1201",
  room: "CR224",
  teacher: "Dr. Muhammad Summair Raza",
  startTime: "08:00",
  endTime: "09:30",
  day: "Monday"  // inferred from PDF layout
}
```

### Error Handling
- Invalid PDF format → Return error message
- No matching batch/semester → Notify user
- Partially parsed → Show what was found + warning

---

## 6. Frontend Architecture

### Web App (React)

#### Pages
1. **Auth Pages**
   - `/login` - Email/password login
   - `/register` - Sign up with program/batch selection
   - `/forgot-password` - Password recovery

2. **Main Pages**
   - `/dashboard` - Home (Today's classes + quick upload)
   - `/schedule` - Weekly calendar view
   - `/schedule/day/:date` - Single day detailed view
   - `/upload` - PDF upload interface
   - `/history` - Previous uploads
   - `/settings` - User profile & logout

#### Components
```
App.jsx
├── Layout
│   ├── Header (Logo, user menu, logout)
│   ├── Sidebar (Navigation)
│   └── Footer
├── Pages
│   ├── Dashboard
│   │   ├── TodayView
│   │   ├── NextClassAlert
│   │   └── QuickUploadWidget
│   ├── Schedule
│   │   ├── WeeklyCalendar
│   │   ├── ClassCard
│   │   └── TimeSlot
│   ├── Upload
│   │   ├── FileDragDrop
│   │   ├── ParseProgress
│   │   └── ClassPreview
│   └── Settings
│       ├── ProfileForm
│       └── UploadHistory
└── Shared
    ├── ClassCard
    ├── LoadingSpinner
    ├── ErrorAlert
    └── ConfirmDialog
```

#### State Management (Redux Example)
```javascript
store/
├── auth/
│   ├── authSlice.js (user, token, loading)
│   └── authThunks.js (login, register, logout)
├── schedule/
│   ├── scheduleSlice.js (classes, selectedDate, uploadHistory)
│   └── scheduleThunks.js (fetchSchedule, uploadPDF, deleteUpload)
└── ui/
    └── uiSlice.js (loading, errors, notifications)
```

### Mobile App (Flutter)

#### Screens
- AuthScreen (Login/Register)
- DashboardScreen (Today's schedule)
- WeekScheduleScreen (Weekly view)
- UploadScreen (PDF picker + upload)
- SettingsScreen (Profile + logout)

#### Widgets
- ClassTile (Individual class card)
- TimelineView (Vertical timeline of classes)
- PDFPicker (File upload)
- NotificationBanner (Alerts)

---

## 7. User Flows

### First-Time User Flow
```
1. User opens app
2. Redirected to login/register
3. Register with:
   - Email & password
   - Program (dropdown: "BS Software Engineering" | "MS Software Engineering")
   - Type (radio: "Regular" | "Self Support")
   - Batch (dropdown: "2024-2028", "2023-2027", etc.)
   - Semester (dropdown: 1-8)
4. Email verification (if needed)
5. Redirected to upload screen
6. Upload timetable PDF
7. App parses PDF, extracts classes
8. Shows preview of parsed classes
9. User confirms
10. Dashboard shows their schedule
```

### Returning User Flow
```
1. User logs in
2. Dashboard shows today's schedule (cached)
3. User can:
   - View weekly schedule
   - Upload new PDF (when timetable changes)
   - Check upload history
   - Update profile
```

### PDF Upload Flow
```
1. User clicks "Upload Timetable"
2. Select PDF file (web) or choose from files (mobile)
3. Show "Parsing..." progress
4. Backend parses PDF
5. Show preview: "Found 25 classes for Semester 2"
6. User reviews + confirms
7. Classes saved to database
8. Show "Schedule updated successfully"
9. Redirect to dashboard
```

---

## 8. Implementation Timeline

### Phase 1: Backend Setup (Weeks 1-2)
- [ ] Firebase project setup (Auth, Firestore, Storage)
- [ ] Express.js API skeleton
- [ ] PDF parsing module (pdf-parse)
- [ ] Authentication endpoints
- [ ] PDF upload & parsing endpoints
- [ ] Database schema setup
- [ ] Basic error handling

**Deliverable**: Working API, test with Postman

### Phase 2: Web Frontend (Weeks 3-4)
- [ ] React project setup (Vite)
- [ ] Auth pages (login, register)
- [ ] Redux setup
- [ ] Dashboard/Today view
- [ ] Weekly calendar view
- [ ] PDF upload interface
- [ ] Responsive design (mobile + desktop)

**Deliverable**: Functional web app, test with real users

### Phase 3: Mobile Frontend (Weeks 5-6)
- [ ] Flutter project setup
- [ ] Auth screens
- [ ] Schedule screens (day view + week view)
- [ ] PDF upload (file picker)
- [ ] Settings screen
- [ ] Basic animations/polish

**Deliverable**: Working mobile app (beta)

### Phase 4: Testing & Iteration (Weeks 7-8)
- [ ] Internal testing (you + 5 real users)
- [ ] Bug fixes
- [ ] Performance optimization
- [ ] Feedback-based features (dark mode, export, etc.)
- [ ] Deployment to staging
- [ ] Documentation

**Deliverable**: Production-ready app, deployed

---

## 9. Key Features (MVP)

### Must Have
1. ✅ Login/Register with batch selection
2. ✅ PDF upload & parsing
3. ✅ View today's classes
4. ✅ View weekly schedule
5. ✅ Mobile responsive
6. ✅ Dark mode toggle

### Nice to Have (v2)
1. Export to Google Calendar
2. Push notifications (class reminders)
3. Search by teacher/course name
4. Schedule sharing (QR code or link)
5. Offline access (cache)
6. Class notes/links

### NOT in MVP
1. Real-time admin updates (too complex)
2. Location maps (out of scope)
3. Teacher portal (different product)
4. Advanced analytics (premature)

---

## 10. Security Considerations

1. **Authentication**
   - Use Firebase Auth (secure, battle-tested)
   - JWT tokens for API calls
   - Refresh token rotation

2. **File Upload**
   - Validate file type (PDF only)
   - Limit file size (10MB max)
   - Scan for malware (optional: VirusTotal API)
   - Store in Firebase Storage (encrypted)

3. **Data Privacy**
   - User sees only their own schedule
   - PDFs deleted after parsing (optional)
   - HTTPS only
   - Firestore security rules (user UID-based access)

4. **Rate Limiting**
   - Max 5 PDF uploads per user per day
   - Prevent API abuse (Express rate-limit middleware)

---

## 11. Deployment Checklist

### Before Production
- [ ] Environment variables configured (.env)
- [ ] Firebase security rules reviewed
- [ ] Error logging setup (Sentry or similar)
- [ ] Performance tested (Lighthouse score >80)
- [ ] Mobile tested on real devices
- [ ] User documentation written
- [ ] Bug tracking system (GitHub Issues)
- [ ] Backup strategy (Firestore automatic backups)

### Launch
- [ ] Deploy backend (Vercel/Heroku)
- [ ] Deploy web frontend (Vercel)
- [ ] Submit mobile apps to stores (TestFlight, Play Store)
- [ ] Tell your 5 initial users to test
- [ ] Monitor for errors
- [ ] Be ready to fix bugs quickly

---

## 12. Success Metrics

Track these to show impact:

1. **Adoption**: Number of active users per week
2. **Usage**: Average logins per user per week
3. **Uploads**: PDFs uploaded per week
4. **Satisfaction**: User feedback (simple survey)
5. **Performance**: App load time, parse time
6. **Reliability**: Uptime, error rate

**Your goal for portfolio**: 50+ active users by end of semester, with positive feedback.

---

## 13. Git Repository Structure

```
uos-timetable-app/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   └── schedule.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   └── scheduleController.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── utils/
│   │   │   └── pdfParser.js
│   │   ├── config/
│   │   │   └── firebase.js
│   │   └── app.js
│   ├── .env.example
│   ├── package.json
│   └── README.md
├── web/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/ (Redux)
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   └── README.md
├── mobile/
│   ├── lib/
│   │   ├── screens/
│   │   ├── widgets/
│   │   ├── services/
│   │   └── main.dart
│   ├── pubspec.yaml
│   └── README.md
├── .gitignore
└── README.md
```

---

## 14. Next Steps

1. **Confirm this architecture** with your team
2. **Create Firebase project** (google.com/firebase)
3. **Set up Git repository**
4. **Start Phase 1** (Backend setup)
5. **Weekly check-ins** with your 5 initial users
6. **Iterate based on feedback**

---

## Important Notes

- **Don't over-engineer**: Start simple, add features based on feedback
- **Deploy early**: Get running code in production week 3-4
- **User feedback > perfect code**: Real users using a 70% solution beats perfect code nobody uses
- **Maintain it**: Update data every 2-3 weeks when timetable changes
- **Document everything**: Future you will thank present you

---

**You've got this. This is a real, valuable product. Now build it.**
