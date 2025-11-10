import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/authApi';
import Cookies from 'js-cookie';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// JWT token utility functions
const parseJwt = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
};

const isTokenExpired = (token) => {
    const decoded = parseJwt(token);
    if (!decoded) return true;
    return decoded.exp * 1000 < Date.now();
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on app start
        const cookieToken = Cookies.get('token');
        const lsToken = localStorage.getItem('token');
        const token = cookieToken || lsToken;
        const userData = localStorage.getItem('user');

        if (token && userData && !isTokenExpired(token)) {
            try {
                const parsedUser = JSON.parse(userData);
                // Add token to user object if not present
                if (!parsedUser.token) {
                    parsedUser.token = token;
                }
                setUser(parsedUser);
            } catch (error) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                Cookies.remove('token');
                Cookies.remove('userRole');
            }
        } else if (token && isTokenExpired(token)) {
            // Token expired, clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            Cookies.remove('token');
            Cookies.remove('userRole');
        }
        setLoading(false);
    }, []);

    const login = async (credentials) => {
        try {
            const response = await authApi.login(credentials);
            const { token } = response.data;

            // Parse JWT to get user info
            const decodedToken = parseJwt(token);
            if (!decodedToken) {
                throw new Error('Invalid token received');
            }

            // Extract user info from token
            const roleFromToken = (decodedToken.role || decodedToken.authorities?.[0]?.replace('ROLE_', '') || 'USER');
            const normalizedRole = String(roleFromToken).toLowerCase();
            const userData = {
                id: decodedToken.sub || decodedToken.userId,
                email: credentials.email,
                role: normalizedRole,
                name: credentials.email.split('@')[0],
                token: token // Include the token in user object
            };

            // Store token and user data (both cookies and localStorage)
            Cookies.set('token', token, { expires: 7 });
            Cookies.set('userRole', normalizedRole, { expires: 7 });
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));

            setUser(userData);
            return { success: true, user: userData };
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        try {
            const token = Cookies.get('token') || localStorage.getItem('token');
            if (token) {
                await authApi.logout({ token });
            }
        } catch (error) {
            // ignore
        } finally {
            setUser(null);
            Cookies.remove('token');
            Cookies.remove('userRole');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    };

    const isAuthenticated = () => {
        const token = Cookies.get('token') || localStorage.getItem('token');
        return user !== null && token && !isTokenExpired(token);
    };

    const hasRole = (role) => {
        if (!user || !role) return false;
        return String(user.role).toLowerCase() === String(role).toLowerCase();
    };

    const value = {
        user,
        login,
        logout,
        isAuthenticated,
        hasRole,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
