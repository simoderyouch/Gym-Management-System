import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Layout/Header';

const ClientDashboard = () => {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState(() => {
        const path = location.pathname;
        if (path.includes('/dashboard/bookings')) return 'bookings';
        if (path.includes('/dashboard/notifications')) return 'notifications';
        if (path.includes('/dashboard/chat')) return 'chat';
        if (path.includes('/dashboard/profile')) return 'profile';
        return 'profile'; // default
    });

    const navigationItems = [
        {
            id: 'bookings',
            name: 'My Bookings',
            icon: 'fas fa-calendar',
            path: '/dashboard/bookings'
        },
        {
            id: 'notifications',
            name: 'Notifications',
            icon: 'fas fa-bell',
            path: '/dashboard/notifications'
        },
        {
            id: 'chat',
            name: 'Chat',
            icon: 'fas fa-comments',
            path: '/dashboard/chat'
        },
        {
            id: 'profile',
            name: 'Membership & Profile',
            icon: 'fas fa-user',
            path: '/dashboard/profile'
        }
    ];

    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
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
    className={`group absolute -top-[.1rem]  size-10 rounded-full bg-white shadow-lg hover:bg-[#b02e3d] transition-colors z-10 border border-gray-200 ${sidebarOpen ? 'left-[248px]' : 'left-4'}`}
    title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
>
    <i
        className={`fas ${sidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'} text-[#c53445] group-hover:text-white text-sm`}
    ></i>
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
                                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === item.id
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
                    {/* Page Content */}
                    <main className="flex-1 p-6">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ClientDashboard;
