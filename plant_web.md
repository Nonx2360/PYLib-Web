# Detailed Migration Plan: The-PY-LIB-Project (Web-App Remake)

This document provides a granular technical roadmap for transforming the Python desktop Library Management System into a robust, secure, and modern web application.

## 1. Project Overview
Transition the "Smart Library" from a standalone `CustomTkinter` desktop app to a **Full-Stack Web Application** with a React frontend and a FastAPI backend.

---

## 2. Technical Stack Specification

| Layer | Technology | Specification |
| :--- | :--- | :--- |
| **Frontend** | React 18+ (TypeScript) | Functional components, Hooks, React Router 6. |
| **State Management** | React Query (TanStack) | Server state management and caching. |
| **Backend** | FastAPI (Python 3.10+) | Asynchronous API endpoints, Pydantic for validation. |
| **Database** | PostgreSQL | Relational storage for multi-user concurrency. |
| **ORM** | SQLAlchemy 2.0 | Asynchronous ORM mapping. |
| **Auth** | OAuth2 + JWT | Hashing with `passlib[bcrypt]`. |
| **PDF Engine** | ReportLab | Continued use for Thai (Sarabun) support. |
| **Styling** | CSS Modules | Encapsulated, scoped styling using CSS Variables. |

---

## 3. Database Schema (PostgreSQL)

### Table: `users` (Library Staff)
- `id`: UUID (Primary Key)
- `username`: String (Unique, Indexed)
- `password_hash`: String
- `role`: Enum (Admin, Staff)
- `created_at`: Timestamp

### Table: `members`
- `member_id`: String (Primary Key, unique identifier from QR)
- `full_name`: String
- `encrypted_national_id`: Text (AES-256-CBC)
- `hmac_integrity`: Text (HMAC SHA256)
- `member_type`: String (Student, Teacher)
- `joined_date`: Date
- `qr_code_path`: String

### Table: `books`
- `book_id`: String (Primary Key / ISBN / Custom ID)
- `title`: String (Indexed)
- `author`: String
- `category`: String
- `quantity`: Integer
- `available_quantity`: Integer
- `added_at`: Timestamp

### Table: `loans`
- `id`: BigInt (Primary Key)
- `book_id`: ForeignKey(books.book_id)
- `member_id`: ForeignKey(members.member_id)
- `loan_date`: Date
- `due_date`: Date
- `return_date`: Date (Nullable)
- `status`: Enum (Borrowed, Returned, Overdue)

### Table: `logs`
- `id`: BigInt (Primary Key)
- `user_id`: ForeignKey(users.id)
- `action`: String (e.g., "MEMBER_CREATED", "BOOK_LOANED")
- `details`: JSONB
- `timestamp`: Timestamp

---

## 4. API Endpoints (FastAPI)

### Authentication
- `POST /api/v1/auth/login`: Returns JWT access token.
- `GET /api/v1/auth/me`: Returns current user info.

### Members
- `GET /api/v1/members`: List members (with search/pagination).
- `POST /api/v1/members`: Create member + Generate QR.
- `GET /api/v1/members/{id}`: Detailed view (Decrypts sensitive data on backend).
- `PATCH /api/v1/members/{id}`: Update info.

### Books
- `GET /api/v1/books`: Inventory search.
- `POST /api/v1/books`: Add new inventory.
- `GET /api/v1/books/stats`: Dashboard counts (Total, Available, Overdue).

### Transactions
- `POST /api/v1/loans/borrow`: Process borrowing (Checks member eligibility).
- `POST /api/v1/loans/return`: Process return via QR scanning.
- `GET /api/v1/loans/overdue`: Returns late items with the 3-level alert status (Yellow, Orange, Red).

### Reports
- `GET /api/v1/reports/summary.pdf`: Generates PDF report with Sarabun font.
- `GET /api/v1/reports/logs`: Export history.

---

## 5. Frontend Component Architecture

### Layouts
- `MainLayout`: Sidebar navigation, Header with user profile.
- `AuthLayout`: Centered login card.

### Shared Components (`/components`)
- `Button`: Custom rounded button with "CustomTkinter" accent colors.
- `Table`: Responsive data table with sorting and status badges.
- `QRScanner`: Browser camera interface using `html5-qrcode`.
- `StatusCard`: Dashbord metric cards with sparklines.

### Pages (`/pages`)
- `Dashboard`: Real-time stats, recent activities.
- `MemberManagement`: List, Create Modal, Profile view with QR download.
- `Inventory`: Book catalog with stock management.
- `LoanTerminal`: Unified interface for Borrow/Return actions.

---

## 6. Security & Data Integrity

1.  **Backend Encryption:** Port the `crypto_utils.py` logic. All `member_id` and national IDs are encrypted with AES-256-CBC before DB insertion.
2.  **Integrity Checks:** Re-implement the HMAC SHA256 logic to detect unauthorized DB tampering.
3.  **CORS Policy:** Strict configuration to only allow requests from the specific frontend domain.
4.  **Token Expiry:** 15-minute access tokens with 7-day refresh tokens.

---

## 7. Visual & UX Specifications

- **Theme:** "Modern Library Dark"
- **Primary Color:** `#1f6aa5` (CustomTkinter Blue)
- **Secondary Color:** `#d62d20` (Alert Red)
- **Surface Color:** `#2b2b2b` (Deep Gray)
- **Typography:** Inter (English) + Sarabun (Thai).
- **Transitions:** `0.3s ease-in-out` for all hover and modal states.

---

## 8. Migration Logistics

1.  **Environment Setup:** Docker Compose (FastAPI, PostgreSQL, PgAdmin).
2.  **Logic Porting:**
    - `crypto_utils.py` -> `backend/app/core/security/`
    - `qr_utils.py` -> `backend/app/utils/qr/`
    - `ReportLab` logic -> `backend/app/reports/`
3. **Data Ingestion:** Write a Python script to iterate through `library.db` (SQLite), decrypt the old format if necessary, and bulk-load into PostgreSQL.

---

## 9. Recommended JavaScript Libraries

To achieve a professional, interactive, and high-performance web application, the following libraries are integrated into the frontend architecture:

| Library | Purpose | Specific Use Case |
| :--- | :--- | :--- |
| **`react-router-dom`** | Client-side Routing | Managing navigation between Dashboard, Inventory, and Member pages without page reloads. |
| **`@tanstack/react-query`** | Server State Management | Handling asynchronous data fetching, caching, and automatic re-fetching of book/member lists. |
| **`zustand`** | Global State Management | Lightweight store for managing User Auth state and UI theme (Dark/Light mode) preferences. |
| **`react-hook-form`** | Form Management | Handling complex forms for adding books and members with high performance and minimal re-renders. |
| **`zod`** | Schema Validation | Defining strict TypeScript-first validation schemas for all form inputs (e.g., validating National IDs or ISBNs). |
| **`framer-motion`** | Animations | Replicating the smooth transitions of CustomTkinter; used for modal entries, page fades, and list reordering. |
| **`lucide-react`** | Iconography | Providing clean, consistent, and lightweight SVG icons for the sidebar and action buttons. |
| **`html5-qrcode`** | QR Code Scanning | Accessing the browser's camera API to scan member IDs and book codes for borrowing/returning. |
| **`date-fns`** | Date Utility | Calculating overdue days, formatting Thai/International date strings, and handling due-date logic. |
| **`recharts`** | Data Visualization | Rendering interactive charts on the dashboard (e.g., "Most Borrowed Books" or "Monthly Activity"). |
| **`sonner`** | Toast Notifications | Modern, non-intrusive pop-up alerts for successful loans, errors, or system warnings. |
| **`axios`** | HTTP Client | Handling API requests to the FastAPI backend with interceptors for JWT token attachment. |
| **`clsx` & `tailwind-merge`** | Class Utilities | Efficiently managing conditional CSS classes for dynamic styling (e.g., status-based color coding). |

