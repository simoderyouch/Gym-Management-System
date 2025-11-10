import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { API_BASE } from '../config/paths';

class WebSocketService {
    constructor() {
        this.stompClient = null;
        this.connected = false;
        this.subscriptions = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    connect(token, onConnect, onError) {
        console.log('🔌 Initiating WebSocket connection...');

        // Disconnect any existing connection first
        if (this.stompClient && this.stompClient.connected) {
            console.log('🔄 Disconnecting existing WebSocket connection...');
            this.disconnect();
        }

        // Pass token as query parameter since SockJS doesn't support custom headers
    const socket = new SockJS(`${API_BASE}/ws?token=${encodeURIComponent(token)}`);
        this.stompClient = Stomp.over(socket);

        // Enable STOMP debug logging for WebSocket debugging
        this.stompClient.debug = (str) => {
            console.log('🔍 STOMP DEBUG:', str);
        };

        // Set more frequent heartbeat for faster real-time feel
        this.stompClient.heartbeat.outgoing = 5000;  // Send heartbeat every 5 seconds
        this.stompClient.heartbeat.incoming = 5000;  // Expect heartbeat every 5 seconds

        const headers = {};

        this.stompClient.connect(
            headers,
            (frame) => {
                console.log('✅ WebSocket connected successfully:', frame);
                console.log('📋 Connection details:', {
                    connected: this.stompClient.connected,
                    url: this.stompClient.ws?.url,
                    readyState: this.stompClient.ws?.readyState
                });
                this.connected = true;
                this.reconnectAttempts = 0;
                if (onConnect) onConnect();
            },
            (error) => {
                console.error('❌ WebSocket connection error:', error);
                console.error('🔍 Connection error details:', {
                    error: error,
                    headers: headers,
                    url: `${API_BASE}/ws`
                });
                this.connected = false;
                if (onError) onError(error);
                this.handleReconnect(token, onConnect, onError);
            }
        );
    }

    handleReconnect(token, onConnect, onError) {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

            setTimeout(() => {
                this.connect(token, onConnect, onError);
            }, 3000 * this.reconnectAttempts); // Exponential backoff
        } else {
            console.error('Max reconnection attempts reached');
        }
    }

    subscribeToChat(userEmail, onMessageReceived) {
        if (!this.connected || !this.stompClient) {
            console.error('❌ WebSocket not connected - cannot subscribe');
            return null;
        }

        const subscriptionKey = `chat-${userEmail}`;

        // Unsubscribe from existing subscription if any
        if (this.subscriptions.has(subscriptionKey)) {
            console.log(`🔄 Replacing existing subscription for ${userEmail}`);
            this.unsubscribeFromChat(userEmail);
        }

        // With Spring's user destinations, subscribe to `/user/queue/chat`
        // Also subscribe to legacy path `/user/${email}/queue/chat` as a compatibility fallback
        const destinationMain = `/user/queue/chat`;
        const destinationLegacy = `/user/${userEmail}/queue/chat`;
        console.log(`📡 Subscribing to chat channels: ${destinationMain} and ${destinationLegacy}`);

        const handler = (message) => {
            try {
                console.log('📨 Raw WebSocket message received:', {
                    body: message.body,
                    headers: message.headers,
                    destination: message.headers?.destination
                });
                const chatMessage = JSON.parse(message.body);
                console.log('📨 Parsed real-time message:', chatMessage);
                onMessageReceived(chatMessage);
            } catch (error) {
                console.error('❌ Error parsing chat message:', error);
                console.error('❌ Raw message body:', message.body);
            }
        };

        const subMain = this.stompClient.subscribe(destinationMain, handler);
        const subLegacy = this.stompClient.subscribe(destinationLegacy, handler);

        // Store both subscriptions under the same key for easy cleanup
        this.subscriptions.set(subscriptionKey, {
            unsubscribe: () => {
                try { subMain.unsubscribe(); } catch { }
                try { subLegacy.unsubscribe(); } catch { }
            }
        });
        console.log(`✅ Successfully subscribed to ${destinationMain} and ${destinationLegacy}`);
        return subMain;
    }

    subscribeToNotifications(userEmail, onNotificationReceived) {
        if (!this.connected || !this.stompClient) {
            console.error('❌ WebSocket not connected - cannot subscribe to notifications');
            return null;
        }

        const subscriptionKey = `notifications-${userEmail}`;

        // Unsubscribe from existing subscription if any
        if (this.subscriptions.has(subscriptionKey)) {
            console.log(`🔄 Replacing existing notification subscription for ${userEmail}`);
            this.unsubscribeFromNotifications(userEmail);
        }

        const destination = `/user/queue/notifications`;
        console.log(`📡 Subscribing to notifications: ${destination}`);

        const handler = (message) => {
            try {
                const notification = JSON.parse(message.body);
                console.log('🔔 Real-time notification received:', notification);
                onNotificationReceived(notification);
            } catch (error) {
                console.error('❌ Error parsing notification:', error);
            }
        };

        const subscription = this.stompClient.subscribe(destination, handler);

        // Store subscription for cleanup
        this.subscriptions.set(subscriptionKey, {
            unsubscribe: () => {
                try { subscription.unsubscribe(); } catch { }
            }
        });
        console.log(`✅ Successfully subscribed to notifications: ${destination}`);
        return subscription;
    }

    unsubscribeFromNotifications(userEmail) {
        const subscriptionKey = `notifications-${userEmail}`;
        const subscription = this.subscriptions.get(subscriptionKey);

        if (subscription) {
            subscription.unsubscribe();
            this.subscriptions.delete(subscriptionKey);
        }
    }

    disconnect() {
        console.log('🔌 Disconnecting WebSocket...');
        if (this.stompClient) {
            // Unsubscribe from all subscriptions
            this.subscriptions.forEach((subscription, key) => {
                console.log(`🔄 Unsubscribing from ${key}`);
                try {
                    subscription.unsubscribe();
                } catch (error) {
                    console.error(`❌ Error unsubscribing from ${key}:`, error);
                }
            });
            this.subscriptions.clear();

            // Disconnect from WebSocket
            try {
                if (this.stompClient.connected) {
                    this.stompClient.disconnect(() => {
                        console.log('✅ WebSocket disconnected successfully');
                    });
                }
            } catch (error) {
                console.error('❌ Error during WebSocket disconnect:', error);
            }

            this.stompClient = null;
            this.connected = false;
        }
    }

    isConnected() {
        return this.connected && this.stompClient;
    }
}

// Create a singleton instance
const websocketService = new WebSocketService();
export default websocketService;
