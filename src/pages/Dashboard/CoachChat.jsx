import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { chatApi, clientApi, coachApi } from '../../services/api';
import websocketService from '../../services/websocketService';
import { Loader2, Send, Search, User } from 'lucide-react';
import { profilePictureUrl } from '../../config/paths';

const CoachChat = () => {
    const { user } = useAuth();
    console.log('CoachChat component rendered, user:', user);

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
    const [coachId, setCoachId] = useState(null);

    console.log('Current coachId state:', coachId);

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
        console.log('📨 Coach received new WebSocket message:', newMessage);

        // Add new message to current conversation if it matches
        setMessages(prev => {
            // Check if this message belongs to the currently selected conversation
            if (selectedChat &&
                newMessage.clientId === selectedChat.clientId &&
                newMessage.coachId === selectedChat.coachId) {
                console.log('✅ Adding WebSocket message to current conversation');

                // Avoid duplicates by checking if message already exists
                const exists = prev.some(msg => msg.id === newMessage.id);
                if (exists) {
                    console.log('⚠️ Message already exists, skipping duplicate');
                    return prev;
                }
                return [...prev, newMessage];
            }
            return prev;
        });

        // Update conversations list with new message
        setConversations(prev => {
            console.log('🔄 Updating conversations with new WebSocket message');
            const updated = prev.map(conv => {
                if (conv.clientId === newMessage.clientId && conv.coachId === newMessage.coachId) {
                    // Only increase unread count if message is from client and not currently viewing this conversation
                    const shouldIncreaseUnread = newMessage.fromClient &&
                        !newMessage.readFlag &&
                        (!selectedChat || selectedChat.clientId !== newMessage.clientId);
                    return {
                        ...conv,
                        lastMessage: newMessage.content,
                        lastMessageTime: newMessage.createdAt,
                        unreadCount: conv.unreadCount + (shouldIncreaseUnread ? 1 : 0)
                    };
                }
                return conv;
            });
            return updated.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
        });

        // Mark message as read if it's from client and we're viewing the conversation
        if (newMessage.fromClient && !newMessage.readFlag && selectedChat &&
            selectedChat.clientId === newMessage.clientId &&
            selectedChat.coachId === newMessage.coachId) {
            setTimeout(() => {
                chatApi.markAsRead(newMessage.id).catch(error => {
                    console.error('❌ Error marking message as read:', error);
                });
            }, 100); // Small delay to ensure message is processed
        }
    }, [selectedChat]);

    // Initialize WebSocket connection
    useEffect(() => {
        console.log('🔌 Coach WebSocket useEffect triggered, user:', user);
        if (user?.token && user?.email) {
            console.log('🚀 Connecting coach to WebSocket with token...');

            const connectWithRetry = () => {
                websocketService.connect(
                    user.token,
                    () => {
                        console.log('✅ Coach WebSocket connected successfully');
                        setWsConnected(true);

                        // Subscribe to chat messages with a small delay to ensure connection is stable
                        setTimeout(() => {
                            console.log('📡 Subscribing to chat messages for:', user.email);
                            websocketService.subscribeToChat(user.email, handleWebSocketMessage);
                        }, 500);
                    },
                    (error) => {
                        console.error('❌ Coach WebSocket connection failed:', error);
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

    // Load coach ID on component mount
    useEffect(() => {
        const loadCoachId = async () => {
            try {
                console.log('Loading coach profile...', user);

                // Try to use coach ID from user object first
                if (user?.id) {
                    console.log('Using coach ID from user object:', user.id);
                    setCoachId(user.id);
                    return;
                }

                // Fallback to API call
                console.log('Fetching coach profile from API...');
                const response = await coachApi.getMyProfile();
                console.log('Coach profile response:', response.data);
                setCoachId(response.data.id);
                console.log('Set coach ID to:', response.data.id);
            } catch (error) {
                console.error('Error loading coach profile:', error);
                toast.error('Failed to load coach profile');
            }
        };

        console.log('Coach ID useEffect triggered, user:', user);
        if (user?.token) {
            console.log('User has token, loading coach ID...');
            loadCoachId();
        } else {
            console.log('No user token available');
        }
    }, [user]);

    // Load conversations
    const loadConversations = async () => {
        try {
            setLoading(true);
            console.log('🔄 Loading coach conversations...');
            const response = await chatApi.getCoachConversations();
            const conversationsData = response.data;
            console.log('📊 Raw coach conversations data:', conversationsData);
            console.log('📊 Response status:', response.status);
            console.log('📊 Response headers:', response.headers);

            if (!conversationsData || conversationsData.length === 0) {
                console.log('No conversations found');
                setConversations([]);
                return;
            }

            // Extract coach ID from the first message if not already set
            if (!coachId && conversationsData.length > 0) {
                const extractedCoachId = conversationsData[0].coachId;
                console.log('Extracting coach ID from conversations:', extractedCoachId);
                setCoachId(extractedCoachId);
            }

            // Group messages by client to create conversations
            const conversationMap = new Map();

            conversationsData.forEach(msg => {
                const clientId = msg.clientId;
                const clientName = msg.clientName;

                if (!conversationMap.has(clientId)) {
                    conversationMap.set(clientId, {
                        clientId: clientId,
                        coachId: msg.coachId,
                        clientName: clientName,
                        clientProfilePictureUrl: null, // Will be fetched separately
                        lastMessage: msg.content,
                        lastMessageTime: msg.createdAt,
                        unreadCount: 0,
                        isOnline: false
                    });
                }

                const conversation = conversationMap.get(clientId);
                if (new Date(msg.createdAt) > new Date(conversation.lastMessageTime)) {
                    conversation.lastMessage = msg.content;
                    conversation.lastMessageTime = msg.createdAt;
                }

                // Count unread messages from clients (not from coach)
                // Backend returns 'fromClient' instead of 'isFromClient'
                if (!msg.readFlag && msg.fromClient) {
                    conversation.unreadCount++;
                }
            });

            const conversationsList = Array.from(conversationMap.values())
                .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

            console.log('Processed conversations:', conversationsList);

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

            console.log('Final conversations with profiles:', conversationsWithProfiles);
            setConversations(conversationsWithProfiles);
        } catch (error) {
            console.error('Error loading conversations:', error);
            toast.error('Failed to load conversations');
        } finally {
            setLoading(false);
        }
    };

    // Load messages for a specific conversation
    const loadMessages = async (clientId, forceCoachId = null) => {
        const currentCoachId = forceCoachId || coachId;
        console.log('loadMessages called with clientId:', clientId, 'coachId:', currentCoachId);

        if (!currentCoachId || !clientId) {
            console.log('Missing coachId or clientId, returning early');
            return;
        }

        try {
            console.log(`Loading messages for client ${clientId} and coach ${currentCoachId}`);
            const response = await chatApi.getConversation(clientId, currentCoachId);
            const messagesData = response.data;
            console.log('Raw messages data:', messagesData);

            if (!messagesData || messagesData.length === 0) {
                console.log('No messages found');
                setMessages([]);
                return;
            }

            console.log('Raw messages data:', messagesData);
            setMessages(messagesData);

            // Mark unread messages from client as read
            const unreadMessages = messagesData.filter(msg => !msg.readFlag && msg.fromClient);
            console.log('Unread messages to mark as read:', unreadMessages);
            for (const msg of unreadMessages) {
                try {
                    await chatApi.markAsRead(msg.id);
                } catch (error) {
                    console.error('Error marking message as read:', error);
                }
            }

            // Update conversation unread count to 0 since we just read all messages
            setConversations(prev => prev.map(conv =>
                conv.clientId === clientId ? { ...conv, unreadCount: 0 } : conv
            ));
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
            const response = await chatApi.searchCoachConversations(searchQuery);
            const conversationsData = response.data;

            // Group messages by client to create conversations
            const conversationMap = new Map();

            conversationsData.forEach(msg => {
                const clientId = msg.clientId;
                const clientName = msg.clientName;

                if (!conversationMap.has(clientId)) {
                    conversationMap.set(clientId, {
                        clientId: clientId,
                        coachId: msg.coachId,
                        clientName: clientName,
                        clientProfilePictureUrl: null, // Will be fetched separately
                        lastMessage: msg.content,
                        lastMessageTime: msg.createdAt,
                        unreadCount: 0,
                        isOnline: false
                    });
                }

                const conversation = conversationMap.get(clientId);
                if (new Date(msg.createdAt) > new Date(conversation.lastMessageTime)) {
                    conversation.lastMessage = msg.content;
                    conversation.lastMessageTime = msg.createdAt;
                }

                // Count unread messages from clients (not from coach)
                // Backend returns 'fromClient' instead of 'isFromClient'
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
        if (conversation && conversation.clientId) {
            console.log('Loading messages for client:', conversation.clientId);
            // Use the coachId from the conversation if global coachId is not available
            const currentCoachId = coachId || conversation.coachId;
            console.log('Using coachId:', currentCoachId);
            loadMessages(conversation.clientId, currentCoachId);
        }
    };

    // Handle send message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        const currentCoachId = coachId || selectedChat?.coachId;
        console.log('handleSendMessage called with message:', message, 'selectedChat:', selectedChat, 'coachId:', currentCoachId);

        if (!message.trim() || !selectedChat || !currentCoachId) {
            console.log('Missing required data for sending message');
            return;
        }

        try {
            setSending(true);
            console.log('Sending message to client:', selectedChat.clientId);

            const response = await chatApi.sendCoachMessage({
                clientId: selectedChat.clientId,
                content: message.trim()
            });

            console.log('Coach send message response:', response.data);

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
                    if (conv.clientId === selectedChat.clientId) {
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
            console.log('Coach message sent successfully');
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    // Filter conversations
    const filteredConversations = conversations.filter(conv => {
        if (selectedFilter === 'Unread') return conv.unreadCount > 0;
        if (selectedFilter === 'Archived') return false; // No archived functionality yet
        return true;
    });

    // Calculate total unread count
    const totalUnreadCount = conversations.reduce((total, conv) => total + conv.unreadCount, 0);

    // Helper function to get image URL
    const getImageUrl = (url) => {
        if (!url) return null;
        return encodeURI(profilePictureUrl(url));
    };

    // Load conversations on mount
    useEffect(() => {
        console.log('Load conversations useEffect triggered, user:', user);
        if (user?.token) {
            console.log('User available, loading conversations...');
            loadConversations();
        } else {
            console.log('User not available yet, waiting...');
        }
    }, [user]);

    // Refresh conversations every 30 seconds to keep unread counts updated
    useEffect(() => {
        console.log('Setting up conversation refresh interval, coachId:', coachId);
        const interval = setInterval(() => {
            if (coachId) {
                console.log('Refreshing conversations...');
                loadConversations();
            }
        }, 30000);

        return () => {
            console.log('Clearing conversation refresh interval');
            clearInterval(interval);
        };
    }, [coachId]);

    // Handle search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            searchConversations();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#c53445]" />
                    <p className="text-gray-600">Loading conversations...</p>
                </div>
            </div>
        );
    }

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
                                key={conversation.clientId}
                                onClick={() => handleSelectConversation(conversation)}
                                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedChat?.clientId === conversation.clientId ? 'bg-[#c53445] bg-opacity-10' : ''
                                    }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="relative">
                                        {conversation.clientProfilePictureUrl ? (
                                            <img
                                                src={getImageUrl(conversation.clientProfilePictureUrl)}
                                                alt={conversation.clientName}
                                                className="w-12 h-12 rounded-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div className={`w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center ${conversation.clientProfilePictureUrl ? 'hidden' : ''}`}>
                                            <User className="w-6 h-6 text-gray-600" />
                                        </div>
                                        {conversation.isOnline && (
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-medium text-gray-900 truncate">
                                                {conversation.clientName}
                                            </h3>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-xs text-gray-500">
                                                    {new Date(conversation.lastMessageTime).toLocaleDateString()}
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
                {selectedChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="bg-white border-b border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="relative">
                                        {selectedChat.clientProfilePictureUrl ? (
                                            <img
                                                src={getImageUrl(selectedChat.clientProfilePictureUrl)}
                                                alt={selectedChat.clientName}
                                                className="w-10 h-10 rounded-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div className={`w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center ${selectedChat.clientProfilePictureUrl ? 'hidden' : ''}`}>
                                            <User className="w-5 h-5 text-gray-600" />
                                        </div>
                                        {selectedChat.isOnline && (
                                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            {selectedChat.clientName}
                                        </h2>
                                        {selectedChat.isOnline && (
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
                                        className={`flex ${msg.fromClient ? 'justify-start' : 'justify-end'}`}
                                    >
                                        <div
                                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.fromClient
                                                ? 'bg-white text-gray-900 border border-gray-200'
                                                : 'bg-[#c53445] text-white'
                                                }`}
                                        >
                                            <p className="text-sm">{msg.content}</p>
                                            <div className={`flex items-center justify-between mt-1 ${msg.fromClient ? 'text-gray-500' : 'text-white opacity-70'}`}>
                                                <p className="text-xs">
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                {!msg.fromClient && (
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

export default CoachChat;