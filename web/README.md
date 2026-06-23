# UOS Timetable Web Application

A premium, responsive, React-based web interface designed for university schedule management, allowing students to view daily classes, manage weekly schedules, upload timetable PDFs, and dynamically search for unoccupied classrooms.

## Features

- **Dynamic Weekly Schedule**: An interactive, visual grid mapping classes across days and times.
- **Dynamic Room Finder**: Computes classroom and lab occupancy status in real-time, showing which locations are free or occupied and listing upcoming classes.
- **Timetable PDF Upload & Parser**: An interface for uploading PDF schedules, displaying parsed entries for confirmation before database sync.
- **Responsive Navigation**: Adaptive side navigation panel with clean route transitions.
- **Flexible Theme Engine**: Support for dark and light UI layouts.

## Tech Stack

- **Core**: React 19 + Vite
- **State Management**: Zustand
- **Icons**: Lucide React
- **Routing**: React Router DOM (v7)
- **Styling**: Vanilla CSS

## Getting Started

### 1. Environment Setup

Copy the environment example file and configure the backend URL:

```bash
cp .env.example .env
```

Define the backend address inside `.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Run Automated Test Suite

```bash
npm run test
```
