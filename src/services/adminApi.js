import api from './api';

// Admin API Service
export const adminApi = {
    // Dashboard Metrics
    getSummary: () => api.get('/admins/metrics/summary'),
    getMonthlyOverview: (year) => api.get('/admins/metrics/monthly-overview', { params: { year } }),
    getCoachMetrics: () => api.get('/admins/metrics/coaches'),

    // Client Management
    searchClients: (params) => api.get('/admins/clients/search', { params }),
    getClientMembership: (clientId) => api.get(`/admins/clients/${clientId}/membership`),
    getClientMembershipHistory: (clientId) => api.get(`/admins/clients/${clientId}/membership-history`),
    renewMembership: (clientId, data) => api.post(`/admins/clients/${clientId}/renew-membership`, data),
    // Admin-scoped (kept for compatibility)
    createClient: (clientData) => api.post('/admins/clients', clientData),
    updateClient: (clientId, clientData) => api.put(`/admins/clients/${clientId}`, clientData),
    // Direct client endpoints (multipart form-data)
    createClientMultipart: (formData) =>
        api.post('/clients', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    updateClientMultipart: (clientId, formData) =>
        api.put(`/clients/${clientId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    deleteClient: (clientId) => api.delete(`/admins/clients/${clientId}`),

    // Bulk import clients from CSV
    importClients: (formData) =>
        api.post('/admins/clients/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

    // Coach Management
    // Admin-scoped search (name required on backend) – kept for completeness
    searchCoaches: (params) => api.get('/admins/coaches/search', { params }),
    // Public coach listing/search (no auth required; richer DTOs)
    getAllCoachesPublic: () => api.get('/coaches'),
    searchCoachesPublic: (params) => api.get('/coaches/public/search', { params }),
    createCoach: (coachData) => api.post('/admins/coaches', coachData),
    updateCoach: (coachId, coachData) => api.put(`/admins/coaches/${coachId}`, coachData),
    // Direct coach endpoints (multipart form-data) - use admin endpoints
    createCoachMultipart: (formData) =>
        api.post('/admins/coaches', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    updateCoachMultipart: (coachId, formData) =>
        api.put(`/admins/coaches/${coachId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    deleteCoach: (coachId) => api.delete(`/admins/coaches/${coachId}`),

    // Booking Management
    getBookings: (params) => api.get('/admins/bookings', { params }),
    getBookingsSummary: () => api.get('/admins/bookings/summary'),
    getUpcomingBookings: () => api.get('/admins/bookings/upcoming'),

    // Attendance Management
    createAttendance: (clientId) => api.post(`/admins/clients/${clientId}/attendance`),
    getClientAttendance: (clientId) => api.get(`/admins/clients/${clientId}/attendance`),

    // Equipment Management
    getEquipment: (params) => api.get('/equipments', { params }),
    getEquipmentById: (id) => api.get(`/equipments/${id}`),
    createEquipment: (formData) => api.post('/equipments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        transformRequest: v => v,
    }),
    updateEquipment: (id, formData) => api.put(`/equipments/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        transformRequest: v => v,
    }),
    deleteEquipment: (id) => api.delete(`/equipments/${id}`),

    // Gym Management
    getGyms: () => api.get('/gyms'),
    getGymById: (id) => api.get(`/gyms/${id}`),
    createGym: (gymData) => api.post('/gyms', gymData),
    updateGym: (id, gymData) => api.put(`/gyms/${id}`, gymData),
    deleteGym: (id) => api.delete(`/gyms/${id}`),

    // Product Management
    getProducts: (params) => api.get('/products', { params }),
    getProductById: (id) => api.get(`/products/${id}`),
    createProduct: (productData) => api.post('/products', productData), // JSON
    updateProduct: (id, productData) => api.put(`/products/${id}`, productData), // JSON or multipart (backend accepts)
    // Multipart create/update: must send @RequestPart('product') + images[]
    createProductMultipart: (formData) => api.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        transformRequest: v => v,
    }),
    updateProductMultipart: (id, formData) => api.put(`/products/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        transformRequest: v => v,
    }),
    deleteProduct: (id) => api.delete(`/products/${id}`),
    searchProducts: (params) => api.get('/products/search', { params }),

    // Announcement Management
    getAnnouncements: () => api.get('/announcements'),
    getAnnouncementById: (id) => api.get(`/announcements/${id}`),
    createAnnouncement: (announcementData) => api.post('/announcements', announcementData),
    updateAnnouncement: (id, announcementData) => api.put(`/announcements/${id}`, announcementData),
    deleteAnnouncement: (id) => api.delete(`/announcements/${id}`),

    // JWT Management
    rotateJwtSecret: () => api.post('/admins/jwt/rotate-secret'),
    getJwtSecretStatus: () => api.get('/admins/jwt/secret-status'),

    // Admin Settings
    changePassword: (data) => api.put('/admins/change-password', data),

    // Expiring Memberships
    getExpiringMemberships: () => api.get('/admins/expiring-memberships'),

    // General Search
    searchAllUsers: (name) => api.get('/admins/search', { params: { name } }),
};

export default adminApi;
