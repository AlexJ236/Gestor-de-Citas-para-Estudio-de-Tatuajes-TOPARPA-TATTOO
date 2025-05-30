# TOPARPA TATTOO - Studio Management System

This project is a full-stack web application designed to efficiently manage the operations of **TOPARPA TATTOO**, a tattoo studio located in Calama, Chile. It allows for the management of clients, appointments, expenses, and the generation of financial reports.

**Find TOPARPA TATTOO on Social Media:**
* **Instagram:** [https://www.instagram.com/toparpatattoocalama/](https://www.instagram.com/toparpatattoocalama/)
* **Facebook:** [https://www.facebook.com/people/Toparpa-Tattoo-Calama/100086714861172/](https://www.facebook.com/people/Toparpa-Tattoo-Calama/100086714861172/)

## ✨ Main Features

- **User Authentication:** Secure login system to protect application access. (New user registration functionality is planned but pending full frontend implementation).
- **Client Management (CRUD):**
    - Create, read, update, and delete client profiles.
    - Storage of contact information and relevant notes.
- **Appointment Management (CRUD):**
    - Schedule new appointments associated with clients.
    - View appointments on an interactive calendar (month and agenda views).
    - Edit existing appointment details (date, time, duration, artist, description, price, payment status).
    - Mark appointments as completed, canceled, or no-shows.
    - Control scheduling conflicts when booking or modifying appointments.
- **Expense Management (CRUD):**
    - Register new expenses with description, amount, category, and date.
    - List, edit, and delete existing expenses. (Associating expenses with a specific `user_id` is commented out in the backend code and could be implemented in the future).
- **Main Dashboard:**
    - Financial summary of the current month (income, expenses, profit).
    - Total client count and appointments for the current day.
    - List of appointments scheduled for today.
    - List of upcoming appointments with outstanding balances.
    - Shortcuts to common functions.
- **Report Generation:**
    - Generate detailed financial reports (daily and monthly).
    - Export reports as PNG images.
- **Responsive Interface:** Design adaptable to different screen sizes.
- **Notifications:** Use of toasts for user feedback on operations.

## 💻 Technologies Used

### Backend (`/backend`)

- **Node.js:** Server-side JavaScript runtime environment.
- **Express.js:** Web framework for Node.js, used to build the REST API.
- **PostgreSQL:** Relational database management system.
- **`pg` (node-postgres):** PostgreSQL client for Node.js.
- **`bcrypt`:** Library for password hashing.
- **`jsonwebtoken` (JWT):** For generating and verifying authentication tokens.
- **`cors`:** Middleware to enable Cross-Origin Resource Sharing.
- **`dotenv`:** For managing environment variables.
- **`date-fns`:** Library for advanced date and time manipulation.
- **`nodemon`:** Development tool that automatically restarts the server upon changes.

### Frontend (`/frontend`)

- **React:** Library for building user interfaces.
- **Vite:** Next-generation frontend tooling for fast development and builds.
- **React Router DOM:** For managing routes in the single-page application (SPA).
- **Axios:** Promise-based HTTP client for making API requests.
- **Tailwind CSS:** Utility-first CSS framework for rapid and custom design.
- **`date-fns`:** For date formatting and manipulation on the client-side.
- **`react-big-calendar`:** Calendar component for displaying and managing appointments.
- **`react-datepicker`:** Component for date and time selection.
- **`react-toastify`:** For displaying notifications (toasts) to the user.
- **`react-confirm-alert`:** For displaying confirmation dialogs.
- **`lucide-react`:** Collection of SVG icons.
- **`html2canvas`:** For capturing screenshots of HTML elements (used in reports).
- **`react-currency-input-field`:** Component for formatted currency inputs.
- **ESLint:** For static code analysis and maintaining code quality.

## 📁 Project Structure (Simplified)

/
├── backend/
│   ├── controllers/      # Business logic for each route
│   ├── middleware/       # Middlewares (e.g., authentication)
│   ├── routes/           # API route definitions
│   ├── config/           # Configuration (e.g., DB connection)
│   ├── server.js         # Backend entry point
│   └── package.json
│
└── frontend/
├── src/
│   ├── assets/           # Static resources (images, etc. - if applicable)
│   ├── components/       # Reusable React components
│   ├── contexts/         # React contexts (e.g., AuthContext)
│   ├── pages/            # Page components (main views)
│   ├── services/         # Logic for interacting with the API (api.js, authService.js, etc.)
│   ├── App.jsx           # Root application component
│   ├── main.jsx          # Frontend entry point
│   └── index.css         # Global styles and Tailwind
├── public/               # Public files (e.g., index.html, favicon)
└── package.json


## ⚙️ Prerequisites

- Node.js (LTS version recommended, v18.x or higher as per backend and frontend `package.json`)
- npm (usually comes with Node.js) or Yarn
- PostgreSQL (installed and a server running)

## 🚀 Installation and Setup

Follow these steps to get the project running in your local environment:

### 1. Clone the Repository

bash
git clone [https://github.com/AlexJ236/Gestor-de-Citas-para-Estudio-de-Tatuajes-TOPARPA-TATTOO.git](https://github.com/AlexJ236/Gestor-de-Citas-para-Estudio-de-Tatuajes-TOPARPA-TATTOO.git) TOPARPA_GESTION
cd TOPARPA_GESTION

(Note: The repository will be cloned into a folder named TOPARPA_GESTION in the command above, then you cd into it. Adjust if you prefer a different local folder name.)

2. Backend Configuration

Bash
cd backend
npm install

Create a .env file in the root of the /backend folder and configure the following environment variables:

Fragmento de código

DB_USER=your_postgres_user
DB_HOST=localhost
DB_DATABASE=toparpa_tattoo_db
DB_PASSWORD=your_postgres_password
DB_PORT=5432
JWT_SECRET=a_very_long_and_hard_to_guess_secret_for_jwt # CHANGE THIS!
PORT=5001
Database Configuration:
Ensure your PostgreSQL server is running.

Create a database with the name you specified in DB_DATABASE (e.g., toparpa_tattoo_db).

IMPORTANT: Execute the provided SQL script (or one you have created) to define the table structure in your database. This script should include:

users: id (SERIAL PRIMARY KEY), username (VARCHAR UNIQUE NOT NULL), password_hash (VARCHAR NOT NULL), created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP).
clients: id (SERIAL PRIMARY KEY), name (VARCHAR NOT NULL), phone (VARCHAR), email (VARCHAR UNIQUE), notes (TEXT), created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP), updated_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP).
appointments: id (SERIAL PRIMARY KEY), client_id (INTEGER REFERENCES clients(id) ON DELETE CASCADE), user_id (INTEGER REFERENCES users(id)), appointment_time (TIMESTAMP WITH TIME ZONE NOT NULL), duration_minutes (INTEGER DEFAULT 60), description (TEXT), artist (VARCHAR), total_price (NUMERIC(10,0)), amount_paid (NUMERIC(10,0) DEFAULT 0), payment_status (VARCHAR(20) DEFAULT 'pending'), status (VARCHAR(20) DEFAULT 'scheduled'), deposit_paid_at (TIMESTAMP WITH TIME ZONE), completed_at (TIMESTAMP WITH TIME ZONE), created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP). (Consider adding updated_at to appointments as well if you haven't already).
expenses: id (SERIAL PRIMARY KEY), description (VARCHAR NOT NULL), amount (NUMERIC(10,0) NOT NULL), category (VARCHAR), expense_date (DATE NOT NULL), user_id (INTEGER REFERENCES users(id) NULL), created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP), updated_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP). (The user_id column in expenses is optional and not currently actively used in the backend's creation logic).
Example of how to run an SQL script with psql (replace placeholders):

Bash
psql -U your_postgres_user -d toparpa_tattoo_db -f path/to/your/tables_script.sql

3. Frontend Configuration

Bash
cd ../frontend
npm install

The frontend is configured to connect to the backend at http://localhost:5001/api. If you need to change this, modify the frontend/src/services/api.js file.

ධ Available Scripts
From the /backend folder:

npm start: Starts the backend server in production mode.
npm run dev: Starts the backend server in development mode with nodemon (auto-restarts on changes).

From the /frontend folder:
npm run dev: Starts the frontend development server (usually at http://localhost:5173).
npm run build: Compiles the frontend application for production (in the /frontend/dist folder).
npm run lint: Runs ESLint to analyze the frontend code.
npm run preview: Serves the production build locally for preview.

🔑 Authentication
Authentication is handled using JSON Web Tokens (JWT).
Upon login, the backend generates a token that the frontend stores in sessionStorage.
All subsequent requests to protected API routes from the frontend include this token in the Authorization header as a Bearer token.
The backend verifies this token to authorize access.
The new user registration functionality (POST /api/auth/register) is implemented in the backend (authController.js), but the frontend call (authService.js) is marked as TODO, and there is currently no user interface for it.

📄 API Endpoints (Summary)
All endpoints are prefixed with /api. Routes managing client, appointment, and expense data require authentication.

Authentication (/auth):

POST /login: Log in.
POST /register: Register a new user.
Clients (/clients):

GET /: Get all clients.
POST /: Create a new client.
GET /:id: Get a client by ID.
PUT /:id: Update a client.
DELETE /:id: Delete a client.
Appointments (/appointments):

GET /: Get all appointments.
POST /: Create a new appointment.
GET /:id: Get an appointment by ID.
PUT /:id: Update an appointment.
DELETE /:id: Delete an appointment.
Expenses (/expenses):

GET /: Get all expenses (accepts startDate, endDate query params).
POST /: Create a new expense.
GET /:id: Get an expense by ID.
PUT /:id: Update an expense.
DELETE /:id: Delete an expense.
Reports (/reports):

GET /summary: Get financial summary (query params year, month).
GET /daily: Get data for daily report (query params year, month, day).
GET /monthly: Get data for monthly report (query params year, month).

📝 License
This project is distributed under the ISC License.
Made by AlexJ236!
