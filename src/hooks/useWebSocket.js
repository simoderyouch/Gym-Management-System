import { useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import websocketService from '../services/websocketService';

export const useWebSocket = () => {
    const { user, isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated() && user) {
            const token = localStorage.getItem('token');
            if (token) {
                websocketService.connect(token);
            }
        }

        return () => {
            // Cleanup will be handled by AuthContext on logout
        };
    }, [user, isAuthenticated]);

    const sendMessage = useCallback((event, data) => {
        websocketService.emit(event, data);
    }, []);

    const listenToEvent = useCallback((event, callback) => {
        websocketService.on(event, callback);

        // Return cleanup function
        return () => {
            websocketService.off(event, callback);
        };
    }, []);

    const joinRoom = useCallback((room) => {
        websocketService.joinRoom(room);
    }, []);

    const leaveRoom = useCallback((room) => {
        websocketService.leaveRoom(room);
    }, []);

    const sendChatMessage = useCallback((message) => {
        websocketService.sendChatMessage(message);
    }, []);

    const onChatMessage = useCallback((callback) => {
        return websocketService.onChatMessage(callback);
    }, []);

    const onNotification = useCallback((callback) => {
        return websocketService.onNotification(callback);
    }, []);

    const onBookingUpdate = useCallback((callback) => {
        return websocketService.onBookingUpdate(callback);
    }, []);

    const onAttendanceUpdate = useCallback((callback) => {
        return websocketService.onAttendanceUpdate(callback);
    }, []);

    const isConnected = useCallback(() => {
        return websocketService.getConnectionStatus();
    }, []);

    return {
        sendMessage,
        listenToEvent,
        joinRoom,
        leaveRoom,
        sendChatMessage,
        onChatMessage,
        onNotification,
        onBookingUpdate,
        onAttendanceUpdate,
        isConnected: isConnected()
    };
};
