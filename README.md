# Stock Suggestion Application

This is my project for a full-stack stock suggestion and tracking app. It has a Node.js/Express backend with MongoDB and a React + Vite frontend. Real-time updates are sent over WebSockets.

## Project Structure

- stock-suggestion-backend/ - API server, auth, stock routes, services
- stock-suggestion-frontend/ - React app (Vite + Tailwind)

## Tech Stack

- Backend: Node.js, Express, MongoDB, Passport, JWT
- Frontend: React, Vite, Tailwind CSS
- Realtime: WebSockets

## Setup

### Prerequisites

- Node.js (LTS)
- npm
- MongoDB (local or cloud)

### Backend

```
cd stock-suggestion-backend
npm install
```

Create a `.env` file in `stock-suggestion-backend/` and add your config. Example:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/stock_suggestion
JWT_SECRET=your_secret
CLIENT_URL=http://localhost:5173
```

Run the server:

```
npm start
```

### Frontend

```
cd stock-suggestion-frontend
npm install
npm run dev
```

The app should be at `http://localhost:5173`.

## Features

- User auth (login/register/reset password)
- Stock search and charts
- Top picks, trends, and watchlist pages
- Real-time stock updates

## Scripts

### Backend

- `npm start` - start server
- `npm run dev` - start with nodemon (if configured)

### Frontend

- `npm run dev` - start Vite dev server
- `npm run build` - build for production
- `npm run preview` - preview build

## Notes

- This is a learning project, so there might be rough edges.
- If something breaks, check the console logs on both frontend and backend.

## License

MIT
