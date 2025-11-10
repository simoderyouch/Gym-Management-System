import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { chatApi, clientApi, coachApi } from '../services/api';
import { toast } from 'react-toastify';

// Query keys
export const chatKeys = {
    all: ['chat'],
    conversations: (userType, userId) => [...chatKeys.all, 'conversations', userType, userId],
    conversation: (clientId, coachId) => [...chatKeys.all, 'conversation', clientId, coachId],
    unreadCount: (userType, userId) => [...chatKeys.all, 'unreadCount', userType, userId],
};

// Hook for client conversations
export const useClientConversations = () => {
    return useQuery({
        queryKey: chatKeys.conversations('client'),
        queryFn: async () => {
            const response = await chatApi.getClientConversations();
            const conversationsData = response.data;

            // Group messages by coach to create conversations
            const conversationMap = new Map();

            conversationsData.forEach(msg => {
                const coachId = msg.coachId;
                const coachName = msg.coachName;

                if (!conversationMap.has(coachId)) {
                    conversationMap.set(coachId, {
                        coachId: coachId,
                        coachName: coachName,
                        coachProfilePictureUrl: msg.coachProfilePictureUrl,
                        lastMessage: msg.content,
                        lastMessageTime: msg.createdAt,
                        unreadCount: 0,
                        isOnline: false
                    });
                }

                const conversation = conversationMap.get(coachId);
                if (msg.createdAt > conversation.lastMessageTime) {
                    conversation.lastMessage = msg.content;
                    conversation.lastMessageTime = msg.createdAt;
                }

                if (!msg.readFlag && !msg.fromClient) {
                    conversation.unreadCount++;
                }
            });

            const conversationsList = Array.from(conversationMap.values())
                .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

            // Fetch coach profile pictures for each conversation
            const conversationsWithProfiles = await Promise.all(
                conversationsList.map(async (conversation) => {
                    try {
                        const coachResponse = await coachApi.getCoachById(conversation.coachId);
                        return {
                            ...conversation,
                            coachProfilePictureUrl: coachResponse.data.profilePictureUrl
                        };
                    } catch (error) {
                        console.error(`Error fetching coach ${conversation.coachId} profile:`, error);
                        return conversation;
                    }
                })
            );

            return conversationsWithProfiles;
        },
        staleTime: 30000, // 30 seconds
        refetchInterval: 60000, // Refetch every minute as fallback
    });
};

// Hook for coach conversations
export const useCoachConversations = () => {
    return useQuery({
        queryKey: chatKeys.conversations('coach'),
        queryFn: async () => {
            const response = await chatApi.getCoachConversations();
            const conversationsData = response.data;

            // Group messages by client to create conversations
            const conversationMap = new Map();

            conversationsData.forEach(msg => {
                const clientId = msg.clientId;
                const clientName = msg.clientName;

                if (!conversationMap.has(clientId)) {
                    conversationMap.set(clientId, {
                        clientId: clientId,
                        clientName: clientName,
                        coachId: msg.coachId,
                        clientProfilePictureUrl: null,
                        lastMessage: msg.content,
                        lastMessageTime: msg.createdAt,
                        unreadCount: 0,
                        isOnline: false
                    });
                }

                const conversation = conversationMap.get(clientId);
                if (msg.createdAt > conversation.lastMessageTime) {
                    conversation.lastMessage = msg.content;
                    conversation.lastMessageTime = msg.createdAt;
                }

                if (!msg.readFlag && msg.fromClient) {
                    conversation.unreadCount++;
                }
            });

            const conversationsList = Array.from(conversationMap.values())
                .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

            // Fetch client profile pictures for each conversation
            const conversationsWithProfiles = await Promise.all(
                conversationsList.map(async (conversation) => {
                    try {
                        const clientResponse = await clientApi.getClientById(conversation.clientId);
                        return {
                            ...conversation,
                            clientProfilePictureUrl: clientResponse.data.profilePictureUrl
                        };
                    } catch (error) {
                        console.error(`Error fetching client ${conversation.clientId} profile:`, error);
                        return conversation;
                    }
                })
            );

            return conversationsWithProfiles;
        },
        staleTime: 30000, // 30 seconds
        refetchInterval: 60000, // Refetch every minute as fallback
    });
};

// Hook for conversation messages
export const useConversationMessages = (clientId, coachId) => {
    return useQuery({
        queryKey: chatKeys.conversation(clientId, coachId),
        queryFn: async () => {
            if (!clientId || !coachId) return [];
            const response = await chatApi.getConversation(clientId, coachId);
            return response.data;
        },
        enabled: !!(clientId && coachId),
        staleTime: 10000, // 10 seconds - messages should be fairly fresh
    });
};

// Hook for sending client messages
export const useSendClientMessage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ coachId, content }) => {
            const response = await chatApi.sendMessage({ coachId, content });
            return response.data;
        },
        onSuccess: (data) => {
            // Optimistically update conversations
            queryClient.setQueryData(chatKeys.conversations('client'), (oldData) => {
                if (!oldData) return oldData;

                return oldData.map(conv =>
                    conv.coachId === data.coachId
                        ? {
                            ...conv,
                            lastMessage: data.content,
                            lastMessageTime: data.createdAt
                        }
                        : conv
                ).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
            });

            // Optimistically update conversation messages
            queryClient.setQueryData(
                chatKeys.conversation(data.clientId, data.coachId),
                (oldData) => oldData ? [...oldData, data] : [data]
            );

            // Invalidate to ensure sync with server
            queryClient.invalidateQueries({
                queryKey: chatKeys.conversations('client')
            });
        },
        onError: (error) => {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        }
    });
};

// Hook for sending coach messages
export const useSendCoachMessage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ clientId, content }) => {
            const response = await chatApi.sendCoachMessage({ clientId, content });
            return response.data;
        },
        onSuccess: (data) => {
            // Optimistically update conversations
            queryClient.setQueryData(chatKeys.conversations('coach'), (oldData) => {
                if (!oldData) return oldData;

                return oldData.map(conv =>
                    conv.clientId === data.clientId
                        ? {
                            ...conv,
                            lastMessage: data.content,
                            lastMessageTime: data.createdAt
                        }
                        : conv
                ).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
            });

            // Optimistically update conversation messages
            queryClient.setQueryData(
                chatKeys.conversation(data.clientId, data.coachId),
                (oldData) => oldData ? [...oldData, data] : [data]
            );

            // Invalidate to ensure sync with server
            queryClient.invalidateQueries({
                queryKey: chatKeys.conversations('coach')
            });
        },
        onError: (error) => {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        }
    });
};

// Hook for WebSocket real-time updates
export const useChatWebSocket = (userType) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const invalidateOnNewMessage = (newMessage) => {
        console.log('📨 WebSocket message received, invalidating queries:', newMessage);

        // Add message to conversation cache immediately
        queryClient.setQueryData(
            chatKeys.conversation(newMessage.clientId, newMessage.coachId),
            (oldData) => {
                if (!oldData) return [newMessage];
                // Avoid duplicates
                const exists = oldData.some(msg => msg.id === newMessage.id);
                return exists ? oldData : [...oldData, newMessage];
            }
        );

        // Update conversations list
        const conversationsKey = chatKeys.conversations(userType);
        queryClient.setQueryData(conversationsKey, (oldData) => {
            if (!oldData) return oldData;

            return oldData.map(conv => {
                const isTargetConversation = userType === 'client'
                    ? conv.coachId === newMessage.coachId
                    : conv.clientId === newMessage.clientId;

                if (isTargetConversation) {
                    const shouldIncreaseUnread = userType === 'client'
                        ? !newMessage.fromClient && !newMessage.readFlag
                        : newMessage.fromClient && !newMessage.readFlag;

                    return {
                        ...conv,
                        lastMessage: newMessage.content,
                        lastMessageTime: newMessage.createdAt,
                        unreadCount: conv.unreadCount + (shouldIncreaseUnread ? 1 : 0)
                    };
                }
                return conv;
            }).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
        });

        // Background refetch to ensure sync
        queryClient.invalidateQueries({
            queryKey: chatKeys.conversations(userType),
            refetchType: 'none' // Don't refetch immediately, just mark as stale
        });
    };

    return { user, invalidateOnNewMessage };
};

// Mark message as read mutation
export const useMarkAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (messageId) => {
            await chatApi.markAsRead(messageId);
            return messageId;
        },
        onSuccess: () => {
            // Invalidate conversations to update unread counts
            queryClient.invalidateQueries({
                queryKey: chatKeys.all,
                refetchType: 'none'
            });
        }
    });
};
