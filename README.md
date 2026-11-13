# Quantiphi E-Commerce Product Multi-Filter Sidebar

A modular, full-stack e-commerce product exploration application featuring an interactive multi-filter sidebar.

## Tech Stack

### Backend
- **Runtime:** Node.js 18+ (tested on Node v22+)
- **Framework:** Express
- **Middleware:** CORS
- **Development Tooling:** nodemon
- **Testing:** Node.js native test runner (`node --test`)

### Frontend
- **Library:** React 18
- **Build Tool:** Vite
- **Styling:** Plain CSS
- **Data Fetching:** Native Fetch API

---

## Monorepo Architecture

```
/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration and constants
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Custom middleware (error handling, logging)
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic & data handling
│   │   ├── app.js           # Express app initialization
│   │   └── server.js        # Server listener entry point
│   ├── tests/               # Test suites
│   ├── .env.example         # Example environment variables
│   └── package.json         # Backend scripts and dependencies
├── frontend/
│   ├── public/              # Static public assets
│   ├── src/
│   │   ├── assets/          # Images and static assets
│   │   ├── components/      # Modular UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API communication (native fetch)
│   │   ├── styles/          # Global and modular CSS stylesheets
│   │   ├── App.css          # App-level styling
│   │   ├── App.jsx          # Main application component
│   │   ├── index.css        # Reset and global base styles
│   │   └── main.jsx         # React DOM rendering entry point
│   ├── .env.example         # Frontend environment configuration
│   ├── index.html           # HTML template
│   ├── package.json         # Frontend scripts and dependencies
│   └── vite.config.js       # Vite configuration
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Backend Setup
```bash
cd backend
npm install
npm run dev
```
The backend server runs by default on `http://localhost:5000`.

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend development server runs by default on `http://localhost:5173`.

