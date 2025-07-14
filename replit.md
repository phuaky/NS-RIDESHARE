# NS RideShare - replit.md

## Overview

NS RideShare is a community ride-sharing platform that connects passengers with drivers for transportation between Singapore and Forest City. The application facilitates ride creation, joining, and management with features like route planning, passenger management, and vendor services.

## User Preferences

```
Preferred communication style: Simple, everyday language.
```

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: TailwindCSS with Shadcn UI components
- **State Management**: React Query for server state, React Hook Form for form handling
- **Routing**: Wouter for client-side routing
- **Maps**: Leaflet integration for location selection and visualization
- **Build Tool**: Vite for development and bundling

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript throughout
- **Authentication**: Passport.js with local strategy using session-based auth
- **Database**: PostgreSQL via NeonDB with Drizzle ORM
- **Session Storage**: PostgreSQL-based session store using connect-pg-simple

## Key Components

### Authentication System
- Session-based authentication using Passport.js
- Password hashing with Node.js crypto (scrypt)
- User roles include regular users and vendors
- Protected routes for authenticated users only

### Ride Management
- Create rides with pickup/dropoff locations, passenger limits, and pricing
- Join rides with passenger count and dropoff location selection
- Edit and delete rides (creator only)
- Status tracking (open, assigned, completed)
- Passenger sequencing for efficient route planning

### Vendor Dashboard
- Vendor users can manage driver contacts
- Assign rides to drivers
- View assigned rides separately from available rides

### Location Services
- Interactive maps using Leaflet
- Support for multiple dropoff locations
- Location-based ride filtering and display

## Data Flow

1. **User Registration/Login**: Users authenticate via Discord username and password
2. **Ride Creation**: Authenticated users create rides with location, timing, and capacity details
3. **Ride Discovery**: Users browse available rides with filtering options
4. **Ride Joining**: Users join rides by specifying dropoff location and passenger count
5. **Ride Management**: Creators can edit rides, manage passengers, and set dropoff sequences
6. **Vendor Assignment**: Vendors can assign drivers to rides and manage transportation

## External Dependencies

### Database
- **NeonDB**: PostgreSQL database hosting
- **Drizzle ORM**: Type-safe database queries and migrations
- Connection pooling with error handling and retry logic

### Maps & Location
- **Leaflet**: Interactive maps for location selection
- Custom location markers and popup interactions

### UI Components
- **Radix UI**: Accessible component primitives
- **Shadcn UI**: Pre-built component library
- **Lucide React**: Icon library

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across frontend and backend
- **TailwindCSS**: Utility-first CSS framework

## Deployment Strategy

### Build Process
- Frontend: Vite builds React app to `dist/public`
- Backend: ESBuild bundles server code to `dist/`
- Shared schema types used across frontend and backend

### Production Configuration
- Environment variables for database connection
- Session secret configuration
- Trust proxy settings for deployment
- Error handling with graceful degradation

### Database Management
- Drizzle migrations for schema changes
- Connection pooling for performance
- Automatic retry logic for connection issues

### Session Management
- PostgreSQL-based session storage
- Configurable session timeout
- Secure session handling in production

## Notes

- The application uses a shared TypeScript schema for type safety between frontend and backend
- Authentication is session-based rather than token-based
- The system supports both regular users and vendor accounts with different permissions
- Real-time features may be added in future iterations
- Mobile-responsive design implemented throughout