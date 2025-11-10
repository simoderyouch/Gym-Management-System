import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { chatApi, clientApi, coachApi } from '../../services/api';
import websocketService from '../../services/websocketService';
import { Loader2, Send, Search, User } from 'lucide-react';
import { profilePictureUrl } from '../../config/paths';

const ClientChat = () => {
    const { user } = useAuth();
    const [selectedChat, setSelectedChat] = useState(null);
    const [message, setMessage] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Data states
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searching, setSearching] = useState(false);
    const [clientId, setClientId] = useState(null);

    // WebSocket connection state
    const [wsConnected, setWsConnected] = useState(false);
    const messagesEndRef = useRef(null);

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // WebSocket message handler
    const handleWebSocketMessage = useCallback((newMessage) => {
        console.log('📨 Client received new WebSocket message:', newMessage);

        // Add new message to current conversation if it matches
        if (selectedChat && selectedChat.coachId === newMessage.coachId) {
            console.log('✅ Adding WebSocket message to current conversation');
            setMessages(prev => {
                // Avoid duplicates by checking if message already exists
                const exists = prev.some(msg => msg.id === newMessage.id);
                if (exists) {
                    console.log('⚠️ Message already exists, skipping duplicate');
                    return prev;
                }
                return [...prev, newMessage];
            });
        }

        // Update conversations list with new message
        setConversations(prev => {
            console.log('🔄 Updating client conversations with new WebSocket message');
            let needsSort = false;
            const updated = prev.map(conv => {
                if (conv.coachId === newMessage.coachId) {
                    // Only increase unread count if message is from coach and not currently viewing this conversation
                    const shouldIncreaseUnread = !newMessage.fromClient &&
                        !newMessage.readFlag &&
                        (!selectedChat || selectedChat.coachId !== newMessage.coachId);

                    // Check if this conversation needs to move to top
                    const wasNotMostRecent = prev[0]?.coachId !== conv.coachId;
                    if (wasNotMostRecent) needsSort = true;

                    return {
                        ...conv,
                        lastMessage: newMessage.content,
                        lastMessageTime: newMessage.createdAt,
                        unreadCount: conv.unreadCount + (shouldIncreaseUnread ? 1 : 0)
                    };
                }
                return conv;
            });

            // Only sort if necessary
            return needsSort
                ? updated.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime))
                : updated;
        });

        // Mark message as read if it's from coach and we're viewing the conversation
        if (!newMessage.fromClient && !newMessage.readFlag && selectedChat && selectedChat.coachId === newMessage.coachId) {
            setTimeout(() => {
                chatApi.markAsRead(newMessage.id).catch(error => {
                    console.error('❌ Error marking message as read:', error);
                });
            }, 100); // Small delay to ensure message is processed
        }
    }, [selectedChat]);

    // Initialize WebSocket connection
    useEffect(() => {
        console.log('🔌 Client WebSocket useEffect triggered, user:', user);
        if (user?.token && user?.email) {
            console.log('🚀 Connecting client to WebSocket with token...');

            const connectWithRetry = () => {
                websocketService.connect(
                    user.token,
                    () => {
                        console.log('✅ Client WebSocket connected successfully');
                        setWsConnected(true);

                        // Subscribe to chat messages with a small delay to ensure connection is stable
                        setTimeout(() => {
                            console.log('📡 Subscribing to chat messages for:', user.email);
                            websocketService.subscribeToChat(user.email, handleWebSocketMessage);
                        }, 500);
                    },
                    (error) => {
                        console.error('❌ WebSocket connection failed:', error);
                        setWsConnected(false);
                        toast.error('Chat connection failed. Messages may not be real-time.');
                    }
                );
            };

            // Initial connection
            connectWithRetry();

            // Set up periodic connection check
            const connectionCheck = setInterval(() => {
                if (!websocketService.isConnected()) {
                    console.log('🔄 WebSocket disconnected, attempting to reconnect...');
                    setWsConnected(false);
                    connectWithRetry();
                }
            }, 30000); // Check every 30 seconds

            return () => {
                clearInterval(connectionCheck);
            };
        }

        return () => {
            console.log('🔌 Disconnecting WebSocket...');
            websocketService.disconnect();
            setWsConnected(false);
        };
    }, [user?.token, user?.email, handleWebSocketMessage]);

    // Load conversations
    const loadConversations = async () => {
        try {
            setLoading(true);
            console.log('🔄 Loading client conversations...');

            // Get client ID if not available
            if (!clientId) {
                console.log('Client ID not available, fetching...');
                const clientResponse = await clientApi.getMyProfile();
                setClientId(clientResponse.data.id);
                console.log('Set client ID to:', clientResponse.data.id);
            }

            const response = await chatApi.getClientConversations();
            const conversationsData = response.data;
            console.log('Raw client conversations data:', conversationsData);

            // Group messages by coach to create conversations
            const conversationMap = new Map();

            conversationsData.forEach(msg => {
                const coachId = msg.coachId;
                const coachName = msg.coachName;

                // Debug the entire message object to see the structure
                console.log('Chat message object:', msg);

                if (!conversationMap.has(coachId)) {
                    conversationMap.set(coachId, {
                        coachId: coachId,
                        coachName: coachName,
                        coachProfilePictureUrl: null, // Will be fetched separately
                        lastMessage: msg.content,
                        lastMessageTime: msg.createdAt,
                        unreadCount: 0,
                        isOnline: false // We'll implement online status later
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

            console.log('Processed client conversations:', conversationsList);

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

            console.log('Final client conversations with profiles:', conversationsWithProfiles);
            setConversations(conversationsWithProfiles);
        } catch (error) {
            console.error('Error loading conversations:', error);
            toast.error('Failed to load conversations');
        } finally {
            setLoading(false);
        }
    };

    // Load messages for selected conversation
    const loadMessages = async (coachId) => {
        console.log('loadMessages called with clientId:', clientId, 'coachId:', coachId);
        if (!clientId || !coachId) {
            console.log('Missing clientId or coachId, returning early');
            return;
        }

        try {
            console.log('Loading messages for clientId:', clientId, 'coachId:', coachId);
            const response = await chatApi.getConversation(clientId, coachId);
            console.log('Raw client messages data:', response.data);
            setMessages(response.data);

            // Mark messages as read and update conversation unread count
            const unreadMessages = response.data.filter(msg => !msg.readFlag && !msg.fromClient);
            if (unreadMessages.length > 0) {
                unreadMessages.forEach(msg => {
                    chatApi.markAsRead(msg.id);
                });

                // Update conversation unread count
                setConversations(prev => prev.map(conv =>
                    conv.coachId === coachId
                        ? { ...conv, unreadCount: 0 }
                        : conv
                ));
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            toast.error('Failed to load messages');
        }
    };

    // Search conversations
    const searchConversations = async () => {
        if (!searchQuery.trim()) {
            loadConversations();
            return;
        }

        try {
            setSearching(true);
            const response = await chatApi.searchConversations(searchQuery);
            const conversationsData = response.data;

            // Process search results similar to loadConversations
            const conversationMap = new Map();

            conversationsData.forEach(msg => {
                const coachId = msg.coachId;
                const coachName = msg.coachName;

                if (!conversationMap.has(coachId)) {
                    conversationMap.set(coachId, {
                        coachId: coachId,
                        coachName: coachName,
                        coachProfilePictureUrl: null, // Will be fetched separately
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

            setConversations(conversationsWithProfiles);
        } catch (error) {
            console.error('Error searching conversations:', error);
            toast.error('Failed to search conversations');
        } finally {
            setSearching(false);
        }
    };

    // Handle conversation selection
    const handleSelectConversation = (conversation) => {
        console.log('Selecting conversation:', conversation);
        setSelectedChat(conversation);
        // Clear messages first
        setMessages([]);
        // Load messages for this conversation
        if (conversation && conversation.coachId && clientId) {
            console.log('Loading messages for clientId:', clientId, 'coachId:', conversation.coachId);
            loadMessages(conversation.coachId);
        } else if (!clientId) {
            console.log('⚠️ ClientId not available yet, will load messages once available');
        }
    };

    // Handle send message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        console.log('handleSendMessage called with message:', message, 'selectedChat:', selectedChat, 'clientId:', clientId);

        if (!message.trim() || !selectedChat || !clientId) {
            console.log('❌ Missing required data for sending message:', {
                message: message.trim(),
                selectedChat: !!selectedChat,
                clientId: !!clientId
            });
            if (!clientId) {
                toast.error('Client ID not available. Please refresh the page.');
            }
            return;
        }

        try {
            setSending(true);
            console.log('Sending client message to coach:', selectedChat.coachId);

            const response = await chatApi.sendMessage({
                coachId: selectedChat.coachId,
                content: message.trim()
            });

            console.log('Client send message response:', response.data);

            // Add message to local state immediately (fallback if WebSocket is slow/failing)
            const sentMessage = response.data;
            if (sentMessage) {
                setMessages(prev => {
                    // Check if message already exists (to avoid duplicates from WebSocket)
                    const exists = prev.some(msg => msg.id === sentMessage.id);
                    if (!exists) {
                        // Sort messages by creation time for proper order
                        const newMessages = [...prev, sentMessage];
                        return newMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                    }
                    return prev;
                });

                // Update conversation list immediately
                setConversations(prev => prev.map(conv => {
                    if (conv.coachId === selectedChat.coachId) {
                        return {
                            ...conv,
                            lastMessage: sentMessage.content,
                            lastMessageTime: sentMessage.createdAt
                        };
                    }
                    return conv;
                }));
            }

            // Clear the message input
            setMessage('');

            console.log('Client message sent successfully');
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    // Get client ID
    const getClientId = async () => {
        try {
            const response = await clientApi.getMyProfile();
            setClientId(response.data.id);
        } catch (error) {
            console.error('Error getting client ID:', error);
            toast.error('Failed to load client data');
        }
    };

    // Load initial data  
    useEffect(() => {
        const initializeData = async () => {
            try {
                console.log('Initializing client chat data...');
                await getClientId();
                await loadConversations();
            } catch (error) {
                console.error('Error initializing client chat:', error);
            }
        };

        if (user?.token) {
            initializeData();
        }
    }, [user]);

    // Load messages when clientId becomes available and there's a selected chat
    useEffect(() => {
        if (clientId && selectedChat && selectedChat.coachId) {
            console.log('🔄 ClientId now available, loading messages for selected chat');
            loadMessages(selectedChat.coachId);
        }
    }, [clientId, selectedChat?.coachId]);

    // Refresh conversations every 30 seconds to keep unread counts updated
    useEffect(() => {
        const interval = setInterval(() => {
            if (clientId) {
                loadConversations();
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [clientId]);

    // Handle search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            searchConversations();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Get image URL helper
    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return encodeURI(profilePictureUrl(url));
    };

    // Format timestamp
    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        }
    };

    // Filter conversations
    const filteredConversations = conversations.filter(conv => {
        if (selectedFilter === 'Unread') {
            return conv.unreadCount > 0;
        }
        return true;
    });

    // Calculate total unread count
    const totalUnreadCount = conversations.reduce((total, conv) => total + conv.unreadCount, 0);

    const selectedConversation = conversations.find(conv => conv.coachId === selectedChat?.coachId);

    return (
        <div className="h-screen flex">
            {/* Conversations List */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-bold text-gray-900">Messages</h1>
                        <div className="flex items-center space-x-2">
                            {wsConnected ? (
                                <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-xs text-green-600">Live</span>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <span className="text-xs text-red-600">Offline</span>
                                </div>
                            )}
                            {totalUnreadCount > 0 && (
                                <span className="bg-[#c53445] text-white text-xs px-2 py-1 rounded-full">
                                    {totalUnreadCount} unread
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search chats..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                        />
                        {searching && (
                            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
                        )}
                    </div>

                    {/* Filters */}
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setSelectedFilter('All')}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${selectedFilter === 'All'
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setSelectedFilter('Unread')}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${selectedFilter === 'Unread'
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            Unread
                        </button>
                    </div>
                </div>

                {/* Conversations */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    {filteredConversations.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                            {searching ? 'Searching...' : 'No conversations found'}
                        </div>
                    ) : (
                        filteredConversations.map((conversation) => (
                            <div
                                key={conversation.coachId}
                                onClick={() => handleSelectConversation(conversation)}
                                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedChat?.coachId === conversation.coachId ? 'bg-[#c53445] bg-opacity-10' : ''
                                    }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="relative">
                                        {conversation.coachProfilePictureUrl ? (
                                            <img
                                                src={getImageUrl(conversation.coachProfilePictureUrl)}
                                                alt={conversation.coachName}
                                                className="w-12 h-12 rounded-full object-cover"
                                                onError={(e) => {
                                                    console.log('Conversation list image failed to load:', e.target.src);
                                                    console.log('Conversation object:', conversation);
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div className={`w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center ${conversation.coachProfilePictureUrl ? 'hidden' : ''}`}>
                                            <User className="h-6 w-6 text-gray-600" />
                                        </div>
                                        {conversation.isOnline && (
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-medium text-gray-900 truncate">
                                                {conversation.coachName}
                                            </h3>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-xs text-gray-500">
                                                    {formatTimestamp(conversation.lastMessageTime)}
                                                </span>
                                                {conversation.unreadCount > 0 && (
                                                    <div className="w-2 h-2 bg-[#c53445] rounded-full"></div>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-500 truncate">
                                            {conversation.lastMessage}
                                        </p>
                                        {conversation.unreadCount > 0 && (
                                            <div className="mt-1">
                                                <span className="text-xs bg-[#c53445] text-white px-2 py-1 rounded-full">
                                                    {conversation.unreadCount} unread
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col bg-gray-50 h-full">
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="bg-white border-b border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="relative">
                                        {selectedConversation.coachProfilePictureUrl ? (
                                            <img
                                                src={getImageUrl(selectedConversation.coachProfilePictureUrl)}
                                                alt={selectedConversation.coachName}
                                                className="w-10 h-10 rounded-full object-cover"
                                                onError={(e) => {
                                                    console.log('Chat header image failed to load:', e.target.src);
                                                    console.log('Selected conversation object:', selectedConversation);
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div className={`w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center ${selectedConversation.coachProfilePictureUrl ? 'hidden' : ''}`}>
                                            <User className="h-5 w-5 text-gray-600" />
                                        </div>
                                        {selectedConversation.isOnline && (
                                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            {selectedConversation.coachName}
                                        </h2>
                                        {selectedConversation.isOnline && (
                                            <p className="text-sm text-green-600">Online</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {!wsConnected && (
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                            {messages.length === 0 ? (
                                <div className="text-center text-gray-500 mt-8">
                                    <p>No messages yet. Start the conversation!</p>
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.fromClient ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.fromClient
                                                ? 'bg-[#c53445] text-white'
                                                : 'bg-white text-gray-900 border border-gray-200'
                                                }`}
                                        >
                                            <p className="text-sm">{msg.content}</p>
                                            <div className={`flex items-center justify-between mt-1 ${msg.fromClient ? 'text-white opacity-70' : 'text-gray-500'}`}>
                                                <p className="text-xs">
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                {msg.fromClient && (
                                                    <span className="text-xs ml-2">
                                                        {msg.readFlag ? '✓✓' : '✓'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="bg-white border-t border-gray-200 p-4">
                            <form onSubmit={handleSendMessage} className="flex space-x-3">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type your message here..."
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                    disabled={sending}
                                />
                                <button
                                    type="submit"
                                    disabled={sending || !message.trim()}
                                    className="bg-[#c53445] text-white px-4 py-2 rounded-lg hover:bg-[#b02e3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {sending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <User className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                            <p className="text-gray-500">Choose a chat to start messaging</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientChat;
