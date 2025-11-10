import api from './api';

// Coach/Trainer API Service
export const coachApi = {
    getAllCoaches: () => api.get('/coaches'),
    getCoachById: (id) => api.get(`/coaches/${id}`),
    getMyProfile: () => api.get('/coaches/me'),
    searchCoaches: (params) => api.get('/coaches/search', { params }),
    getAvailableCoaches: () => api.get('/coaches/public'),
    searchAvailableCoaches: (params) => api.get('/coaches/public/search', { params }),
    getCoachReviews: (coachId) => api.get(`/reviews/coach/${coachId}`),
    createReview: (data) => api.post('/reviews', data),
    updateReview: (reviewId, data) => api.put(`/reviews/${reviewId}`, data),
    deleteReview: (reviewId) => api.delete(`/reviews/${reviewId}`),
    getMyReviewForCoach: (coachId) => api.get(`/reviews/coach/${coachId}/my-review`),
};

export default coachApi;
