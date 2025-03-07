# RideShare - Community Ride Sharing Platform

A full-stack application that connects people looking for rides with drivers offering transportation services. This platform streamlines the process of organizing shared transportation, making it easier to coordinate carpools and reduce transportation costs.

## 🚀 Features

- **User Authentication**: Secure login and registration system
- **Ride Creation**: Create and manage rides with detailed information
- **Ride Joining**: Easily find and join available rides
- **Route Planning**: Set pickup and multiple dropoff locations
- **Driver Management**: Vendors can manage driver profiles and availability
- **Real-time Status Updates**: Track ride status and receive updates
- **Interactive Maps**: Visualize routes and locations
- **Responsive Design**: Works on desktop and mobile devices

## 📋 Tech Stack

### Frontend
- React with TypeScript
- TailwindCSS for styling
- Shadcn UI components
- React Query for state management
- Wouter for routing
- React Hook Form for form handling
- Leaflet for map integration

### Backend
- Node.js with Express
- TypeScript
- Passport.js for authentication
- Drizzle ORM with NeonDB (PostgreSQL)
- WebSockets for real-time updates

## 📦 Project Structure

```
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utility functions
│   │   ├── pages/       # Application pages
│   │   └── ...
│
├── server/              # Backend Express application
│   ├── auth.ts          # Authentication logic
│   ├── db.ts            # Database configuration
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Data storage and retrieval
│   └── ...
│
├── shared/              # Shared code between client and server
│   ├── schema/          # Database and validation schemas
│   └── ...
│
└── ...
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database (or Neon.tech account)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/rideshare.git
   cd rideshare
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL=your_database_connection_string
   SESSION_SECRET=your_session_secret
   ```

4. Set up the database:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## 🔄 Development Workflow

- `npm run dev` - Start the development server
- `npm run build` - Build the production application
- `npm run start` - Start the production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes

## 📱 Deployment

The application is ready to be deployed to platforms like:
- Vercel
- Netlify
- Render
- Heroku
- Railway

## 🛣️ Roadmap
- [ ] User Settings Update
- [ ] Route optimization
- [ ] One-tap WhatsApp messaging
- [ ] Peer-to-peer payments
- [ ] Driver Vendor integration
- [ ] FAQ

## 💬 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request