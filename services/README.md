# Services Layer

This directory contains the reusable backend service foundation for Jafferi Clinic.

## Architecture

The services layer follows clean architecture principles with separation of concerns:

- **core/** - Core business logic and utilities
- **shared/** - Shared helper functions and utilities
- **types/** - TypeScript type definitions
- **auth/** - Authentication services (existing)

## Core Services (`services/core/`)

### client.ts
Singleton Supabase client wrapper. Reuse this across all service modules to avoid creating multiple connections.

### errors.ts
Centralized application error classes:
- `ValidationError` - Invalid input data
- `AuthenticationError` - Failed auth operations
- `AuthorizationError` - Insufficient permissions
- `DatabaseError` - Database operation failures
- `NotFoundError` - Missing resources
- `ConflictError` - Duplicate/conflicting resources
- `InternalServerError` - Unexpected errors
- `TenantError` - Multi-tenant operation failures
- `RateLimitError` - API rate limiting
- `UploadError` - File upload failures

### response.ts
Standard API response structure with success/error/pagination support.

### pagination.ts
Reusable pagination utilities:
- Calculate pagination values
- Create pagination metadata
- Apply pagination to Supabase queries

### sorting.ts
Reusable sorting utilities:
- Parse sort parameters
- Apply sorting to Supabase queries
- Default sort configurations

### filters.ts
Reusable filtering helpers:
- Date range filters
- Search filters
- Status filters
- Boolean filters
- Numeric range filters
- Apply all filters to queries

### validation.ts
Shared validation helpers integrated with Zod:
- Validate data against schemas
- Common validation schemas (UUID, email, phone, etc.)
- Create validation errors

### permissions.ts
Role-based permission utilities:
- User roles: owner, administrator, doctor, receptionist, accountant, staff
- Resource types: patients, appointments, doctors, clinics, billing, reports, settings, users
- Permission checking functions
- Write/delete permission validation

### auth.ts
Authentication utilities:
- Get current authenticated user
- Get current session
- Get user's role and clinic ID
- Check authentication status
- Refresh session

### tenant.ts
Multi-tenant helper utilities:
- Get current clinic
- Validate clinic access
- Apply clinic isolation to queries
- Get clinic timezone
- Validate clinic active status

## Shared Services (`services/shared/`)

### constants.ts
Application constants:
- Pagination defaults
- Time constants
- File size limits
- Allowed file types
- Appointment/patient statuses
- User roles
- Timezones
- Date formats
- API endpoints

### helpers.ts
Common reusable helpers:
- String helpers (capitalize, truncate, slugify, etc.)
- Number helpers (format, currency, percentage)
- Object helpers (clone, pick, omit)
- Array helpers (unique, groupBy, chunk, shuffle)

### logger.ts
Application logging utilities:
- Log levels (debug, info, warn, error)
- Development/production mode handling
- Singleton logger instance

### cache.ts
Generic caching abstraction:
- In-memory cache implementation
- Get/set/delete operations
- TTL support
- Get or set pattern
- Designed for future Redis extension

### date.ts
Date formatting utilities:
- Format dates (ISO, display, time)
- Format with timezone support
- Date calculations (start/end of day/week/month)
- Add/subtract days/hours
- Date comparisons
- Relative time strings

### search.ts
Generic search helpers:
- Combined pagination, filtering, and sorting
- Search result with metadata
- Build search vectors
- Normalize search queries
- Highlight search terms

### upload.ts
Utilities for Supabase Storage:
- File validation (size, type)
- Image/document validation
- Generate unique file names
- File type checking
- File size formatting

### transaction.ts
Reusable transaction wrapper:
- Execute transaction operations
- RPC transaction support
- Batch operations
- Sequential operations

## Types (`services/types/`)

### api.ts
API request/response types:
- Generic API response
- API error structure
- Response metadata
- API request with pagination
- Bulk operation request/response

### auth.ts
Authentication types:
- User role
- User metadata
- Auth session
- Login/register/reset password data

### common.ts
Common utility types:
- UUID, Timestamp
- Date range
- Timestamped, WithId, WithClinicId, WithUserId
- SoftDeletable, WithActiveStatus
- Status enum
- BaseEntity
- Select/Omit fields types

### database.ts
Database types for Supabase:
- DbRow, DbResult, DbResultWithCount
- DbInsertResult, DbUpdateResult, DbDeleteResult
- Table names type
- Database table type

### pagination.ts
Pagination types:
- PaginationParams
- PaginationMetadata
- PaginationValues

### response.ts
Response types:
- StandardResponse
- ResponseError
- ResponseMetadata
- SuccessResponse
- ErrorResponse
- PaginatedResponse

## Usage Examples

### Using Core Services

```typescript
import { getSupabaseClient, ValidationError, successResponse } from '@/services/core';

const supabase = getSupabaseClient();
// Use supabase client for database operations
```

### Using Pagination

```typescript
import { calculatePagination, applyPagination } from '@/services/core';

const pagination = calculatePagination({ page: 1, pageSize: 20 });
const query = applyPagination(supabase.from('patients').select('*'), pagination);
```

### Using Filters

```typescript
import { applyFilters } from '@/services/core';

const query = applyFilters(supabase.from('appointments').select('*'), {
  dateRanges: [{ field: 'date', from: '2024-01-01', to: '2024-12-31' }],
  statuses: [{ field: 'status', values: ['confirmed', 'completed'] }],
});
```

### Using Shared Helpers

```typescript
import { capitalize, formatCurrency, formatDate } from '@/services/shared';

const name = capitalize('john doe');
const price = formatCurrency(100);
const date = formatDate(new Date(), 'DISPLAY');
```

### Using Logger

```typescript
import { logger } from '@/services/shared';

logger.info('User logged in', { userId: '123' });
logger.error('Database error', { error: err });
```

### Using Cache

```typescript
import { cache, cacheHelpers } from '@/services/shared';

cache.set('user:123', userData, cacheHelpers.ttl.MEDIUM);
const cached = cache.get('user:123');
```

## Notes

- All services use TypeScript strict mode
- No `any` types are used
- Follows SOLID principles
- Reusable and scalable
- Well documented with JSDoc comments
- Consistent naming conventions
- Uses named exports
- Uses async/await
- Uses modern ES modules

## Existing Services

The `services/auth/` directory contains existing authentication services:
- forgot-password.ts
- login.ts
- logout.ts
- refresh-session.ts
- register.ts
- reset-password.ts
- verify-email.ts

These were not modified as part of this foundation layer.

## Next Steps

This foundation layer provides the reusable utilities needed for building domain-specific services like:
- Patients Service
- Doctors Service
- Appointments Service
- Billing Service
- Reports Service

Each domain service will import and use these core utilities to avoid code duplication and maintain consistency.
