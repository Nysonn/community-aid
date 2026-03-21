# CommunityAid Frontend

A progressive web application (PWA) for coordinating emergency responses across Uganda. Community members can post emergency requests, volunteers can offer help, and administrators manage the platform from a dedicated dashboard.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [Prerequisites](#3-prerequisites)
4. [Getting Started](#4-getting-started)
5. [Environment Variables](#5-environment-variables)
6. [Project Structure](#6-project-structure)
7. [Key Features](#7-key-features)
8. [Offline Support](#8-offline-support)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Deployment](#10-deployment)

---

## 1. Overview

CommunityAid connects people in need with those who can help. The platform supports four emergency categories — **medical**, **food**, **rescue**, and **shelter** — and allows community members to post requests with location data and media attachments. Volunteers can offer help (transport, donation, or expertise), and admins approve requests, manage users, and log donations.

The frontend is fully offline-capable: actions taken without a network connection are queued in IndexedDB and synced automatically when connectivity is restored.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 + TypeScript |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS v3 |
| State Management | Redux Toolkit |
| Server State | TanStack Query v5 |
| Authentication | Clerk |
| HTTP Client | Axios |
| Routing | React Router DOM v7 |
| Maps | Leaflet + react-leaflet |
| Offline Storage | IndexedDB (via `idb`) |
| PWA | vite-plugin-pwa (Workbox) |

---

## 3. Prerequisites

- Node.js 18 or later
- npm 9 or later
- A [Clerk](https://clerk.com) account with a configured application
- A running instance of the CommunityAid backend API

---

## 4. Getting Started

```bash
# Clone the repository
git clone <repo-url>
cd community-aid

# Install dependencies (legacy peer deps needed for vite-plugin-pwa with Vite 8)
npm install --legacy-peer-deps

# Copy environment template and fill in your values
cp .env.example .env.local

# Start the development server
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview
```

---

## 5. Environment Variables

Create a `.env.local` file in the project root. All variables are required at build time.

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

| Variable | Description |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key from your Clerk dashboard |
| `VITE_API_BASE_URL` | Base URL of the CommunityAid backend API |

The app validates these at startup and throws a descriptive error if either is missing.

---

## 6. Project Structure

```
src/
├── api/                  # Axios API modules
│   ├── client.ts         # Axios instance with auth + error interceptors
│   ├── requests.ts       # Emergency request endpoints
│   ├── offers.ts         # Offer endpoints
│   ├── users.ts          # User profile endpoints
│   └── admin.ts          # Admin-only endpoints
│
├── components/
│   ├── common/
│   │   ├── OfflineBanner.tsx   # Fixed amber offline indicator
│   │   └── Toast.tsx           # Bottom-right toast notification stack
│   ├── layout/
│   │   ├── Layout.tsx          # Root layout: Navbar, footer, Toast context
│   │   └── Navbar.tsx          # Responsive nav with pending-actions badge
│   └── requests/
│       ├── RequestCard.tsx     # Card with type/status badge exports
│       └── CreateRequestModal.tsx  # Dual create/edit modal with offline queue
│
├── hooks/
│   ├── useAuth.ts          # Clerk + Redux auth bridge
│   ├── useOfflineSync.ts   # Triggers sync on mount and online events
│   └── useToast.ts         # Toast state (showToast, dismissToast)
│
├── offline/
│   ├── db.ts               # IndexedDB setup and typed accessors (v2)
│   └── sync.ts             # syncPendingActions + rehydratePendingActions
│
├── pages/
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── RequestsPage.tsx        # Filterable request list, online/offline mode
│   ├── RequestDetailPage.tsx   # Request detail, offers, Offer Help form
│   ├── MapPage.tsx             # Leaflet map of requests and offers
│   ├── ProfilePage.tsx         # Profile view/edit, avatar upload, my requests
│   ├── AdminDashboardPage.tsx  # 5-tab admin panel
│   └── NotFoundPage.tsx
│
├── store/
│   ├── index.ts
│   └── slices/
│       ├── authSlice.ts        # user, isAuthenticated, isLoading
│       ├── requestsSlice.ts    # requests, myRequests, selectedRequest
│       ├── offersSlice.ts      # offers cache
│       └── offlineSlice.ts     # pendingActions, isSyncing, lastSyncedAt
│
├── types/
│   └── index.ts            # Shared TypeScript interfaces
│
├── App.tsx                 # Route definitions and guards
└── main.tsx                # Provider stack and env validation
```

---

## 7. Key Features

### Emergency Requests
- Browse and filter requests by type, status, and location name
- Post new requests with title, description, type, location, coordinates, and up to 5 media files
- Edit existing requests (owners and admins)
- Admin approve/reject from the request detail page or admin dashboard

### Offers of Help
- Submit transport, donation, or expertise offers on any approved request
- Request owners can update offer status (pending → accepted → fulfilled)
- Offer locations displayed on the map

### Interactive Map
- Leaflet map centered on Uganda
- Red markers for approved emergency requests
- Blue markers for offers with coordinates
- Toggle buttons to show/hide each layer
- Admins see live data; community members see the IndexedDB cache

### Admin Dashboard
Five sidebar tabs:
- **Overview** — 10 platform-wide stat cards with skeleton loading
- **Requests** — filterable table with inline approve/reject actions
- **Offers** — read-only offers table
- **Users** — activate/deactivate community members (admins excluded)
- **Donations** — log new donations + all-donations table

### Profile
- View and inline-edit full name, phone number, and bio
- Avatar photo upload
- My Requests list with status badges

---

## 8. Offline Support

CommunityAid is designed to work in areas with intermittent connectivity.

### Service Worker (Workbox)
- **API calls** — `NetworkFirst` with a 10-second timeout, falling back to cache
- **OpenStreetMap tiles** — `CacheFirst`, cached for 30 days (up to 500 tiles)
- **App shell** — pre-cached JS, CSS, HTML, fonts, and icons

### IndexedDB (version 2)
Four object stores:
- `requests` — cached request list
- `offers` — cached offers per request
- `pendingActions` — queued mutations (CREATE_REQUEST, CREATE_OFFER, UPDATE_PROFILE)
- `profile` — cached user profile

### Pending Action Queue
When offline:
1. The action is saved to IndexedDB (`savePendingAction`)
2. A Redux action is dispatched (`addPendingAction`) so the Navbar shows the amber badge
3. On reconnect (or next page load), `syncPendingActions` processes each action in order, removing it from both IDB and Redux on success

### Offline UI
- `OfflineBanner` — fixed amber bar at the top of the viewport when offline
- `RequestsPage` and `ProfilePage` show an amber "showing cached data" banner
- The Navbar brand shows an amber badge with the count of unsynced actions

---

## 9. Authentication & Authorization

Authentication is handled by [Clerk](https://clerk.com). The `useAuth` hook bridges Clerk state with Redux:

- On sign-in, it calls `GET /users/me` and stores the user in Redux
- On sign-out, it clears Redux state and redirects to `/`

The Axios `client.ts` attaches a `Bearer` token to every request and handles:
- **401/403** — clears the Redux user and redirects to `/login`
- **Error messages** — extracts `response.data.message` for display in toasts

### Route Guards
- `ProtectedRoute` — redirects unauthenticated users to `/login`
- `AdminRoute` — redirects non-admin users to `/`

### Roles
| Role | Access |
|---|---|
| `community_member` | Browse, post requests, submit offers, edit profile |
| `admin` | All of the above + approve/reject requests, manage users, log donations |

---

## 10. Deployment

The app builds to a standard static site (`dist/`) and can be served from any CDN or static host (Vercel, Netlify, Cloudflare Pages, etc.).

```bash
npm run build
# Deploy the dist/ directory
```

**Important:** Configure your host to serve `index.html` for all routes (SPA fallback), and set the required environment variables in your hosting platform's settings.

The PWA manifest is served as `/manifest.webmanifest`. Replace the placeholder icons in `public/icons/` with production-quality 192×192 and 512×512 PNG icons before deploying.
