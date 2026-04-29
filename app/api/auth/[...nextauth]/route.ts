import { handlers } from '@/auth';

// This file exposes the GET and POST handlers that NextAuth needs to
// intercept all /api/auth/* requests (login, logout, callback, session…)
export const { GET, POST } = handlers;
