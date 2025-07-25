# Replit.md

## Overview

This is a full-stack personal portfolio website built for Kuan-I (Brian) Lu, a data science professional. The application showcases data science projects in an interactive, visually appealing format with a dark aesthetic featuring concrete textures and royal blue accents. The system includes both a public portfolio view and an admin dashboard for content management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Animations**: Framer Motion for smooth transitions and interactions

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store
- **File Upload**: Multer for handling project images and documents

### Data Storage
- **Primary Database**: PostgreSQL hosted on Neon
- **ORM**: Drizzle with type-safe queries and migrations
- **File Storage**: Local filesystem for uploads with public serving
- **Session Storage**: PostgreSQL-based session store for authentication

## Key Components

### Database Schema
- **Users**: Stores user authentication data (required for Replit Auth)
- **Sessions**: Manages user sessions for authentication
- **Projects**: Portfolio items with title, description, images, and metadata
- **Project Files**: Associated files for each project (PDFs, additional images)
- **Site Settings**: Configurable site-wide settings (contact info, bio, etc.)

### Frontend Components
- **Portfolio Page**: Public-facing project gallery with expandable cards
- **Admin Dashboard**: Protected content management interface
- **Project Cards**: Interactive project displays with hover effects and expandable descriptions
- **Header**: Site branding with admin access controls
- **Contact Section**: Contact information display
- **Water Effect**: WebGL-based realistic water ripple effects that respond to box tilting

### API Endpoints
- **Authentication**: `/api/auth/user`, `/api/login`, `/api/logout`
- **Projects**: CRUD operations for portfolio projects with file upload support
- **Site Settings**: Configuration management
- **File Upload**: Image and document handling for project images and reports
- **Analytics**: Page view and project click tracking with time-based analysis

## Data Flow

1. **Public Access**: Users visit the portfolio page and view projects without authentication
2. **Admin Access**: Authenticated users can access the admin dashboard via Replit Auth
3. **Content Management**: Admins can create, edit, and delete projects through the dashboard
4. **File Handling**: Project images stored in `/public/projects/`, reports in `/public/reports/`
5. **Report Upload**: PDF/HTML files automatically hosted under domain with generated URLs
6. **Analytics Tracking**: Page views and clicks tracked and displayed in admin dashboard
7. **Real-time Updates**: TanStack Query provides optimistic updates and cache invalidation

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **framer-motion**: Animation library
- **multer**: File upload handling

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety and development experience
- **Tailwind CSS**: Utility-first styling
- **ESBuild**: Fast bundling for production

### Authentication
- **Replit Auth**: OpenID Connect authentication system
- **Passport.js**: Authentication middleware
- **express-session**: Session management

## Deployment Strategy

### Development
- **Local Development**: `npm run dev` starts both frontend and backend
- **Hot Reload**: Vite provides instant feedback for frontend changes
- **Database**: Connected to Neon PostgreSQL instance
- **Environment**: Development-specific configurations and error overlays

### Production
- **Build Process**: `npm run build` creates optimized static assets and server bundle
- **Server**: Node.js server serves both API and static files
- **Database**: Production PostgreSQL database with connection pooling
- **Static Assets**: Vite-optimized frontend bundle served from Express

### Configuration
- **Environment Variables**: `DATABASE_URL`, `SESSION_SECRET`, `REPL_ID`
- **Path Aliases**: TypeScript path mapping for clean imports
- **Asset Handling**: Vite handles static assets with optimization

The application is designed to be a professional portfolio showcase with robust content management capabilities, emphasizing visual appeal and user experience while maintaining strong security and performance characteristics.

## Recent Changes (July 25, 2025)

### Vercel Deployment Setup
- ✅ Fixed TypeScript type errors in database storage
- ✅ Created Vercel configuration files (`vercel.json`, `api/index.ts`)
- ✅ Added simplified authentication for Vercel deployment
- ✅ Created deployment guide (`README-VERCEL.md`)
- ✅ Added build script for Vercel compatibility
- ✅ Fixed application startup issues and database connectivity

### Deployment Options
The application now supports two deployment methods:
1. **Replit Deploy**: Native deployment using the existing `.replit` configuration
2. **Vercel Deploy**: Serverless deployment with custom configuration for external hosting

### Files Added for Vercel
- `vercel.json` - Vercel deployment configuration
- `api/index.ts` - Serverless function entry point  
- `server/vercelAuth.ts` - Simplified authentication system
- `server/routes-vercel.ts` - Vercel-compatible routes
- `build.js` - Custom build script
- `deploy-to-vercel.sh` - Deployment helper script
- `README-VERCEL.md` - Comprehensive deployment guide

The application is ready for deployment on both Replit and Vercel platforms.