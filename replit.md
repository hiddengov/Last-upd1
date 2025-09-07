# IP Logger Dashboard

## Overview

This is a full-stack web application designed for security testing and IP tracking. The system serves a decoy image endpoint that logs visitor information including IP addresses, user agents, referrers, and estimated locations. It features a modern React dashboard for monitoring and analyzing logged data with real-time updates and export capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on Radix UI primitives with Tailwind CSS styling
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with custom design tokens and dark theme support

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints for metrics, logs, and data export
- **Request Logging**: Custom middleware for API request/response logging with performance metrics
- **Development**: Vite integration for hot module replacement and development server

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (configured for Neon serverless)
- **Schema**: Two main entities - users and ip_logs with proper indexing and relationships
- **Migrations**: Drizzle Kit for database schema management and migrations
- **Fallback Storage**: In-memory storage implementation for development/testing

### Authentication & Authorization
- **Session Management**: Connect-pg-simple for PostgreSQL-backed session storage
- **User Management**: Basic user schema with username/password authentication
- **Security**: CORS configuration and request validation

### Core Features
- **IP Logging**: Automatic visitor tracking through decoy image endpoint serving 1x1 transparent pixel
- **Geolocation**: Basic IP-to-location mapping (mock implementation ready for real service integration)
- **Real-time Dashboard**: Live metrics with auto-refresh capabilities
- **Data Export**: CSV export functionality for logged data
- **Responsive Design**: Mobile-first approach with adaptive layouts

## External Dependencies

### Database & Storage
- **Neon Database**: Serverless PostgreSQL hosting via @neondatabase/serverless
- **Connect-pg-simple**: PostgreSQL session store for Express sessions

### UI & Design System
- **Radix UI**: Comprehensive set of unstyled, accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Type-safe CSS class composition utility

### Development & Build Tools
- **Vite**: Frontend build tool with HMR and optimized bundling
- **ESBuild**: JavaScript bundler for server-side code compilation
- **PostCSS**: CSS processing with Tailwind and Autoprefixer plugins
- **TypeScript**: Static type checking across the entire codebase

### Data Management
- **TanStack Query**: Server state synchronization and caching
- **React Hook Form**: Form state management with validation
- **Hookform Resolvers**: Form validation integration
- **Date-fns**: Date manipulation and formatting utilities

### Development Environment
- **Replit Integration**: Custom Vite plugins for Replit development environment
- **Runtime Error Overlay**: Enhanced error reporting during development
- **Cartographer**: Replit-specific development tooling integration