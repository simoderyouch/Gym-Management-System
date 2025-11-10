import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import {
    User,
    Calendar,
    Clock,
    Edit,
    Camera,
    Loader2,
    AlertCircle,
    CheckCircle,
    XCircle
} from 'lucide-react';
import { clientApi, bookingApi } from '../../services/api';
import { profilePictureUrl } from '../../config/paths';
import { useAuth } from '../../context/AuthContext';

const ClientProfile = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Profile data states
    const [profile, setProfile] = useState(null);
    const [membership, setMembership] = useState(null);
    const [upcomingBookings, setUpcomingBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Form states
    const [personalInfo, setPersonalInfo] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        bio: ''
    });
    const [passwordInfo, setPasswordInfo] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Image upload state
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            setLoading(true);

            // Fetch profile data
            const profileResponse = await clientApi.getMyProfile();
            const profileData = profileResponse.data;
            console.log('Profile data received:', profileData);
            setProfile(profileData);

            // Set form data with current profile information
            const formData = {
                firstName: profileData.firstName || '',
                lastName: profileData.lastName || '',
                email: profileData.email || '',
                phone: profileData.phoneNumber || '', // Backend uses phoneNumber
                bio: profileData.bio || ''
            };
            console.log('Setting form data:', formData);
            setPersonalInfo(formData);

            // Set current profile image for display
            if (profileData.profilePictureUrl) { // Backend uses profilePictureUrl
                console.log('Setting profile image:', profileData.profilePictureUrl);
                setImagePreview(getImageUrl(profileData.profilePictureUrl));
            }

            // Fetch membership data
            try {
                const membershipResponse = await clientApi.getMembershipRemainingDays();
                setMembership(membershipResponse.data);
            } catch (error) {
                console.log('No membership data available');
            }

            // Fetch upcoming bookings (max 7)
            try {
                const bookingsResponse = await bookingApi.getMyBookings();
                const allBookings = bookingsResponse.data;

                // Filter for upcoming bookings and limit to 7
                const upcoming = allBookings
                    .filter(booking => {
                        const bookingDate = new Date(booking.serviceDateTime);
                        return bookingDate > new Date() && booking.status !== 'CANCELLED';
                    })
                    .sort((a, b) => new Date(a.serviceDateTime) - new Date(b.serviceDateTime))
                    .slice(0, 7);

                setUpcomingBookings(upcoming);
            } catch (error) {
                console.error('Error fetching bookings:', error);
            }

        } catch (error) {
            console.error('Error fetching profile data:', error);
            toast.error('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageUpload = async () => {
        if (!selectedImage || !profile) return;

        try {
            setUploadingImage(true);
            const formData = {
                profileImage: selectedImage,
                firstName: personalInfo.firstName,
                lastName: personalInfo.lastName,
                email: personalInfo.email,
                phoneNumber: personalInfo.phone, // Backend expects phoneNumber
                bio: personalInfo.bio
            };

            const response = await clientApi.updateProfileWithImage(profile.id, formData);
            setProfile(response.data);
            toast.success('Profile image updated successfully!');
            setSelectedImage(null);
            // Keep the image preview with the new uploaded image
            if (response.data.profilePictureUrl) { // Backend uses profilePictureUrl
                setImagePreview(getImageUrl(response.data.profilePictureUrl));
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Failed to upload image');
        } finally {
            setUploadingImage(false);
        }
    };

    const handlePersonalInfoUpdate = async (e) => {
        e.preventDefault();
        if (!profile) return;

        try {
            setUpdating(true);
            // Convert frontend field names to backend field names
            const updateData = {
                firstName: personalInfo.firstName,
                lastName: personalInfo.lastName,
                email: personalInfo.email,
                phoneNumber: personalInfo.phone, // Backend expects phoneNumber
                bio: personalInfo.bio
            };
            const response = await clientApi.updateProfile(profile.id, updateData);
            setProfile(response.data);
            toast.success('Personal information updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            const errorMessage = error.response?.data?.error || 'Failed to update profile';
            toast.error(errorMessage);
        } finally {
            setUpdating(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (!profile) return;

        if (passwordInfo.newPassword !== passwordInfo.confirmPassword) {
            toast.error('New passwords do not match!');
            return;
        }

        if (passwordInfo.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        try {
            setUpdating(true);
            await clientApi.changePassword(profile.id, {
                currentPassword: passwordInfo.currentPassword,
                newPassword: passwordInfo.newPassword
            });

            toast.success('Password updated successfully!');
            setPasswordInfo({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            console.error('Error updating password:', error);
            const errorMessage = error.response?.data?.error || 'Failed to update password';
            toast.error(errorMessage);
        } finally {
            setUpdating(false);
        }
    };



    const getStatusColor = (status) => {
        switch (status) {
            case 'ACCEPTED':
                return 'bg-green-100 text-green-800';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800';
            case 'COMPLETED':
                return 'bg-blue-100 text-blue-800';
            case 'REJECTED':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'ACCEPTED':
                return <CheckCircle className="h-4 w-4" />;
            case 'PENDING':
                return <Clock className="h-4 w-4" />;
            case 'CANCELLED':
                return <XCircle className="h-4 w-4" />;
            case 'COMPLETED':
                return <CheckCircle className="h-4 w-4" />;
            case 'REJECTED':
                return <XCircle className="h-4 w-4" />;
            default:
                return <Clock className="h-4 w-4" />;
        }
    };

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return 'Not set';
        const date = new Date(dateTimeString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return profilePictureUrl(url);
    };

    const getMembershipStatus = () => {
        if (!membership || membership.remainingDays === null) {
            return { status: 'No Membership', color: 'bg-gray-500', text: 'No active membership' };
        }

        const days = membership.remainingDays;
        if (days < 0) {
            return { status: 'Expired', color: 'bg-red-500', text: 'Membership has expired' };
        } else if (days <= 7) {
            return { status: 'Expiring Soon', color: 'bg-orange-500', text: `Expires in ${days} days` };
        } else if (days <= 30) {
            return { status: 'Active', color: 'bg-yellow-500', text: `Expires in ${days} days` };
        } else {
            return { status: 'Active', color: 'bg-green-500', text: `Expires in ${days} days` };
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin text-[#c53445]" />
                    <span className="text-lg text-gray-600">Loading profile...</span>
                </div>
            </div>
        );
    }

    const membershipStatus = getMembershipStatus();

    return (
        <div className="space-y-8">
            {/* Greeting */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">
                    Welcome back, {profile?.firstName || 'User'}!
                </h1>
                <p className="text-gray-600 mt-2">Manage your profile and membership</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                    {/* Membership Status Card */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Membership Status</h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xl font-bold text-gray-900">
                                        {profile?.membership?.type || 'Standard'} Membership
                                    </p>
                                    {profile?.membership?.endDate && (
                                        <p className="text-gray-600">
                                            Expires: {new Date(profile.membership.endDate).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                                <span className={`${membershipStatus.color} text-white px-3 py-1 rounded-full text-sm font-medium`}>
                                    {membershipStatus.status}
                                </span>
                            </div>
                            <p className="text-gray-500 text-sm">{membershipStatus.text}</p>
                            {profile?.membership?.price && (
                                <p className="text-sm text-gray-600">
                                    Price: MAD {profile.membership.price}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Upcoming Bookings */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Upcoming Bookings</h2>
                            <span className="text-sm text-gray-500">{upcomingBookings.length} upcoming</span>
                        </div>
                        <div className="space-y-3">
                            {upcomingBookings.length > 0 ? (
                                upcomingBookings.map((booking) => (
                                    <div key={booking.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">
                                                {booking.coach?.firstName} {booking.coach?.lastName}
                                            </p>
                                            <p className="text-sm text-gray-600">{booking.sessionType || 'Session'}</p>
                                            <p className="text-sm text-gray-500">{formatDateTime(booking.serviceDateTime)}</p>
                                        </div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                            {getStatusIcon(booking.status)}
                                            <span className="ml-1">{booking.status}</span>
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4">
                                    <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-500 text-sm">No upcoming bookings</p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => navigate('/dashboard/bookings')}
                            className="mt-4 w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            View All Bookings
                        </button>
                    </div>
                </div>

                {/* Right Column - Profile Settings */}
                <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-2">Profile Settings</h2>
                        <p className="text-gray-600 mb-6">Manage your personal information and account settings.</p>

                        {/* Profile Photo */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-900 mb-3">Profile Photo</label>
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    {imagePreview ? (
                                        <img
                                            src={imagePreview}
                                            alt="Profile"
                                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                                            <User className="text-gray-600 text-xl" />
                                        </div>
                                    )}
                                    {uploadingImage && (
                                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                            <Loader2 className="h-6 w-6 animate-spin text-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col space-y-2">
                                    <label className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 cursor-pointer">
                                        <Camera className="h-4 w-4" />
                                        <span>{imagePreview ? 'Change Photo' : 'Upload Photo'}</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </label>
                                    {selectedImage && (
                                        <button
                                            onClick={handleImageUpload}
                                            disabled={uploadingImage}
                                            className="bg-[#c53445] text-white px-4 py-2 rounded-lg hover:bg-[#b02e3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                        >
                                            {uploadingImage && <Loader2 className="h-4 w-4 animate-spin" />}
                                            <span>{uploadingImage ? 'Uploading...' : 'Save Photo'}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                            {imagePreview && !selectedImage && (
                                <p className="text-xs text-gray-500 mt-2">Current profile photo is displayed</p>
                            )}
                        </div>

                        {/* Personal Information */}
                        <div className="mb-6">
                            <h3 className="text-md font-medium text-gray-900 mb-4">Personal Information</h3>
                            <form onSubmit={handlePersonalInfoUpdate} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                        <input
                                            type="text"
                                            value={personalInfo.firstName}
                                            onChange={(e) => setPersonalInfo({ ...personalInfo, firstName: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                        <input
                                            type="text"
                                            value={personalInfo.lastName}
                                            onChange={(e) => setPersonalInfo({ ...personalInfo, lastName: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={personalInfo.email}
                                        onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={personalInfo.phone}
                                        onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                                    <textarea
                                        value={personalInfo.bio}
                                        onChange={(e) => setPersonalInfo({ ...personalInfo, bio: e.target.value })}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                        placeholder="Tell us about yourself..."
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="bg-[#c53445] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#b02e3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                >
                                    {updating && <Loader2 className="h-4 w-4 animate-spin" />}
                                    <span>{updating ? 'Updating...' : 'Update Personal Info'}</span>
                                </button>
                            </form>
                        </div>

                        {/* Password Management */}
                        <div className="mb-6">
                            <h3 className="text-md font-medium text-gray-900 mb-4">Password Management</h3>
                            <form onSubmit={handlePasswordUpdate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                    <input
                                        type="password"
                                        value={passwordInfo.currentPassword}
                                        onChange={(e) => setPasswordInfo({ ...passwordInfo, currentPassword: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                    <input
                                        type="password"
                                        value={passwordInfo.newPassword}
                                        onChange={(e) => setPasswordInfo({ ...passwordInfo, newPassword: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={passwordInfo.confirmPassword}
                                        onChange={(e) => setPasswordInfo({ ...passwordInfo, confirmPassword: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="bg-[#c53445] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#b02e3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                >
                                    {updating && <Loader2 className="h-4 w-4 animate-spin" />}
                                    <span>{updating ? 'Updating...' : 'Update Password'}</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientProfile;
