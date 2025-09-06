# Therapy Case Management System

A comprehensive full-stack case management system for therapy workflows built with React + Vite frontend and Node.js + Express + MongoDB backend.

## 🏗️ Tech Stack

### Frontend
- **React 19** + **Vite 7** (JSX)
- **Clerk** for authentication and user management
- **React Router DOM** for routing
- **TanStack React Query** for server state management
- **Axios** for HTTP requests
- Modern CSS with responsive design

### Backend
- **Node.js** + **Express** 
- **MongoDB** with **Mongoose** ODM
- **JWT** authentication via Clerk integration
- **CORS** enabled for cross-origin requests
- **Morgan** for logging
- **Dotenv** for environment configuration

## 🌟 Features

### Core Modules

1. **Patient Allocation Module**
   - Automated assignment algorithm considering therapist availability, expertise, and caseload
   - Manual override dashboard for supervisors
   - Deterministic assignment results with audit trails

2. **Therapy Planning Module**
   - Digital templates with goals, activities, frequency, duration
   - Status tracking: draft → submitted → approved/needs_revision
   - File attachments support

3. **Supervisor Review Module**
   - Real-time notifications for plan submissions
   - Inline commenting and approval workflow
   - Revision request system with feedback

4. **Session Documentation Module**
   - Structured session logging with outcomes tracking
   - Progress visualization over time
   - Activity and observation recording

5. **Progress Report Module**
   - Automated reminders after 10 sessions
   - Comprehensive reporting templates
   - Supervisor review and feedback system

6. **Clinical Rating System**
   - Multi-criteria therapist evaluations
   - Performance trend analytics
   - Improvement area identification

7. **Case Management Dashboard**
   - Role-based overview of active cases
   - Advanced filtering and search capabilities
   - Real-time status updates

8. **Analytics & Reporting**
   - Caseload distribution analysis
   - Progress rate tracking
   - Performance dashboards
   - CSV/PDF export capabilities

9. **User Management & Access Control**
   - Role-based permissions (therapist, supervisor, admin)
   - User invitation and lifecycle management
   - Comprehensive audit logging

10. **Integration Capabilities**
    - Data import/export utilities
    - Hospital/clinic system integration hooks
    - Automated backup scripts

### User Roles & Permissions

- **Therapists**: View assigned cases, create/edit therapy plans, document sessions, submit progress reports
- **Supervisors**: Manage allocations, review/approve plans, evaluate therapists, view team analytics
- **Admins**: User management, global settings, system integrations, data exports

## 🚀 Quick Start

### Prerequisites

- **Node.js** v20.19+ or v22.12+
- **MongoDB** (local installation or MongoDB Atlas)
- **Clerk Account** for authentication

### 1. Clone the Repository

```bash
git clone https://github.com/devagarwal07/PAT_ELO.git
cd PAT_ELO
```

### 2. Backend Setup

```bash
cd server
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

#### Environment Variables (.env)

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/therapy_casemgmt

# Clerk Configuration (for token verification)
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# Session Configuration
SESSION_REMINDER_THRESHOLD=10

# File Upload Configuration
MAX_FILE_SIZE=10mb
UPLOAD_PATH=./uploads
```

#### Start Backend Server

```bash
# Development mode with auto-reload
npm run dev

# Or production mode
npm start

# Quick boot without MongoDB (for UI/health checks)
npm run dev:nodb

# Seed sample data (optional)
npm run seed
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Clerk configuration
nano .env.local
```

#### Environment Variables (.env.local)

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# API Configuration
VITE_API_BASE_URL=http://localhost:4000
```

#### Start Frontend Development Server

```bash
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/health

## 📚 API Documentation

### Authentication

All API endpoints (except health check) require authentication via Clerk JWT tokens passed in the `Authorization` header:

```http
Authorization: Bearer <clerk_jwt_token>
```

### Core Endpoints

#### Users
- `GET /api/users` - List users (admin only)
- `GET /api/users/me` - Get current user info
- `PATCH /api/users/:id/role` - Update user role (admin only)

#### Patients
- `GET /api/patients` - List patients with filtering
- `POST /api/patients` - Create new patient
- `GET /api/patients/:id` - Get patient details
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

#### Assignments
- `POST /api/assignments/auto-assign` - Auto-assign patient
- `POST /api/assignments/manual-assign` - Manual patient assignment
- `GET /api/assignments/patient/:id/history` - Assignment history
- `GET /api/assignments/stats` - Assignment statistics

#### Therapy Plans
- `GET /api/plans` - List therapy plans
- `POST /api/plans` - Create therapy plan
- `PUT /api/plans/:id` - Update therapy plan
- `POST /api/plans/:id/submit` - Submit plan for review
- `POST /api/plans/:id/review` - Review plan (approve/revise)

#### Sessions
- `GET /api/sessions` - List sessions
- `POST /api/sessions` - Log new session
- `GET /api/sessions/patient/:id` - Sessions for patient
- `GET /api/sessions/progress/:id` - Progress data

#### Progress Reports
- `GET /api/progress-reports` - List reports
- `POST /api/progress-reports` - Create report
- `POST /api/progress-reports/:id/review` - Review report

#### Clinical Ratings
- `GET /api/ratings` - List ratings
- `POST /api/ratings` - Create rating
- `GET /api/ratings/therapist/:id` - Ratings for therapist
- `GET /api/ratings/trends` - Rating trends

#### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

#### Analytics
- `GET /api/analytics/dashboard` - Dashboard data
- `GET /api/analytics/caseload-distribution` - Caseload analytics
- `GET /api/analytics/progress-rates` - Progress analytics
- `GET /api/analytics/therapist-performance` - Performance metrics
- `GET /api/analytics/export/:type` - Export data as CSV

## 🧪 Testing

### Run Tests

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd frontend
npm test
```

### Sample Test Scenarios

1. **Assignment Algorithm**: Deterministic results for same inputs
2. **Role Restrictions**: API and UI access control
3. **Workflow Integration**: Plan submission → notification → review
4. **Data Integrity**: Session reminders after 10 sessions
5. **Export Functionality**: CSV headers and data accuracy

## 🔧 Development

### Project Structure

```
PAT_ELO/
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page-level components
│   │   ├── styles/         # CSS stylesheets
│   │   ├── api.js          # API client utilities
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Application entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/                  # Node.js + Express API
│   ├── src/
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # Express route handlers
│   │   ├── services/       # Business logic layer
│   │   ├── middleware/     # Custom middleware
│   │   └── utils/          # Utility functions
│   ├── server.js           # Server entry point
│   ├── seed.js             # Database seeding script
│   └── package.json
└── README.md
```

### Code Style

- **ESLint** configuration for consistent code style
- **Prettier** for code formatting
- **Conventional Commits** for commit messages

### Database Schema

Key collections and their relationships:

- **Users**: Clerk integration with role-based access
- **Patients**: Demographics and case information
- **Assignments**: Patient-therapist allocation records
- **TherapyPlans**: Treatment plans with approval workflow
- **Sessions**: Individual therapy session documentation
- **ProgressReports**: Periodic progress evaluations
- **ClinicalRatings**: Therapist performance evaluations
- **Notifications**: System notifications and alerts
- **AuditLog**: Comprehensive action logging

## 🛠️ Advanced Configuration

### Automated Assignment Algorithm

The system uses a sophisticated scoring algorithm:

```javascript
score = (specialtyMatch * 0.4) + 
        (availabilityScore * 0.25) + 
        (caseloadScore * 0.25) + 
        (experienceScore * 0.1)
```

### Notification System

Automated notifications for:
- Plan submissions and approvals
- Progress report due dates
- Assignment changes
- System alerts

### Analytics Engine

Comprehensive reporting including:
- Caseload distribution
- Progress rate trends
- Plan approval timelines
- Therapist performance metrics

## 📊 Performance Optimization

- **Database Indexing**: Optimized queries for large datasets
- **Pagination**: Efficient data loading
- **Caching**: React Query for client-side caching
- **Lazy Loading**: Route-based code splitting

## 🔒 Security Features

- **Authentication**: Clerk JWT token validation
- **Authorization**: Role-based access control
- **Audit Logging**: Comprehensive action tracking
- **Data Validation**: Server and client-side validation
- **CORS Configuration**: Secure cross-origin requests

## 🚢 Deployment

### Production Environment

1. **Backend Deployment**:
   ```bash
   npm run build
   npm start
   ```

2. **Frontend Deployment**:
   ```bash
   npm run build
   # Deploy dist/ folder to your hosting provider
   ```

3. **Environment Variables**: Update production configurations
4. **Database**: Use MongoDB Atlas for production
5. **Monitoring**: Set up logging and error tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue on GitHub
- Check the documentation
- Review the sample data and test cases

## 📋 Changelog

### v1.0.0 (Current)
- Initial release with full feature set
- Complete CRUD operations for all entities
- Advanced analytics and reporting
- Automated assignment algorithm
- Comprehensive notification system
- Role-based access control
- Responsive UI design

---

**Built with ❤️ for therapy professionals to streamline case management workflows.**
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your MongoDB URI:
   ```
   PORT=4000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/therapy_casemgmt
   ```

4. Seed the database with sample data:
   ```bash
   npm run seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The backend will run on `http://localhost:4000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with your Clerk configuration:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_cGxlYXNhbnQtdmVydmV0LTgzLmNsZXJrLmFjY291bnRzLmRldiQ
   VITE_API_BASE_URL=http://localhost:4000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will run on `http://localhost:5173`

## Project Structure

```
therapy-casemgmt-app/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── App.jsx         # Main application component
│   │   ├── main.jsx        # Application entry point
│   │   └── api.js          # API client utilities
│   ├── .env.local          # Environment variables
│   └── package.json
├── server/                  # Node.js + Express backend
│   ├── src/
│   │   ├── models/         # Mongoose data models
│   │   ├── routes/         # Express route handlers
│   │   └── middleware/     # Custom middleware functions
│   ├── server.js           # Server entry point
│   ├── seed.js            # Database seeding script
│   ├── .env               # Environment variables
│   └── package.json
└── README.md
```

## API Endpoints

### Users
- `GET /api/users` - List users (with filtering)
- `GET /api/users/me` - Get current user info
- `POST /api/users` - Create new user
- `PATCH /api/users/:id` - Update user

### Patients
- `GET /api/patients` - List patients (with filtering/pagination)
- `POST /api/patients` - Create new patient
- `GET /api/patients/:id` - Get patient details
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Therapy Plans
- `GET /api/plans` - List therapy plans
- `POST /api/plans` - Create new plan
- `GET /api/plans/:id` - Get plan details
- `PUT /api/plans/:id` - Update plan
- `POST /api/plans/:id/submit` - Submit plan for review
- `POST /api/plans/:id/review` - Review plan (approve/revision)

### Sessions
- `GET /api/sessions` - List sessions
- `POST /api/sessions` - Log new session
- `GET /api/sessions/:id` - Get session details
- `PUT /api/sessions/:id` - Update session

### Progress Reports
- `GET /api/progress-reports` - List progress reports
- `POST /api/progress-reports` - Create progress report
- `POST /api/progress-reports/:id/review` - Review progress report

### Clinical Ratings
- `GET /api/ratings` - List clinical ratings
- `POST /api/ratings` - Create new rating
- `GET /api/ratings/:id` - Get rating details

### Assignments
- `GET /api/assignments` - List assignments
- `POST /api/assignments/auto-assign` - Auto-assign patient to therapist
- `POST /api/assignments/manual-assign` - Manually assign patient

## Sample Users (from seed data)

After running `npm run seed`, you'll have these sample users:

- **Therapist 1**: therapist1@example.com (Dr. Sarah Johnson)
- **Therapist 2**: therapist2@example.com (Dr. Michael Chen)
- **Supervisor**: supervisor1@example.com (Dr. Emily Rodriguez)
- **Admin**: admin@example.com (Admin User)

## Authentication

This application uses Clerk for authentication. The provided publishable key in the setup is for development purposes. For production, you'll need to:

1. Create a Clerk account at [clerk.com](https://clerk.com)
2. Set up your application
3. Replace the publishable key in `.env.local`
4. Configure proper JWT verification in the backend middleware

## Development Notes

- The backend currently uses placeholder authentication middleware
- CORS is configured to allow requests from `http://localhost:5173`
- MongoDB connection uses the provided Atlas URI
- All API endpoints require authentication (placeholder implementation)
- The auto-assignment algorithm considers therapist specialties and current caseload

## Available Scripts

### Backend
- `npm run dev` - Start development server with file watching
- `npm start` - Start production server
- `npm run seed` - Seed database with sample data

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.
