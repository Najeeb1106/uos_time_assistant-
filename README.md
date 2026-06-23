# UOS Timetable Application

[![CI Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-orange.svg)](#)

A complete, production-grade scheduling and room occupancy finder system designed for the University of Sargodha (UOS) computing department. The application enables automated parsing of timetable PDFs, dynamic calendar navigation, and live occupancy calculation for classrooms and laboratories.

## Features

- **Automated PDF Parsing**: Extracts class schedules, sections, teachers, rooms, and day sequences directly from timetable PDFs.
- **Dynamic Weekly Timetable**: Interactive visual calendar for students and faculty.
- **Live Room Finder**: Real-time room vacancy classifier for both classrooms and labs, featuring next-class warnings and occupancy statuses.
- **Mock & Live Modes**: Seamlessly transitions between a local mock database (for offline development) and Firebase Production Mode.
- **Secure Authentication**: Integration with Firebase Auth for student/teacher login and signup validation.

## Tech Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database / Auth**: Firebase Firestore & Firebase Auth
- **Libraries**: `pdf-parse` (timetable text extraction), `jsonwebtoken`, `multer`

### Web Frontend
- **Framework**: React 19 + Vite
- **State Management**: Zustand
- **Icons**: Lucide React
- **Styling**: Vanilla CSS

---

## Folder Structure

```
uos/
├── backend/
│   ├── src/
│   │   ├── config/      # Firebase and environmental configuration
│   │   ├── controllers/ # Route handlers (auth, schedule)
│   │   ├── middleware/  # Authentication verification guards
│   │   ├── utils/       # Timetable parsing engines
│   │   └── app.js       # Express application entrypoint
│   ├── .env.example     # Template for backend secrets
│   └── package.json     # Node scripts and dependencies
├── web/
│   ├── src/
│   │   ├── assets/      # JSON mock schedules and images
│   │   ├── components/  # Layout and shell interfaces
│   │   ├── pages/       # Login, Register, Schedule, FreeRooms
│   │   └── store/       # Zustand client-side application state
│   ├── scripts/         # Automated React component and unit tests
│   ├── .env.example     # Template for web client parameters
│   └── package.json     # Web scripts and dev dependencies
├── ARCHITECTURE.md      # Detailed system architecture document
└── README.md            # Primary repository entrypoint
```

---

## Setup and Installation

### Prerequisite
Make sure you have [Node.js (v18+)](https://nodejs.org/) installed.

### 1. Clone & Install Dependencies

From the workspace root directory:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../web
npm install
```

### 2. Configure Environment Variables

#### Backend configuration
In the `backend` folder, duplicate the example file:
```bash
cp .env.example .env
```
Open `.env` and configure:
```env
PORT=3000
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=your-jwt-secret-key
FACULTY_SECRET_KEY=your-faculty-secret-key-here
```
*Note: To run in Firebase Production Mode, uncomment and fill in the Firebase credential keys inside `.env`.*

#### Web configuration
In the `web` folder, duplicate the example file:
```bash
cp .env.example .env
```
Open `.env` and set:
```env
VITE_API_URL=http://localhost:3000/api
```

### 3. Run the Servers

#### Backend
From the `backend` folder:
```bash
npm run dev
```

#### Frontend
From the `web` folder:
```bash
npm run dev
```

---

## Verification & Testing

To validate state management and room occupancy algorithms, run the automated test suite in the `web` folder:

```bash
cd web
npm run test
```

## Known Limitations
- The PDF parsing algorithm expects standard UOS Timetable PDF layout conventions. Major structural modifications to the PDF tables may require updates in the parsing script.

## License
Distributed under the MIT License. See `LICENSE` for more details.
