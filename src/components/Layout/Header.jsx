import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { clientApi, coachApi } from '../../services/api';
import { profilePictureUrl } from '../../config/paths';

const Header = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const [userProfile, setUserProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Function to get dashboard URL based on user role
    const getDashboardUrl = () => {
        if (!user) return '/';

        // Convert role to lowercase for comparison since AuthContext stores it in lowercase
        const userRole = user.role ? user.role.toLowerCase() : '';

        switch (userRole) {
            case 'admin':
                return '/admin-dashboard';
            case 'coach':
                return '/coach-dashboard';
            case 'client':
                return '/dashboard';
            default:
                console.log('Unknown role:', userRole, 'User:', user);
                return '/';
        }
    };

    // Function to get profile image or fallback
    const getProfileImage = () => {
        if (!user) return null;

        // Convert role to lowercase for comparison
        const userRole = user.role ? user.role.toLowerCase() : '';

        if (userRole === 'admin') {
            // Admin uses the app logo
            return '/src/assets/Logo.png';
        }

        // Use profile data if available, otherwise fall back to user data
        const profileData = userProfile || user;
        if (profileData?.profilePictureUrl) {
            return getImageUrl(profileData.profilePictureUrl);
        }

        // Fallback for users without profile picture
        return null;
    };

    // Helper function to construct image URL (same pattern as other components)
    const getImageUrl = (url) => profilePictureUrl(url);

    // Function to check if user has a profile image
    const hasProfileImage = () => {
        return getProfileImage() !== null;
    };

    // Fetch user profile data when authenticated
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!isAuthenticated() || !user) return;

            try {
                setLoadingProfile(true);
                const userRole = user.role ? user.role.toLowerCase() : '';

                let response;
                if (userRole === 'client') {
                    response = await clientApi.getMyProfile();
                } else if (userRole === 'coach') {
                    response = await coachApi.getMyProfile();
                } else {
                    // Admin doesn't need profile fetch
                    return;
                }

                setUserProfile(response.data);
            } catch (error) {
                console.error('Error fetching user profile:', error);
                // Don't show error toast as this is not critical
            } finally {
                setLoadingProfile(false);
            }
        };

        fetchUserProfile();
    }, [user, isAuthenticated]);

    return (
        <header className="bg-white shadow-sm border-b py-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center pt-5">
                        <Link to="/">
                            <img src="./src/assets/Logo.png" alt="ApexFit Logo" className="w-20 object-contain" />
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="hidden md:flex space-x-8">
                        <Link
                            to="/equipment"
                            className="text-gray-900 hover:text-[#c53445] px-3 py-2 text-sm font-medium transition-colors"
                        >
                            Equipment
                        </Link>
                        <Link
                            to="/shop"
                            className="text-gray-900 hover:text-[#c53445] px-3 py-2 text-sm font-medium transition-colors"
                        >
                            Shop
                        </Link>
                        <Link
                            to="/trainers"
                            className="text-gray-900 hover:text-[#c53445] px-3 py-2 text-sm font-medium transition-colors"
                        >
                            Trainers
                        </Link>
                    </nav>

                    {/* User Profile and Logout */}
                    <div className="flex items-center space-x-3">
                        {/* User Profile Image (only show if authenticated) */}
                        {isAuthenticated() && (
                            <Link
                                to={getDashboardUrl()}
                                className="flex items-center justify-center size-10 rounded-full overflow-hidden border-2 border-gray-200 hover:border-[#c53445] transition-colors"
                                title={`Go to ${user?.role?.toLowerCase() || 'user'} dashboard (${getDashboardUrl()})`}
                                onClick={() => console.log('Profile clicked - User:', user, 'Dashboard URL:', getDashboardUrl())}
                            >
                                {hasProfileImage() ? (
                                    <img
                                        src={getProfileImage()}
                                        alt={`${user?.firstName || 'User'} profile`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div
                                    className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-medium"
                                    style={{ display: hasProfileImage() ? 'none' : 'flex' }}
                                >
                                    <i className="fas fa-user"></i>
                                </div>
                            </Link>
                        )}

                        {/* Login/Logout Button */}
                        {isAuthenticated() ? (
                            <button
                                onClick={handleLogout}
                                className="bg-[#c53445] text-white size-10 rounded-full text-sm font-medium hover:bg-[#b02e3d] transition-colors"
                                title="Logout"
                            >
                                <i className="fas fa-sign-out-alt"></i>
                            </button>
                        ) : (
                            <Link
                                to="/login"
                                className="bg-[#c53445] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#b02e3d] transition-colors"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
