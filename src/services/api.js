import axios from 'axios';
import Cookies from 'js-cookie';
import { API_BASE } from '../config/paths';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const tokenFromCookie = Cookies.get('token');
        const token = tokenFromCookie || localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            Cookies.remove('token');
            Cookies.remove('userRole');
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Don't redirect for public endpoints (reviews, coaches, etc.)
            const publicEndpoints = ['/reviews/coach/', '/coaches/public', '/coaches/', '/equipments', '/products'];
            const isPublicEndpoint = publicEndpoints.some(endpoint =>
                error.config?.url?.includes(endpoint)
            );

            if (!isPublicEndpoint) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Auth endpoints
const authApi = {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data),
    logout: () => api.post('/auth/logout'),
    getCurrentUser: () => api.get('/auth/me'),
    updateUser: (data) => api.put('/auth/me', data),
    changePassword: (data) => api.put('/auth/change-password', data),
};

// Coach/Trainer endpoints
const coachApi = {
    getAllCoaches: () => api.get('/coaches'),
    getCoachById: (id) => api.get(`/coaches/${id}`),
    getMyProfile: () => api.get('/coaches/me'),
    searchCoaches: (params) => api.get('/coaches/search', { params }),
    getAvailableCoaches: () => api.get('/coaches/public'),
    searchAvailableCoaches: (params) => api.get('/coaches/public/search', { params }),
    getTopRatedCoaches: (limit = 4) => api.get('/coaches/public/top-rated', { params: { limit } }),
    getCoachReviews: (coachId) => api.get(`/reviews/coach/${coachId}`),
    createReview: (data) => api.post('/reviews', data),
    updateReview: (reviewId, data) => api.put(`/reviews/${reviewId}`, data),
    deleteReview: (reviewId) => api.delete(`/reviews/${reviewId}`),
    getMyReviewForCoach: (coachId) => api.get(`/reviews/coach/${coachId}/my-review`),

    // Coach client management endpoints
    getMyClients: () => api.get('/coaches/my/clients'),
    removeClient: (clientId) => api.delete(`/coaches/my/clients/${clientId}`),
    getActiveClientCount: () => api.get('/coaches/my/clients/active-count'),
    getUpcomingSessions: () => api.get('/coaches/my/upcoming-sessions'),
    getEngagementOverview: (months = 10) => api.get('/coaches/my/engagement-overview', { params: { months } }),
    getCompletedSessionsOverview: (months = 10) => api.get('/coaches/my/completed-sessions-overview', { params: { months } }),

    // Coach profile management endpoints
    getMyProfile: () => api.get('/coaches/me'),
    updateProfile: (id, data) => api.put(`/coaches/${id}`, data),
    updateProfileWithImage: (id, data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (key === 'profileImage' && data[key]) {
                formData.append('profileImage', data[key]);
            } else if (data[key] !== undefined && data[key] !== null) {
                formData.append(key, data[key]);
            }
        });
        return api.put(`/coaches/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    changePassword: (id, data) => api.put(`/coaches/${id}/password`, data),
};





// Equipment endpoints
const equipmentApi = {
    getAllEquipment: (params = {}) => api.get('/equipments', { params }),
    getEquipmentById: (id) => api.get(`/equipments/${id}`),
    filterEquipment: (filters) => api.get('/equipments', { params: filters }),
    createEquipment: (data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (key === 'image' && data[key]) {
                formData.append('image', data[key]);
            } else if (data[key] !== undefined && data[key] !== null) {
                formData.append(key, data[key]);
            }
        });
        return api.post('/equipments', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    updateEquipment: (id, data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (key === 'image' && data[key]) {
                formData.append('image', data[key]);
            } else if (data[key] !== undefined && data[key] !== null) {
                formData.append(key, data[key]);
            }
        });
        return api.put(`/equipments/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    deleteEquipment: (id) => api.delete(`/equipments/${id}`),
};

// Product endpoints
const productApi = {
    getAllProducts: (params = {}) => api.get('/products', { params }),
    getProductById: (id) => api.get(`/products/${id}`),
    searchProducts: (filters) => api.get('/products/search', { params: filters }),
    createProduct: (data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (key === 'images' && data[key]) {
                // Handle multiple images
                if (Array.isArray(data[key])) {
                    data[key].forEach((image, index) => {
                        formData.append('images', image);
                    });
                } else {
                    formData.append('images', data[key]);
                }
            } else if (data[key] !== undefined && data[key] !== null) {
                formData.append(key, data[key]);
            }
        });
        return api.post('/products', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    updateProduct: (id, data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (key === 'images' && data[key]) {
                // Handle multiple images
                if (Array.isArray(data[key])) {
                    data[key].forEach((image, index) => {
                        formData.append('images', image);
                    });
                } else {
                    formData.append('images', data[key]);
                }
            } else if (data[key] !== undefined && data[key] !== null) {
                formData.append(key, data[key]);
            }
        });
        return api.put(`/products/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    deleteProduct: (id) => api.delete(`/products/${id}`),
};

// Order endpoints
const orderApi = {
    // Public endpoint - create order
    createOrder: (orderData) => api.post('/orders', orderData),

    // Admin endpoints
    getAllOrders: () => api.get('/orders'),
    getOrderById: (id) => api.get(`/orders/${id}`),
    getOrdersByStatus: (status) => api.get(`/orders/status/${status}`),
    searchOrders: (query) => api.get('/orders/search', { params: { q: query } }),
    confirmOrder: (id) => api.put(`/orders/${id}/confirm`),
    cancelOrder: (id) => api.put(`/orders/${id}/cancel`),
    completeOrder: (id) => api.put(`/orders/${id}/complete`),
    getOrderStats: () => api.get('/orders/stats'),
    getOrdersByDateRange: (startDate, endDate) => api.get('/orders/date-range', {
        params: { startDate, endDate }
    })
};

// Client endpoints
const clientApi = {
    getMyProfile: () => api.get('/clients/me'),
    getClientById: (id) => api.get(`/clients/${id}`),
    updateProfile: (id, data) => api.put(`/clients/${id}`, data),
    updateProfileWithImage: (id, data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (key === 'profileImage' && data[key]) {
                formData.append('profileImage', data[key]);
            } else if (data[key] !== undefined && data[key] !== null) {
                formData.append(key, data[key]);
            }
        });
        return api.put(`/clients/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    changePassword: (id, data) => api.put(`/clients/${id}/password`, data),
    getMembershipRemainingDays: () => api.get('/clients/me/membership-remaining-days'),
    getMyMembership: () => api.get('/clients/me/membership'),
};

// Chat endpoints
const chatApi = {
    // Send message from client to coach
    sendMessage: (data) => api.post('/chat/client/send', data),

    // Send message from coach to client
    sendCoachMessage: (data) => api.post('/chat/coach/send', data),

    // Get conversation between client and coach
    getConversation: (clientId, coachId) => api.get('/chat/conversations', { params: { clientId, coachId } }),

    // Get all conversations for client
    getClientConversations: () => api.get('/chat/client/conversations'),

    // Get all conversations for coach
    getCoachConversations: () => api.get('/chat/coach/conversations'),

    // Get unread message count for client
    getUnreadCount: () => api.get('/chat/unread-count/client'),

    // Get unread message count for coach
    getCoachUnreadCount: () => api.get('/chat/unread-count/coach'),

    // Mark message as read
    markAsRead: (messageId) => api.put(`/chat/messages/${messageId}/read`),

    // Search conversations by coach name (for clients)
    searchConversations: (query) => api.get('/chat/search/client', { params: { q: query } }),

    // Search conversations by client name (for coaches)
    searchCoachConversations: (query) => api.get('/chat/search/coach', { params: { q: query } }),
};

// Booking endpoints
const bookingApi = {
    // Client endpoints
    requestBooking: (data) => api.post('/booking-requests', data),
    getMyBookings: () => api.get('/bookings/client/all'),
    cancelBooking: (bookingId) => api.put(`/bookings/${bookingId}/cancel`),

    // Booking request endpoints (for updating/deleting pending bookings)
    createBookingRequest: (data) => api.post('/booking-requests', data),
    updateBookingRequest: (bookingId, data) => api.put(`/booking-requests/${bookingId}`, data),
    deleteBookingRequest: (bookingId) => api.delete(`/booking-requests/${bookingId}`),
    getMyBookingRequests: () => api.get('/booking-requests/my-requests'),

    // Coach endpoints
    getPendingBookings: () => api.get('/booking-requests/coach/pending'),
    getAllCoachBookings: () => api.get('/bookings/coach/all'),
    acceptBooking: (bookingId, notes = null) => api.put(`/booking-requests/${bookingId}/accept`, notes ? { notes } : {}),
    rejectBooking: (bookingId, reason) => api.put(`/booking-requests/${bookingId}/reject`, { reason }),
    completeBooking: (bookingId) => api.put(`/bookings/${bookingId}/complete`),
};

// Notification endpoints
const notificationApi = {
    // Get all notifications for current user
    getMyNotifications: () => api.get('/notifications/me'),

    // Mark notification as read
    markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),

    // Mark all notifications as read
    markAllAsRead: () => api.put('/notifications/mark-all-read'),

    // Get unread count
    getUnreadCount: () => api.get('/notifications/unread-count'),
};

// Announcement endpoints
const announcementApi = {
    // Get all announcements
    getAllAnnouncements: () => api.get('/announcements'),

    // Get latest announcements (public)
    getLatestAnnouncements: () => api.get('/announcements/latest'),

    // Get announcement by ID
    getAnnouncementById: (id) => api.get(`/announcements/${id}`),
};

export { authApi, coachApi, clientApi, bookingApi, chatApi, equipmentApi, productApi, orderApi, notificationApi, announcementApi };
export default api;
