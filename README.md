# University Assignment Submission and Grading System

A modern, production-ready web application for managing assignment submissions, grading, and feedback in university environments.

## 🚀 Features

### Authentication & Authorization
- Secure user authentication with Supabase Auth
- Role-based access control (Student, Instructor, Admin)
- JWT-based session management

### Student Features
- View enrolled courses and assignments
- Upload assignment files with validation
- Track submission status and deadlines
- Request deadline extensions
- View grades and instructor feedback
- Real-time notifications

### Instructor Features
- Create and manage courses
- Design assignments with rubrics
- Review and grade submissions
- Provide detailed feedback
- Bulk grading capabilities
- Dashboard with analytics

### Admin Features
- User management (create/update/delete)
- System-wide analytics and reports
- Course and assignment oversight
- Export functionality (CSV/Excel)

### System Features
- File upload with type and size validation
- Deadline enforcement with late submission handling
- Email notifications
- Activity logging
- Responsive mobile-friendly UI
- Real-time updates

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (Node.js)
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Deployment**: Vercel
- **Validation**: Zod
- **Forms**: React Hook Form
- **UI Components**: Lucide React Icons
- **Notifications**: React Hot Toast

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account
- Vercel account (for deployment)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd university-assignment-system
npm install
```

### 2. Environment Setup

Copy `.env.local.example` to `.env.local` and configure:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 3. Database Setup

1. Create a new Supabase project
2. Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor
3. Enable Row Level Security (RLS) policies
4. Create storage bucket named 'submissions'

### 4. Development

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📁 Project Structure

```
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── assignments/       # Assignment management
│   └── admin/             # Admin panel
├── components/            # Reusable UI components
├── lib/                   # Utility functions and configurations
│   ├── auth.ts           # Authentication helpers
│   ├── supabase.ts       # Supabase client
│   ├── validations.ts    # Zod schemas
│   └── database.types.ts # TypeScript types
├── supabase/             # Database schema and migrations
└── public/               # Static assets
```

## 🔐 Security Features

- Row Level Security (RLS) policies
- Input validation with Zod
- File type and size validation
- CSRF protection
- Secure file upload handling
- Role-based route protection

## 📊 Database Schema

### Core Tables
- `profiles` - User profiles with roles
- `courses` - Course information
- `enrollments` - Student-course relationships
- `assignments` - Assignment details
- `submissions` - Student submissions
- `extension_requests` - Deadline extension requests
- `notifications` - System notifications

### Key Relationships
- Students enroll in courses
- Instructors create assignments for their courses
- Students submit assignments
- Instructors grade submissions

## 🚀 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
npm run build
npm start
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login

### Courses
- `GET /api/courses` - List courses (filtered by role)
- `POST /api/courses` - Create course (instructor/admin)

### Assignments
- `GET /api/assignments` - List assignments
- `POST /api/assignments` - Create assignment
- `GET /api/assignments/[id]` - Get assignment details

### Submissions
- `GET /api/submissions` - List submissions
- `POST /api/submissions` - Submit assignment
- `PUT /api/submissions/[id]` - Grade submission

## 🔧 Configuration

### File Upload Settings
- Supported formats: PDF, DOC, DOCX, ZIP
- Maximum file size: 10MB (configurable)
- Storage: Supabase Storage with RLS

### Email Notifications
Configure SMTP settings in environment variables for:
- Assignment reminders
- Grade notifications
- Extension request updates

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build test
npm run build
```

## 📈 Performance Optimizations

- Server-side rendering with Next.js 14
- Database indexing for common queries
- Image optimization
- Code splitting and lazy loading
- Efficient data fetching patterns

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review existing issues
- Create a new issue with detailed information

## 🔄 Roadmap

- [ ] Real-time collaboration features
- [ ] Advanced analytics dashboard
- [ ] Mobile app development
- [ ] Integration with LMS systems
- [ ] Automated plagiarism detection
- [ ] Video submission support
- [ ] Peer review functionality