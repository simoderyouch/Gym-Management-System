import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { coachApi } from '../../services/api.js';
import Header from '../../components/Layout/Header';
import { fullUrl } from '../../config/paths';

const CoachDashboard = () => {
    const location = useLocation();
    const { user } = useAuth();
    const [coachProfile, setCoachProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const [activeTab, setActiveTab] = useState(() => {
        const path = location.pathname;
        if (path.includes('/coach-dashboard/clients')) return 'clients';
        if (path.includes('/coach-dashboard/bookings')) return 'bookings';
        if (path.includes('/coach-dashboard/chat')) return 'chat';
        if (path.includes('/coach-dashboard/profile')) return 'profile';
        return 'dashboard'; // default
    });

    const navigationItems = [
        {
            id: 'dashboard',
            name: 'Dashboard',
            icon: 'fas fa-th-large',
            path: '/coach-dashboard'
        },
        {
            id: 'clients',
            name: 'My Clients',
            icon: 'fas fa-users',
            path: '/coach-dashboard/clients'
        },
        {
            id: 'bookings',
            name: 'Bookings',
            icon: 'fas fa-calendar',
            path: '/coach-dashboard/bookings'
        },
        {
            id: 'chat',
            name: 'Chat',
            icon: 'fas fa-comments',
            path: '/coach-dashboard/chat'
        },
        {
            id: 'profile',
            name: 'Profile Settings',
            icon: 'fas fa-user',
            path: '/coach-dashboard/profile'
        }
    ];

    const { logout } = useAuth();
    const navigate = useNavigate();

    // Load coach profile
    const loadCoachProfile = async () => {
        try {
            setLoading(true);
            const response = await coachApi.getMyProfile();
            setCoachProfile(response.data);
        } catch (error) {
            console.error('Error loading coach profile:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get image URL helper
    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return fullUrl(url);
    };

    useEffect(() => {
        if (user?.token) {
            loadCoachProfile();
        }
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Full Width Header */}
            <Header />

            <div className="flex">
                {/* Sidebar */}
                <div
                    className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white shadow-lg transition-all duration-300 overflow-hidden relative`}
                >
                    {/* Navigation */}
                    {sidebarOpen && (
                        <nav className="p-4">
                            <ul className="space-y-2">
                                {navigationItems.map((item) => (
                                    <li key={item.id}>
                                        <Link
                                            to={item.path}
                                            onClick={() => setActiveTab(item.id)}
                                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                                                activeTab === item.id
                                                    ? 'bg-gray-100 text-[#c53445]'
                                                    : 'text-gray-700 hover:bg-gray-50 hover:text-[#c53445]'
                                            }`}
                                        >
                                            <i className={`${item.icon} w-5 h-5`}></i>
                                            <span className="font-medium">{item.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    )}
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col">
                    {/* Welcome Section */}
                    <div className="bg-white shadow-sm border-b px-6 py-4">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
                            >
                                <i className={`fas ${sidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'} text-gray-600`}></i>
                            </button>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Welcome back, {coachProfile?.firstName || 'Coach'}!
                            </h2>
                        </div>
                    </div>

                    {/* Page Content */}
                    <main className="flex-1 p-6">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
};

export default CoachDashboard;
