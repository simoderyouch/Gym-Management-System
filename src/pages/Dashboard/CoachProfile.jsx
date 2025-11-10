import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { coachApi } from '../../services/api.js';
import { Loader2, User, Camera, Save, X, Eye, EyeOff } from 'lucide-react';
import { profilePictureUrl } from '../../config/paths';

const CoachProfile = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const [profileData, setProfileData] = useState({
        id: null,
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        bio: '',
        specialties: '',
        certifications: '',
        services: '',
        acceptNewClients: true,
        active: true
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Load coach profile data
    const loadProfile = async () => {
        try {
            setLoading(true);
            const response = await coachApi.getMyProfile();
            const coachData = response.data;

            setProfileData({
                id: coachData.id,
                firstName: coachData.firstName || '',
                lastName: coachData.lastName || '',
                email: coachData.email || '',
                phoneNumber: coachData.phoneNumber || '',
                bio: coachData.bio || '',
                specialties: coachData.specialties || '',
                certifications: coachData.certifications || '',
                services: coachData.services || '',
                acceptNewClients: coachData.acceptNewClients !== undefined ? coachData.acceptNewClients : true,
                active: coachData.active !== undefined ? coachData.active : true
            });

            // Set image preview if profile picture exists
            if (coachData.profilePictureUrl) {
                setImagePreview(getImageUrl(coachData.profilePictureUrl));
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            toast.error('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    // Get image URL helper
    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return profilePictureUrl(url);
    };

    // Handle image selection
    const handleImageSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error('Image size should be less than 5MB');
                return;
            }

            setSelectedImage(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle profile data changes
    const handleInputChange = (field, value) => {
        setProfileData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle password data changes
    const handlePasswordChange = (field, value) => {
        setPasswordData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Save profile changes
    const handleSaveProfile = async () => {
        try {
            setSaving(true);

            // Remove the id from the update data as it's not needed for the update
            const { id, ...updateData } = profileData;

            if (selectedImage) {
                // If there's an image, use the multipart endpoint
                updateData.profileImage = selectedImage;
                await coachApi.updateProfileWithImage(profileData.id, updateData);
            } else {
                // If no image, use the regular JSON endpoint
                await coachApi.updateProfile(profileData.id, updateData);
            }
            toast.success('Profile updated successfully!');

            // Clear selected image after successful update
            setSelectedImage(null);

            // Reload profile to get updated data
            await loadProfile();
        } catch (error) {
            console.error('Error updating profile:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Failed to update profile';
            toast.error(`Failed to update profile: ${errorMessage}`);
        } finally {
            setSaving(false);
        }
    };

    // Change password
    const handleChangePassword = async () => {
        // Validate passwords
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('New password must be at least 6 characters long');
            return;
        }

        try {
            setChangingPassword(true);
            await coachApi.changePassword(profileData.id, {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            toast.success('Password changed successfully!');

            // Clear password fields
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            console.error('Error changing password:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Failed to change password';
            toast.error(`Failed to change password: ${errorMessage}`);
        } finally {
            setChangingPassword(false);
        }
    };

    // Load profile on component mount
    useEffect(() => {
        if (user?.token) {
            loadProfile();
        }
    }, [user]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[#c53445]" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
                <p className="text-gray-600 mt-2">Manage your profile information and settings.</p>
            </div>

            {/* Profile Photo Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Photo</h2>

                <div className="flex items-center space-x-6">
                    <div className="relative">
                        <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                            {imagePreview ? (
                                <img
                                    src={imagePreview}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User className="w-12 h-12 text-gray-600" />
                            )}
                        </div>
                        <label className="absolute bottom-0 right-0 bg-[#c53445] text-white p-2 rounded-full cursor-pointer hover:bg-[#b02e3d] transition-colors">
                            <Camera className="w-4 h-4" />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                            />
                        </label>
                    </div>

                    <div>
                        <h3 className="font-medium text-gray-900">Update Profile Photo</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Upload a new profile photo. JPG, PNG or GIF up to 5MB.
                        </p>
                        {selectedImage && (
                            <button
                                onClick={() => {
                                    setSelectedImage(null);
                                    setImagePreview(getImageUrl(profileData.profilePictureUrl));
                                }}
                                className="text-red-600 text-sm mt-2 hover:text-red-800"
                            >
                                Remove selected image
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Basic Information Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                        <input
                            type="text"
                            value={profileData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                        <input
                            type="text"
                            value={profileData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                            type="email"
                            value={profileData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <input
                            type="tel"
                            value={profileData.phoneNumber}
                            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Professional Information Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Professional Information</h2>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bio <span className="text-sm text-gray-500">({profileData.bio?.length || 0}/1000 characters)</span>
                        </label>
                        <textarea
                            value={profileData.bio}
                            onChange={(e) => handleInputChange('bio', e.target.value)}
                            maxLength={1000}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent resize-none"
                            placeholder="Tell clients about yourself and your coaching philosophy..."
                        />
                        {profileData.bio && profileData.bio.length > 900 && (
                            <p className={`text-sm mt-1 ${profileData.bio.length >= 1000 ? 'text-red-500' : 'text-yellow-600'}`}>
                                {1000 - profileData.bio.length} characters remaining
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Specialties (comma-separated)</label>
                        <input
                            type="text"
                            value={profileData.specialties}
                            onChange={(e) => handleInputChange('specialties', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                            placeholder="e.g., Strength Training, Nutrition, Weight Loss"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Certifications (comma-separated)</label>
                        <input
                            type="text"
                            value={profileData.certifications}
                            onChange={(e) => handleInputChange('certifications', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                            placeholder="e.g., NASM CPT, Precision Nutrition Level 1"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Services Offered (comma-separated)</label>
                        <input
                            type="text"
                            value={profileData.services}
                            onChange={(e) => handleInputChange('services', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                            placeholder="e.g., Personal Training, Group Classes, Nutrition Coaching"
                        />
                    </div>
                </div>
            </div>

            {/* Availability Settings Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Availability Settings</h2>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-gray-900">Accept New Clients</h3>
                            <p className="text-sm text-gray-600">Allow new clients to book sessions with you</p>
                        </div>
                        <button
                            onClick={() => handleInputChange('acceptNewClients', !profileData.acceptNewClients)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${profileData.acceptNewClients ? 'bg-[#c53445]' : 'bg-gray-200'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${profileData.acceptNewClients ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-gray-900">Active Status</h3>
                            <p className="text-sm text-gray-600">Make your profile visible to clients</p>
                        </div>
                        <button
                            onClick={() => handleInputChange('active', !profileData.active)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${profileData.active ? 'bg-[#c53445]' : 'bg-gray-200'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${profileData.active ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* Password Change Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Change Password</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={passwordData.currentPassword}
                                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                value={passwordData.newPassword}
                                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                {showNewPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={passwordData.confirmPassword}
                                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleChangePassword}
                        disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                        className="px-4 py-2 bg-[#c53445] text-white rounded-lg font-medium hover:bg-[#b02e3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {changingPassword ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                                Changing Password...
                            </>
                        ) : (
                            'Change Password'
                        )}
                    </button>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
                <button
                    onClick={loadProfile}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                    Reset
                </button>
                <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-6 py-2 bg-[#c53445] text-white rounded-lg font-medium hover:bg-[#b02e3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                            Saving...
                        </>
                    ) : (
                        'Save Changes'
                    )}
                </button>
            </div>
        </div>
    );
};

export default CoachProfile;
