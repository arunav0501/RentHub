# RentHub - Online Rental Marketplace

RentHub is a modern, full-stack web application designed for a semester-long Software Engineering project. It provides a platform where users can easily rent high-quality equipment, electronics, and more from trusted people in their community, while also listing their own items to earn money.

## 🚀 Key Features

* **Unified User Experience:** Every registered user can seamlessly act as both a renter and an owner without rigid role constraints.
* **Owner Dashboard:** A centralized control panel to list new items for rent and manage incoming rental requests (Approve, Reject, Complete).
* **Dynamic Booking Engine:** Users can select rental dates on a product page, instantly seeing the total calculated price before submitting a rental request.
* **Global Dark Mode:** A premium, fully responsive UI built with Tailwind CSS that includes a system-aware Dark Theme toggle.
* **Secure Authentication:** Robust JWT-based authentication with encrypted passwords to keep user data safe.
* **Image Uploads:** Local image upload processing for product listings.

---

## 🛠️ Technology Stack

The application is built using a modern, production-grade JavaScript stack, heavily emphasizing modularity, clean architecture, and type safety through schema validation.

### Frontend
* **Framework:** React 19 (Initialized via Vite for lightning-fast HMR)
* **Styling:** Tailwind CSS v4 (Class-based strategy for seamless Dark Mode)
* **Routing:** React Router DOM (v6)
* **State Management:** React Context API (AuthContext, ThemeContext)
* **Form Handling & Validation:** React Hook Form integrated with Zod validation schemas
* **HTTP Client:** Axios (Configured with interceptors for auth tokens)
* **UI Components:** Lucide React (Icons), React Hot Toast (Notifications)

### Backend
* **Runtime:** Node.js
* **Framework:** Express.js (RESTful API Design)
* **Database:** MariaDB (MySQL Provider)
* **ORM:** Prisma (Type-safe database querying and schema migrations)
* **Security & Auth:** bcryptjs (Password Hashing), jsonwebtoken (JWT Auth), Helmet (HTTP Headers), CORS
* **Validation:** Zod (Server-side request payload validation)
* **File Processing:** Multer (Handling multipart/form-data for image uploads)

---

## 🏗️ Architecture & Implementation Details

### Database Schema (Prisma)
The database is fully relational, consisting of four primary entities:
1. **User**: Stores authentication details and profile information.
2. **Category**: Groups products (e.g., Electronics, Vehicles, Tools).
3. **Product**: Represents a listed item, linked to its `User` (Owner) and `Category`.
4. **Booking**: Manages the rental lifecycle, tracking the `startDate`, `endDate`, `totalPrice`, and `status` (PENDING, APPROVED, REJECTED, COMPLETED). It acts as a join table linking a `User` (Renter) and a `Product`.

### Backend Implementation
- **Controllers & Routes:** Organized logically (e.g., `product.controller.js`, `auth.controller.js`). 
- **Middlewares:** 
  - `auth.middleware.js`: Verifies JWT tokens and attaches the user payload to requests.
  - `upload.middleware.js`: Configures Multer to save uploaded product images locally to the `uploads/` directory.
  - `error.middleware.js`: A centralized error handler to catch async errors and return standardized JSON responses.

### Frontend Implementation
- **ThemeContext:** Dynamically reads system preferences and `localStorage` to toggle the `.dark` class on the root HTML element, enabling Tailwind's dark mode variants across the entire app.
- **AuthContext:** Wraps the application to provide global access to the authenticated user's state, automatically attaching the JWT token to Axios requests.
- **Protected Routes:** Ensure that unauthenticated users cannot access sensitive pages like the Dashboard or attempt to book items.

---

## 💻 Running the Project Locally

You will need two terminal windows to run both the frontend and backend development servers.

### 1. Start the Backend Server
```bash
cd server
npm run dev
```
*The Express server will start on `http://localhost:5000`. Ensure your MariaDB instance is running.*

### 2. Start the Frontend Server
```bash
cd client
npm run dev
```
*The React application will start on `http://localhost:5173`. Open this URL in your browser to interact with RentHub!*
