# RetailSahayak - India-Focused Retail Management Platform

## Overview

RetailSahayak is a Progressive Web Application (PWA) designed specifically for Indian small retail businesses. It provides comprehensive inventory management, customer tracking, order processing, and financial reporting with full UPI payment integration. The platform is built with a mobile-first approach, supports offline functionality, and includes cultural adaptations for the Indian retail landscape including multilingual support (English/Hindi), GST compliance, and integration with popular Indian payment methods.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management and caching
- **UI Components**: Shadcn/UI component library built on Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with CSS custom properties for theming and responsive design
- **Build Tool**: Vite for fast development and optimized production builds
- **PWA Support**: Configured as a Progressive Web App with offline capabilities

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework using TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful API endpoints with standardized error handling
- **Session Management**: Express sessions with PostgreSQL session store
- **File Structure**: Monorepo structure with shared schema between client and server

### Data Storage Solutions
- **Primary Database**: PostgreSQL hosted on Neon Database
- **Connection Pooling**: Neon serverless connection pooling with WebSocket support
- **Schema Management**: Drizzle Kit for database migrations and schema management
- **Offline Storage**: IndexedDB for client-side offline data persistence
- **Caching Strategy**: React Query for API response caching with infinite stale time

### Authentication and Authorization
- **User Management**: Custom user authentication system with password-based login
- **Session Storage**: PostgreSQL-backed session storage using connect-pg-simple
- **Authorization**: User-scoped data access with userId-based filtering
- **Multi-tenancy**: User isolation at the database level for data security

### Mobile-First Design
- **Responsive Layout**: Custom mobile layout with bottom navigation
- **Touch Optimization**: Mobile-optimized UI components and interactions
- **Offline Support**: Service worker implementation for offline functionality
- **Performance**: Optimized for low-end Android devices (₹5,000-15,000 range)

### India-Specific Features
- **Payment Integration**: UPI QR code generation with support for major Indian UPI apps
- **Multilingual Support**: English/Hindi language toggle with Devanagari font support
- **GST Compliance**: Automated GST calculation and invoice generation
- **Currency Formatting**: Indian Rupee formatting with proper number localization
- **Cultural Adaptations**: Festival inventory suggestions and regional business practices

### Data Models
- **Users**: Shop owners with business details and preferences
- **Products**: Inventory items with Hindi names, GST rates, and flexible units
- **Categories**: Product categorization with bilingual support
- **Customers**: Customer management with credit limits and contact details
- **Orders**: Sales transactions with UPI payment tracking
- **Transactions**: Financial record keeping with payment method details

### API Architecture
- **REST Endpoints**: Standardized CRUD operations for all entities
- **Error Handling**: Consistent error response format with proper HTTP status codes
- **Validation**: Zod schema validation for request/response data
- **Logging**: Request/response logging with performance metrics
- **Rate Limiting**: Built-in protection against API abuse

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Connection Library**: @neondatabase/serverless for WebSocket connections

### UI and Styling
- **Radix UI**: Comprehensive set of accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Lucide React**: Modern icon library with consistent design
- **Google Fonts**: Roboto and Noto Sans Devanagari for multilingual support

### Development Tools
- **TypeScript**: Static type checking for JavaScript
- **Vite**: Fast build tool with hot module replacement
- **ESBuild**: Fast bundler for production server builds
- **Drizzle Kit**: Database schema management and migration tool

### Payment Integration
- **UPI Protocol**: Native UPI deep linking for payment requests
- **QR Code Service**: External QR code generation API for UPI payments

### PWA Features
- **Service Worker**: Custom service worker for offline functionality
- **Web App Manifest**: PWA configuration for app-like experience
- **IndexedDB**: Browser storage for offline data persistence

### Form Handling
- **React Hook Form**: Performant form library with minimal re-renders
- **Hookform Resolvers**: Zod integration for form validation
- **Zod**: Runtime type validation and schema definition

### State Management
- **TanStack React Query**: Server state synchronization and caching
- **React Context**: Local state management for UI preferences