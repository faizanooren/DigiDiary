# 🚀 DigiDiary - Running Guide

## Quick Start (Recommended)

Run both frontend and backend simultaneously:
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Separate Terminal Setup (Alternative)

If you prefer to run them in separate terminals:

### Terminal 1 - Backend
```bash
cd server
npm run dev
```

### Terminal 2 - Frontend
```bash
cd client
npm start
```

## Installation

If you haven't installed dependencies yet:
```bash
npm run install-all
```

## Environment Setup

Make sure you have the following environment variables set up:

### Backend (.env in server folder)
```env
MONGODB_URI=mongodb://localhost:27017/digidiary
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
SERVER_URL=http://localhost:5000
```

## Troubleshooting

### Port Issues
- Frontend runs on port 3000
- Backend runs on port 5000
- Make sure these ports are available

### Database Issues
- Ensure MongoDB is running
- Check your MONGODB_URI in server/.env

### API Issues
- Frontend makes requests to http://localhost:5000/api/*
- Backend serves API at http://localhost:5000/api/*

## Development Workflow

1. Start the application: `npm run dev`
2. Make changes to frontend (client/src/) or backend (server/)
3. Changes will auto-reload
4. Check browser console and terminal for errors

## Build for Production

```bash
npm run build
```

This creates an optimized build in client/build/ 