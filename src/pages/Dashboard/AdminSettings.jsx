import { useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const AdminSettings = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);

    const { logout } = useAuth();
    const navigate = useNavigate();

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('New password must be at least 6 characters long');
            return;
        }

        setLoading(true);
        try {
            await adminApi.changePassword({
                currentPassword,
                newPassword
            });
            toast.success('Password changed successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setShowPasswordForm(false);
        } catch (error) {
            console.error('Error changing password:', error);
            if (error.response?.data?.error) {
                toast.error(error.response.data.error);
            } else {
                toast.error('Failed to change password');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setLogoutLoading(true);
        try {
            await logout();
            navigate('/login');
            toast.success('Logged out successfully');
        } catch (error) {
            console.error('Error logging out:', error);
            toast.error('Failed to logout');
        } finally {
            setLogoutLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
            </div>

            {/* Password Change Section */}
            <div className="bg-white border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
                        <p className="text-sm text-gray-600">Update your admin account password</p>
                    </div>
                    <button
                        onClick={() => setShowPasswordForm(!showPasswordForm)}
                        className="px-4 py-2 bg-[#c53445] text-white rounded-lg hover:bg-[#b02e3d] transition-colors"
                    >
                        {showPasswordForm ? 'Cancel' : 'Change Password'}
                    </button>
                </div>

                {showPasswordForm && (
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Current Password
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                required
                                minLength={6}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                required
                            />
                        </div>
                        <div className="flex space-x-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-[#c53445] text-white rounded-lg hover:bg-[#b02e3d] disabled:opacity-50 transition-colors"
                            >
                                {loading ? 'Changing...' : 'Change Password'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowPasswordForm(false);
                                    setCurrentPassword('');
                                    setNewPassword('');
                                    setConfirmPassword('');
                                }}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Logout Section */}
            <div className="bg-white border rounded-lg p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Logout</h2>
                        <p className="text-sm text-gray-600">Sign out of your admin account</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        disabled={logoutLoading}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                        {logoutLoading ? 'Logging out...' : 'Logout'}
                    </button>
                </div>
            </div>

            {/* System Information */}
            <div className="bg-white border rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Admin Dashboard Version</p>
                        <p className="font-medium">v1.0.0</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Last Updated</p>
                        <p className="font-medium">{new Date().toLocaleDateString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
