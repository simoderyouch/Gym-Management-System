import api from './api';

// Authentication API Service
export const authApi = {
    // Login
    login: (credentials) => api.post('/auth/login', credentials),

    // Logout
    logout: (token) => api.post('/auth/logout', { token }),

    // Reset password (old method - deprecated)
    resetPassword: (email) => api.post('/auth/reset-password', { email }),

    // New password reset flow
    requestPasswordReset: (email) => api.post('/auth/request-reset', { email }),
    verifyResetCode: (email, code) => api.post('/auth/verify-reset', { email, code }),

    // Ping endpoint for testing connection
    ping: () => api.get('/auth/ping'),
};

export default authApi;
