# Neon Migration Notes

This project is not using PostgreSQL directly. It currently depends on Supabase for:

- Authentication via `supabase.auth`
- Database queries via the Supabase client
- Stored RPC calls such as `get_user_role`
- Edge functions for doctor creation/deletion
- Row-level security policies based on `auth.uid()`

Because of that, moving to Neon means:

1. Move the database schema/data to Neon PostgreSQL
2. Replace Supabase Auth with your own auth system or a third-party auth provider
3. Replace direct frontend-to-Supabase database access with your own backend API
4. Replace Supabase edge functions with server endpoints

## What is included here

- `neon/schema.sql`: a Neon-compatible PostgreSQL schema for the hospital data model

## What still needs to be built

- Backend API for login, logout, session validation, and CRUD operations
- Password hashing and user/session management
- Role-based authorization in the backend
- Frontend data layer changes from Supabase SDK to your API

## Suggested migration plan

1. Create a Neon project and get the connection string
2. Run `neon/schema.sql` against Neon
3. Build a backend with Express, NestJS, Next.js API routes, or Supabase alternative tooling
4. Add auth tables and session handling in the backend
5. Replace `src/integrations/supabase/client.ts` usage across the app
6. Replace `AuthContext` to call your backend
7. Replace `create-doctor` and `delete-doctor` edge functions with backend routes

## Important

Right now, the app will still run against Supabase until the frontend and backend are refactored.
