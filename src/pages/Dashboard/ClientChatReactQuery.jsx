import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { chatApi } from '../../services/api';
import websocketService from '../../services/websocketService';
import { Loader2, Send, Search, User } from 'lucide-react';
import { profilePictureUrl } from '../../config/paths';
import { 
  useClientConversations, 
  useConversationMessages, 
  useSendClientMessage, 
  useChatWebSocket,
  useMarkAsRead 
} from '../../hooks/useChat';

const ClientChat = () => {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // WebSocket connection state
  const [wsConnected, setWsConnected] = useState(false);
  const messagesEndRef = useRef(null);

  // React Query hooks
  const { data: conversations = [], isLoading: conversationsLoading, error: conversationsError } = useClientConversations();
  const { data: messages = [], isLoading: messagesLoading } = useConversationMessages(
    selectedChat?.clientId, 
    selectedChat?.coachId
  );
  const sendMessageMutation = useSendClientMessage();
  const markAsReadMutation = useMarkAsRead();
  const { user: wsUser, invalidateOnNewMessage } = useChatWebSocket('client');

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSocket message handler with React Query integration
  const handleWebSocketMessage = useCallback((newMessage) => {
    console.log('📨 ClientChat received WebSocket message:', newMessage);
    
    // Use React Query cache invalidation
    invalidateOnNewMessage(newMessage);

    // Mark message as read if it's from coach and we're viewing the conversation
    if (!newMessage.fromClient && !newMessage.readFlag && 
        selectedChat && selectedChat.coachId === newMessage.coachId) {
      markAsReadMutation.mutate(newMessage.id);
    }
  }, [selectedChat, invalidateOnNewMessage, markAsReadMutation]);

  // Initialize WebSocket connection
  useEffect(() => {
    console.log('🔌 Client WebSocket useEffect triggered, user:', user);
    if (user?.token) {
      console.log('🚀 Connecting client to WebSocket with token...');
      websocketService.connect(
        user.token,
        () => {
          console.log('✅ Client WebSocket connected successfully');
          setWsConnected(true);
          
          // Subscribe to chat messages
          websocketService.subscribeToChat(user.email, handleWebSocketMessage);
        },
        (error) => {
          console.error('❌ WebSocket connection failed:', error);
          setWsConnected(false);
          toast.error('Chat connection failed. Messages may not be real-time.');
        }
      );
    }

    return () => {
      console.log('🔌 Disconnecting WebSocket...');
      websocketService.disconnect();
    };
  }, [user, handleWebSocketMessage]);

  // Handle conversation selection
  const handleSelectConversation = async (conversation) => {
    console.log('Selecting conversation:', conversation);
    
    // Get client ID for the conversation
    let clientId = conversation.clientId;
    if (!clientId && user?.id) {
      clientId = user.id;
    }
    
    setSelectedChat({
      ...conversation,
      clientId
    });

    // Mark unread messages as read
    if (conversation.unreadCount > 0) {
      // This will be handled by the useConversationMessages hook and markAsRead
      console.log('Marking conversation messages as read...');
    }
  };

  // Handle send message with React Query
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || !selectedChat) {
      console.log('Missing required data for sending message');
      return;
    }

    console.log('Sending message via React Query mutation...');
    
    // Use React Query mutation for optimistic updates
    sendMessageMutation.mutate({
      coachId: selectedChat.coachId,
      content: message.trim()
    }, {
      onSuccess: () => {
        setMessage(''); // Clear input on success
        console.log('Message sent successfully via React Query');
      }
    });
  };

  // Get image URL helper
  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
  const fullPath = profilePictureUrl(url);
    return encodeURI(fullPath);
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
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      if (!conv.coachName.toLowerCase().includes(query) && 
          !conv.lastMessage.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    // Filter by unread status
    if (selectedFilter === 'Unread') {
      return conv.unreadCount > 0;
    }
    
    return true;
  });

  // Calculate total unread count
  const totalUnreadCount = conversations.reduce((total, conv) => total + conv.unreadCount, 0);

  // Handle loading and error states
  if (conversationsError) {
    console.error('Error loading conversations:', conversationsError);
    toast.error('Failed to load conversations');
  }

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
          </div>

          {/* Filters */}
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedFilter('All')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === 'All'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedFilter('Unread')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === 'Unread'
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
          {conversationsLoading ? (
            <div className="p-4 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#c53445]" />
              <p className="text-gray-500">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.coachId}
                onClick={() => handleSelectConversation(conversation)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedChat?.coachId === conversation.coachId ? 'bg-[#c53445] bg-opacity-10' : ''
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
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center ${
                      conversation.coachProfilePictureUrl ? 'hidden' : ''
                    }`}>
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
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center ${
                      selectedConversation.coachProfilePictureUrl ? 'hidden' : ''
                    }`}>
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
              {messagesLoading ? (
                <div className="text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#c53445]" />
                  <p className="text-gray-500">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
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
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.fromClient
                          ? 'bg-[#c53445] text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <div className={`flex items-center justify-between mt-1 ${
                        msg.fromClient ? 'text-white opacity-70' : 'text-gray-500'
                      }`}>
                        <p className="text-xs">
                          {new Date(msg.createdAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
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
                  disabled={sendMessageMutation.isPending}
                />
                <button
                  type="submit"
                  disabled={sendMessageMutation.isPending || !message.trim()}
                  className="bg-[#c53445] text-white px-4 py-2 rounded-lg hover:bg-[#b02e3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendMessageMutation.isPending ? (
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
