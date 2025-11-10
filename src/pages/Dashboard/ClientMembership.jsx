import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    Calendar,
    Clock,
    CreditCard,
    Loader2,
    AlertCircle,
    CheckCircle,
    XCircle,
    RefreshCw,
    TrendingUp,
    DollarSign
} from 'lucide-react';
import { clientApi } from '../../services/api';

const ClientMembership = () => {
    const [profile, setProfile] = useState(null);
    const [membership, setMembership] = useState(null);
    const [loading, setLoading] = useState(true);
    const [renewing, setRenewing] = useState(false);

    useEffect(() => {
        fetchMembershipData();
    }, []);

    const fetchMembershipData = async () => {
        try {
            setLoading(true);

            // Fetch profile data (includes membership info)
            const profileResponse = await clientApi.getMyProfile();
            const profileData = profileResponse.data;
            setProfile(profileData);

            // Fetch membership remaining days
            try {
                const membershipResponse = await clientApi.getMembershipRemainingDays();
                setMembership(membershipResponse.data);
            } catch (error) {
                console.log('No membership data available');
            }

        } catch (error) {
            console.error('Error fetching membership data:', error);
            toast.error('Failed to load membership data');
        } finally {
            setLoading(false);
        }
    };

    const handleRenewMembership = async () => {
        if (window.confirm('Would you like to renew your membership? Please contact the gym administration for renewal options.')) {
            toast.info('Please contact the gym administration to renew your membership.');
        }
    };

    const getMembershipStatus = () => {
        if (!membership || membership.remainingDays === null) {
            return {
                status: 'No Membership',
                color: 'bg-gray-500',
                text: 'No active membership',
                icon: <XCircle className="h-5 w-5" />
            };
        }

        const days = membership.remainingDays;
        if (days < 0) {
            return {
                status: 'Expired',
                color: 'bg-red-500',
                text: 'Membership has expired',
                icon: <XCircle className="h-5 w-5" />
            };
        } else if (days <= 7) {
            return {
                status: 'Expiring Soon',
                color: 'bg-orange-500',
                text: `Expires in ${days} days`,
                icon: <AlertCircle className="h-5 w-5" />
            };
        } else if (days <= 30) {
            return {
                status: 'Active',
                color: 'bg-yellow-500',
                text: `Expires in ${days} days`,
                icon: <Clock className="h-5 w-5" />
            };
        } else {
            return {
                status: 'Active',
                color: 'bg-green-500',
                text: `Expires in ${days} days`,
                icon: <CheckCircle className="h-5 w-5" />
            };
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin text-[#c53445]" />
                    <span className="text-lg text-gray-600">Loading membership...</span>
                </div>
            </div>
        );
    }

    const membershipStatus = getMembershipStatus();

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Membership</h1>
                <p className="text-gray-600 mt-2">Manage your gym membership and subscription</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Current Membership */}
                <div className="space-y-6">
                    {/* Current Membership Status */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Current Membership</h2>
                            <button
                                onClick={fetchMembershipData}
                                disabled={loading}
                                className="text-[#c53445] hover:text-[#b02e3d] transition-colors"
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Status Badge */}
                            <div className="flex items-center space-x-3">
                                <span className={`${membershipStatus.color} text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1`}>
                                    {membershipStatus.icon}
                                    <span>{membershipStatus.status}</span>
                                </span>
                            </div>

                            {/* Membership Details */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Membership Type:</span>
                                    <span className="font-medium text-gray-900">
                                        {profile?.membership?.type || 'Standard'}
                                    </span>
                                </div>

                                {profile?.membership?.startDate && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Start Date:</span>
                                        <span className="font-medium text-gray-900">
                                            {formatDate(profile.membership.startDate)}
                                        </span>
                                    </div>
                                )}

                                {profile?.membership?.endDate && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">End Date:</span>
                                        <span className="font-medium text-gray-900">
                                            {formatDate(profile.membership.endDate)}
                                        </span>
                                    </div>
                                )}

                                {profile?.membership?.price && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Price:</span>
                                        <span className="font-medium text-gray-900">
                                            ${profile.membership.price}
                                        </span>
                                    </div>
                                )}

                                {membership?.remainingDays !== null && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Remaining Days:</span>
                                        <span className={`font-medium ${membership.remainingDays < 0 ? 'text-red-600' : membership.remainingDays <= 7 ? 'text-orange-600' : 'text-green-600'}`}>
                                            {membership.remainingDays < 0 ? 'Expired' : `${membership.remainingDays} days`}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Status Message */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm text-gray-700">{membershipStatus.text}</p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-3">
                                <button
                                    onClick={handleRenewMembership}
                                    disabled={renewing}
                                    className="flex-1 bg-[#c53445] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#b02e3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                >
                                    {renewing && <Loader2 className="h-4 w-4 animate-spin" />}
                                    <span>{renewing ? 'Processing...' : 'Renew Membership'}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Membership Benefits */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Membership Benefits</h2>
                        <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <span className="text-gray-700">Access to all gym facilities</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <span className="text-gray-700">Group fitness classes</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <span className="text-gray-700">Personal training sessions</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <span className="text-gray-700">Locker room access</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <span className="text-gray-700">Fitness assessment</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <span className="text-gray-700">Nutrition consultation</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Membership Info & History */}
                <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Membership Overview</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <div className="flex items-center justify-center mb-2">
                                    <Calendar className="h-6 w-6 text-blue-500" />
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {profile?.membership?.startDate ?
                                        Math.ceil((new Date() - new Date(profile.membership.startDate)) / (1000 * 60 * 60 * 24)) : 0}
                                </p>
                                <p className="text-sm text-gray-600">Days as Member</p>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <div className="flex items-center justify-center mb-2">
                                    <TrendingUp className="h-6 w-6 text-green-500" />
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {membership?.remainingDays > 0 ? membership.remainingDays : 0}
                                </p>
                                <p className="text-sm text-gray-600">Days Remaining</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Information */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Information</h2>
                        <div className="space-y-3">
                            {profile?.membership?.price ? (
                                <>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Last Payment:</span>
                                        <span className="font-medium text-gray-900">
                                            {formatDate(profile.membership.startDate)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Amount Paid:</span>
                                        <span className="font-medium text-gray-900">
                                            ${profile.membership.price}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Next Payment:</span>
                                        <span className="font-medium text-gray-900">
                                            {profile.membership.endDate ? formatDate(profile.membership.endDate) : 'Not scheduled'}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-4">
                                    <DollarSign className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-500 text-sm">No payment information available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Need Help?</h2>
                        <div className="space-y-3">
                            <p className="text-gray-600 text-sm">
                                For membership inquiries, renewals, or any questions about your account, please contact our support team.
                            </p>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <span className="text-gray-600 text-sm">Email:</span>
                                    <span className="text-sm font-medium">support@gym.com</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-gray-600 text-sm">Phone:</span>
                                    <span className="text-sm font-medium">+1 (555) 123-4567</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-gray-600 text-sm">Hours:</span>
                                    <span className="text-sm font-medium">Mon-Fri: 8AM-8PM</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientMembership;
