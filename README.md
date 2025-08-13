## Attendance Tracking

Full‑stack attendance system with role‑based access and real‑time updates.

### Core Features
* Roles: admin, teacher, student (Clerk auth or local JWT fallback)
* Mark & view daily attendance (student self‑mark endpoint `/api/attendance/self`)
* Monthly grid with live socket updates (`attendance:update`)
* Dashboard stats & student directory (mock list extensible to real data)
* MongoDB persistence, retrying connection logic

### Tech
Frontend: React 18, TypeScript, Vite, Tailwind, React Query, Clerk, Socket.IO client
Backend: Node.js, Express, TypeScript, Mongoose, Socket.IO, express‑validator
Database: MongoDB Atlas (or local)

### Quick Start
Clone and install (workspaces):
```bash
npm install
```
Environment (create both files):
```
server/.env
   PORT=5060
   NODE_ENV=development
   MONGODB_URI=<your_mongodb_uri>
   JWT_SECRET=dev_secret
   JWT_EXPIRE=30d
   CLIENT_URL=http://localhost:3000
   CLIENT_URLS=http://localhost:3000,http://localhost:3001
   # Optional Clerk (omit to use local JWT mock):
   # CLERK_SECRET_KEY=sk_test_...

client/.env.local
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...   # required only if using Clerk
   VITE_API_PORT=5060                      # matches server PORT
```
Run both (concurrently):
```bash
npm run dev
```
Client: http://localhost:3000 (auto shifts to 3001 if busy)
API:    http://localhost:5060

### Key Endpoints
`POST /api/attendance/self`  student marks own attendance (auto‑creates private course)
`GET  /api/attendance`       filtered attendance (role‑scoped)
`GET  /api/attendance/stats` summary counts
`GET  /api/auth/me`          current authenticated user

### Real‑Time
Socket joins rooms by role + user id. Server emits `attendance:update` on create/update/delete; client listens and merges.

### Extending
* Replace mock student roster (admin/teacher view) by querying `/api/users` and course enrollment.
* Add pagination & filtering to attendance queries.
* Harden role assignments (persist real roles in User documents when creating via Clerk webhook or admin UI).

### Scripts
`npm run dev`        start client + server
`npm run build`      build client (Vite) + server (tsc)
`npm start`          run built server (serve API + sockets)

### Project Layout
```
client/  React UI & auth contexts
server/  Express API, models, controllers, middleware
```

### Notes
* If Clerk keys are absent, a mock student user is created from tokens; adjust once real auth/roles are needed.
* Socket client uses same origin path so Vite proxy forwards WS traffic to server port.

License: MIT