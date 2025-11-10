import api from './api';

// Signup API Service
export const signupApi = {
    // Create signup request
    createSignupRequest: (data) => api.post('/api/signup/request', data),

    // Admin endpoints
    getAllSignupRequests: () => api.get('/api/signup/requests'),
    getPendingSignupRequests: () => api.get('/api/signup/requests/pending'),
    getPendingRequestsCount: () => api.get('/api/signup/requests/count'),
    processSignupRequest: (data) => api.post('/api/signup/requests/process', data),
    getSignupRequestById: (id) => api.get(`/api/signup/requests/${id}`),
    deleteSignupRequest: (id) => api.delete(`/api/signup/requests/${id}`),
};

export default signupApi;
