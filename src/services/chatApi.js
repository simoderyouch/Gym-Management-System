import api from './api';

// Chat API Service
export const chatApi = {
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

export default chatApi;
