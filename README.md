# 🚆 Railway Passenger Digital Platform

> **An all-in-one digital platform providing railway passengers with streamlined ticket booking, real-time seat availability, dynamic fare estimation, live satellite/station telemetry tracking, cancellation management, and journey alerts.**

Designed for academic demonstration and real-world deployment with **maximum space efficiency** (sub-2MB source package, zero heavy C++ native compilation, native Node.js SQLite database) and a modern, responsive UI/UX.

---

## ⚡ Quick Start (Run in 2 Steps)

### Prerequisites
- **Node.js**: v18+ (Node 22 or 24 recommended for zero-dependency native SQLite)
- **Web Browser**: Chrome, Edge, Firefox, or Safari

### Step 1: Install Dependencies
Open your terminal inside the project directory:
```bash
npm run setup
```
*(Installs lightweight packages for both backend server and frontend client)*

### Step 2: Build & Start Live Host
```bash
npm run build:client
npm start
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser!
The Express server automatically initializes the SQLite database, seeds demonstration data, serves all REST APIs, and hosts the production React frontend on a single port.

> **For Hot-Reload Development:**
> ```bash
> npm run dev
> ```
> Backend runs on port `5000`, frontend runs on port `3000` with automatic API proxying.

---

## 🔑 Demo Accounts (For Academic Evaluators)

Pre-seeded accounts are provided with one-click quick-fill buttons on the login screen:

| Role | Email | Password | User Name | Access & Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Demo Passenger** | `passenger@example.com` | `DemoPassword123` | **Priyadharshini M** | Search trains, select travel class, check availability, book tickets, cancel reservations, track live train radar, view journey alerts. |
| **Demo Administrator** | `admin@example.com` | `AdminPassword123` | Operations Controller | Add/edit/delete trains in fleet, adjust fares, manage seat quotas, update live train telemetry with instant passenger alert broadcast. |

---

## 🎫 Regulated Class Pricing Model

The platform enforces realistic, authentic Indian Railways passenger fare ranges across all 6 travel classes:

| Class Code | Class Name | Official Price Range | Typical Services |
| :--- | :--- | :--- | :--- |
| **SL** | Sleeper Class | **₹200 – ₹600** | Express & Superfast Mail trains |
| **3A** | AC 3 Tier | **₹500 – ₹1,200** | Rajdhani, Duronto, Mail & Superfast |
| **2A** | AC 2 Tier | **₹800 – ₹1,800** | Rajdhani, Tejas, Mail & Express |
| **1A** | AC First Class | **₹1,200 – ₹2,500** | Rajdhani, Tejas, Duronto Express |
| **CC** | AC Chair Car | **₹300 – ₹800** | Vande Bharat, Shatabdi, Intercity |
| **EC** | Executive Chair Car | **₹700 – ₹1,500** | Vande Bharat, Shatabdi Express |

---

## 📦 How to Download & Run on Another Laptop (ZIP Package)

To create a clean, ultra-compact ZIP file to share, email, or submit:
```bash
npm run zip
```
This generates **`railway-passenger-digital-platform.zip`** in the root directory (~200 KB, excluding `node_modules`).

### Running from ZIP:
1. Extract `railway-passenger-digital-platform.zip` anywhere on your laptop.
2. Open terminal in the extracted folder.
3. Run:
   ```bash
   npm run setup
   npm start
   ```
4. Visit `http://localhost:5000`.

---

## 🌟 Key Features Implemented

### 1. Passenger Authentication & Roles
- JWT-based authentication with bcrypt password hashing.
- Default passenger account: **Priyadharshini M**.
- Role-based route guarding (`PASSENGER` and `ADMIN`).
- Persistent session handling with auto-expiration detection.
- Quick switch toggle in sidebar for fast academic presentation walkthroughs.

### 2. Train & Journey Search
- Real-time search by Origin Station, Destination Station, and Travel Date.
- Prevents invalid queries (e.g. same origin and destination).
- Flexible date matching so demonstration trains are always discoverable.
- Quick filter buttons for popular express corridors (e.g., New Delhi → Mumbai Central, New Delhi → Varanasi, Bengaluru → Chennai Central).

### 3. Dynamic Seat Availability & Fare Estimation
- Real-time display of available berths/seats per train.
- Visual badges: *Available* (Green), *Fast Filling* (Amber), *Sold Out* (Red).
- Dynamic ticket fare calculation (`Class Fare × Number of Seats`) updated instantly as passengers toggle travel classes or adjust seat counts.

### 4. Ticket Booking & Digital Boarding Pass
- Validated booking form: Passenger Name, Age, Gender, Travel Class, Seat Count.
- Atomic database transaction: decrements available seats safely and prevents double-booking.
- Unique **PNR Reference** generation (e.g. `PNR-748291`).
- Digital Boarding Pass with printable layout, station timetable, passenger details, fare summary, and verification QR code.
- Automatic creation of a **Booking Confirmation Notification**.

### 5. Ticket Cancellation & Instant Seat Restoration
- Passengers can cancel active reservations with an accessible confirmation modal.
- Atomic transaction restores booked seats back to the train's available pool immediately.
- Updates booking status to `CANCELLED` and timestamps the cancellation.
- Generates a **Cancellation Notification** for the passenger.

### 6. Live Train Running Status (Radar & Timeline)
- Interactive station-by-station journey route progress timeline.
- Visual milestones: Passed stations (green checkmark), Current station (pulsing radar dot), and Upcoming stations.
- Tracks live operational status: *On Time*, *Delayed* (+X mins), *Scheduled*, *Arrived*, *Cancelled*.
- Manual "Refresh Telemetry" button for on-demand live status polling.

### 7. Journey Notifications Center
- Real-time alerts for booking confirmations, ticket cancellations, train delays, and travel advisories.
- Unread counter badge in top navigation.
- Mark individual notifications as read or "Mark All as Read", plus dismiss/delete actions.

### 8. System Administrator Control Panel
- Operational KPI metrics: Total Fleet, Total Bookings, Active Confirmed, Cancelled Bookings.
- Fleet Management: Add new trains, edit existing schedules, update fares, modify seat capacities.
- **Live Status Broadcast**: When an admin updates a train's status or delay, all passengers holding confirmed tickets on that train automatically receive an instant journey alert!
- Master Booking Ledger: View and search all bookings across the entire railway system.

---

## 🏗️ System Architecture

```text
┌────────────────────────────────────────────────────────┐
│                   Passenger / Admin                    │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / REST
                            ▼
┌────────────────────────────────────────────────────────┐
│             React + Vite Frontend (SPA)                │
│  - Modern Glassmorphism & Responsive Layout            │
│  - Route Guards (Passenger vs Admin)                   │
│  - Real-time Fare Calculator & Live Status Timeline    │
└───────────────────────────┬────────────────────────────┘
                            │ JSON API with JWT Bearer
                            ▼
┌────────────────────────────────────────────────────────┐
│            Express.js Backend Server (:5000)           │
│  - Auth Controller (Bcrypt, JWT)                       │
│  - Trains API (Search, Details, Live Status)           │
│  - Bookings API (Atomic Seat Allocations, Cancel)      │
│  - Notifications API (Read/Unread, Broadcast)          │
│  - Admin Controller (Fleet CRUD, Master Ledger)        │
└───────────────────────────┬────────────────────────────┘
                            │ Prepared SQL Statements (WAL)
                            ▼
┌────────────────────────────────────────────────────────┐
│           SQLite Database (Node.js Built-in)           │
│  - users, trains, bookings, notifications              │
└────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### `users`
- `id` (INTEGER, PK AUTOINCREMENT)
- `name` (TEXT NOT NULL)
- `email` (TEXT NOT NULL UNIQUE)
- `password_hash` (TEXT NOT NULL)
- `role` (TEXT NOT NULL DEFAULT 'PASSENGER')
- `created_at` (DATETIME NOT NULL)

### `trains`
- `id` (INTEGER, PK AUTOINCREMENT)
- `train_number` (TEXT NOT NULL UNIQUE)
- `train_name` (TEXT NOT NULL)
- `source` (TEXT NOT NULL)
- `destination` (TEXT NOT NULL)
- `departure_time` (TEXT NOT NULL)
- `arrival_time` (TEXT NOT NULL)
- `journey_date` (DATE NOT NULL)
- `total_seats` (INTEGER NOT NULL)
- `available_seats` (INTEGER NOT NULL)
- `fare` (REAL NOT NULL)
- `status` (TEXT NOT NULL DEFAULT 'Scheduled')
- `current_station` (TEXT)
- `delay_minutes` (INTEGER DEFAULT 0)
- `created_at` (DATETIME NOT NULL)

### `bookings`
- `id` (INTEGER, PK AUTOINCREMENT)
- `booking_reference` (TEXT NOT NULL UNIQUE, e.g. `PNR-102938`)
- `user_id` (INTEGER NOT NULL, FK → users.id)
- `train_id` (INTEGER NOT NULL, FK → trains.id)
- `journey_date` (DATE NOT NULL)
- `passenger_name` (TEXT NOT NULL)
- `passenger_age` (INTEGER NOT NULL)
- `passenger_gender` (TEXT NOT NULL)
- `seat_count` (INTEGER NOT NULL)
- `fare` (REAL NOT NULL)
- `status` (TEXT NOT NULL DEFAULT 'CONFIRMED')
- `created_at` (DATETIME NOT NULL)
- `cancelled_at` (DATETIME)

### `notifications`
- `id` (INTEGER, PK AUTOINCREMENT)
- `user_id` (INTEGER NOT NULL, FK → users.id)
- `booking_id` (INTEGER, FK → bookings.id)
- `title` (TEXT NOT NULL)
- `message` (TEXT NOT NULL)
- `type` (TEXT NOT NULL)
- `is_read` (INTEGER NOT NULL DEFAULT 0)
- `created_at` (DATETIME NOT NULL)

---

## 🌿 Space Efficiency Highlights

1. **Native SQLite Database Engine:** Utilizes Node.js's built-in SQLite database (`node:sqlite`). Zero bulky C++ compilation steps, zero external binaries, 0 MB overhead.
2. **Minimal Dependency Tree:** Backend uses only pure-JavaScript packages (`express`, `cors`, `jsonwebtoken`, `bcryptjs`, `dotenv`).
3. **Frontend Bundle:** Vite build compiles modern React code into a compressed, high-performance static asset directory (`client/dist`).
4. **Clean Distribution Archive:** The built-in `npm run zip` command creates a compressed archive under **2 MB**, ensuring anyone can download and run it without disk space concerns.

---

## 🧪 Demonstration Sequence (Presentation Walkthrough)

1. **Login:** Open `http://localhost:5000/login`. Click **"Demo Passenger"** and sign in.
2. **Dashboard:** View the search bar, upcoming journey summary, and journey alerts.
3. **Search:** Enter `Station A` to `Station B` and click **"Find Trains"**.
4. **Availability & Fare:** Observe the real-time seat availability badge and ticket price.
5. **Book Ticket:** Click **"Book Ticket"**, adjust seats, see instant fare calculation, and submit.
6. **Boarding Pass:** Review the generated digital ticket with PNR, travel times, and QR code.
7. **Notifications:** Click the Bell icon to see the confirmed booking notification.
8. **Live Train Status:** Navigate to **"Live Train Status"** and track the train along its station progress timeline.
9. **Cancellation:** Go to **"My Bookings"**, click **"Cancel"**, confirm the modal, and observe the status update and seat restoration.
10. **Admin Panel:** Use the sidebar **"Demo Quick Switch"** to switch to **"Admin"**.
11. **Update Live Status:** In the Admin Dashboard, change train status to *Delayed (+15 mins)* at *Kanpur Central*.
12. **Verify Broadcast:** Switch back to Passenger; verify that an alert regarding the delay was dispatched to the passenger's notification center!
