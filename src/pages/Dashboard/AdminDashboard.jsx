import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { notificationApi } from '../../services/api';
import Header from '../../components/Layout/Header';

const AdminDashboard = () => {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState(() => {
        const path = location.pathname;
        if (path === '/admin-dashboard' || path === '/admin-dashboard/') return 'dashboard';
        if (path.includes('/admin-dashboard/manage-clients')) return 'manage-clients';
        if (path.includes('/admin-dashboard/manage-coaches')) return 'manage-coaches';
        if (path.includes('/admin-dashboard/announcements')) return 'announcements';
        if (path.includes('/admin-dashboard/equipment')) return 'equipment';
        if (path.includes('/admin-dashboard/manage-gyms')) return 'manage-gyms';
        if (path.includes('/admin-dashboard/shop-products')) return 'shop-products';
        if (path.includes('/admin-dashboard/bookings')) return 'bookings';
        if (path.includes('/admin-dashboard/reports')) return 'reports';
        if (path.includes('/admin-dashboard/settings')) return 'settings';
        if (path.includes('/admin-dashboard/checkin-clients')) return 'checkin-clients';
        if (path.includes('/admin-dashboard/notifications')) return 'notifications';
        return 'dashboard';
    });

    const navigationItems = [
        {
            id: 'dashboard',
            name: 'Dashboard',
            icon: 'fas fa-th-large',
            path: '/admin-dashboard',
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
        },
        {
            id: 'manage-clients',
            name: 'Manage Clients',
            icon: 'fas fa-user-friends',
            path: '/admin-dashboard/manage-clients',
            color: 'text-green-600',
            bgColor: 'bg-green-100'
        },
        {
            id: 'manage-coaches',
            name: 'Manage Coaches',
            icon: 'fas fa-user-tie',
            path: '/admin-dashboard/manage-coaches',
            color: 'text-purple-600',
            bgColor: 'bg-purple-100'
        },
        {
            id: 'announcements',
            name: 'Announcements',
            icon: 'fas fa-bullhorn',
            path: '/admin-dashboard/announcements',
            color: 'text-orange-600',
            bgColor: 'bg-orange-100'
        },
        {
            id: 'equipment',
            name: 'Equipment',
            icon: 'fas fa-dumbbell',
            path: '/admin-dashboard/equipment',
            color: 'text-red-600',
            bgColor: 'bg-red-100'
        },
        {
            id: 'manage-gyms',
            name: 'Manage Gyms',
            icon: 'fas fa-building',
            path: '/admin-dashboard/manage-gyms',
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-100'
        },
        {
            id: 'shop-products',
            name: 'Shop Products',
            icon: 'fas fa-store',
            path: '/admin-dashboard/shop-products',
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-100'
        },
        {
            id: 'bookings',
            name: 'Bookings Overview',
            icon: 'fas fa-calendar',
            path: '/admin-dashboard/bookings',
            color: 'text-teal-600',
            bgColor: 'bg-teal-100'
        },
        {
            id: 'notifications',
            name: 'Notifications',
            icon: 'fas fa-bell',
            path: '/admin-dashboard/notifications',
            color: 'text-red-600',
            bgColor: 'bg-red-100'
        },
        {
            id: 'reports',
            name: 'Reports/Payments',
            icon: 'fas fa-file-invoice-dollar',
            path: '/admin-dashboard/reports',
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100'
        },
        {
            id: 'checkin-clients',
            name: 'Check-In Clients',
            icon: 'fas fa-clipboard-check',
            path: '/admin-dashboard/checkin-clients',
            color: 'text-pink-600',
            bgColor: 'bg-pink-100'
        },
        {
            id: 'settings',
            name: 'Settings',
            icon: 'fas fa-cog',
            path: '/admin-dashboard/settings',
            color: 'text-gray-600',
            bgColor: 'bg-gray-100'
        },
    ];

    const { logout } = useAuth();
    const navigate = useNavigate();

    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        let mounted = true;
        const loadUnread = async () => {
            try {
                console.log('Fetching unread notifications count...');
                const res = await notificationApi.getUnreadCount();
                console.log('Full response:', res);
                console.log('Response data:', res.data);
                console.log('Response data type:', typeof res.data);
                console.log('Response data keys:', Object.keys(res.data || {}));

                if (mounted) {
                    // Backend returns {unreadCount: 1} directly
                    let count = 0;

                    console.log('Response structure:', JSON.stringify(res, null, 2));

                    // Since backend returns {unreadCount: 1}, access it directly
                    if (res && res.unreadCount !== undefined) {
                        count = Number(res.unreadCount);
                    } else if (res && res.data && res.data.unreadCount !== undefined) {
                        count = Number(res.data.unreadCount);
                    }

                    console.log('Final extracted count:', count);
                    console.log('Setting unread count to:', count);
                    setUnreadCount(count);
                }
            } catch (error) {
                console.error('Error fetching unread notifications count:', error);
                if (mounted) setUnreadCount(0);
            }
        };
        loadUnread();
        // Refresh more frequently to stay in sync
        const id = setInterval(loadUnread, 5000); // Changed from 30000 to 5000 (5 seconds)

        // Listen for custom event to refresh unread count
        const handleRefreshUnreadCount = () => {
            loadUnread();
        };
        window.addEventListener('refreshUnreadCount', handleRefreshUnreadCount);

        return () => {
            mounted = false;
            clearInterval(id);
            window.removeEventListener('refreshUnreadCount', handleRefreshUnreadCount);
        };
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Full Width Header */}
            <Header />

            <div className="flex relative">
                {/* Toggle Button - Outside sidebar so it stays visible */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className={`group absolute -top-[.1rem] size-10 rounded-full bg-white shadow-lg hover:bg-[#b02e3d] transition-colors z-10 border border-gray-200 ${sidebarOpen ? 'left-[248px]' : 'left-4'}`}
                    title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
                >
                    <i className={`fas ${sidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'} text-[#c53445] group-hover:text-white text-sm`}></i>
                </button>

                {/* Sidebar */}
                <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white shadow-lg transition-all duration-300 overflow-hidden`}>
                    {/* Navigation */}
                    {sidebarOpen && (
                        <nav className="p-4">
                            <ul className="space-y-2">
                                {navigationItems.map((item) => (
                                    <li key={item.id}>
                                        <Link
                                            to={item.path}
                                            onClick={() => setActiveTab(item.id)}
                                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors group ${activeTab === item.id
                                                ? `${item.bgColor} ${item.color}`
                                                : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                            title={!sidebarOpen ? item.name : ''}
                                        >
                                            <div className="relative">
                                                <i className={`${item.icon} w-5 h-5 ${activeTab === item.id ? item.color : 'group-hover:' + item.color}`}></i>
                                                {/* Notification badge for notifications item */}
                                                {item.id === 'notifications' && unreadCount > 0 && (
                                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                                                        {unreadCount > 99 ? '99+' : unreadCount}
                                                    </span>
                                                )}

                                            </div>
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
                    <div className="bg-white bg-opacity-0 px-10 py-4">

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

export default AdminDashboard;
