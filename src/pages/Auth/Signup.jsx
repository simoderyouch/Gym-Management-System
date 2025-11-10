import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { signupApi } from '../../services/signupApi';

const schema = yup.object({
    firstName: yup.string().required('First name is required').max(50, 'First name cannot exceed 50 characters'),
    lastName: yup.string().required('Last name is required').max(50, 'Last name cannot exceed 50 characters'),
    email: yup.string().email('Please enter a valid email').required('Email is required').max(100, 'Email cannot exceed 100 characters'),
    phone: yup.string().required('Phone number is required').matches(/^[+]?[0-9\s\-\(\)]{10,15}$/, 'Please provide a valid phone number'),
    bio: yup.string().max(1000, 'Bio cannot exceed 1000 characters'),
}).required();

const Signup = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
    });

    const bioValue = watch('bio', '');
    const bioLength = bioValue ? bioValue.length : 0;

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            await signupApi.createSignupRequest(data);
            setIsSubmitted(true);
            toast.success('Signup request submitted successfully!');
        } catch (error) {
            console.error('Signup error:', error);
            const errorMessage = error.response?.data?.error || 'Failed to submit signup request. Please try again.';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        {/* Success Icon */}
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                            <i className="fas fa-check text-2xl text-green-600"></i>
                        </div>

                        {/* Header */}
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                Request Submitted!
                            </h1>
                            <p className="text-gray-600">
                                Your signup request has been submitted successfully.
                            </p>
                        </div>

                        {/* Message */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <p className="text-blue-800 text-sm">
                                <strong>What's next?</strong><br />
                                Please wait for an admin to review and approve your request.
                                You will receive an email with your login credentials once approved.
                            </p>
                        </div>

                        {/* Back to Login */}
                        <div className="space-y-4">
                            <Link
                                to="/login"
                                className="w-full bg-[#c53445] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#b02e3d] transition-colors inline-block"
                            >
                                Back to Login
                            </Link>
                            <Link
                                to="/"
                                className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors inline-block"
                            >
                                Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl w-full space-y-8">
                <div className="bg-white rounded-lg shadow-md p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-sm font-bold text-gray-900 mb-1">
                            Join
                        </h2>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            ApexFit
                        </h1>
                        <p className="text-sm text-gray-600">
                            Create your account and wait for admin approval
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Name Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-900 mb-2">
                                    First Name
                                </label>
                                <input
                                    id="firstName"
                                    type="text"
                                    {...register('firstName')}
                                    placeholder="Enter your first name"
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent ${errors.firstName ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {errors.firstName && (
                                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-900 mb-2">
                                    Last Name
                                </label>
                                <input
                                    id="lastName"
                                    type="text"
                                    {...register('lastName')}
                                    placeholder="Enter your last name"
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent ${errors.lastName ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {errors.lastName && (
                                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                {...register('email')}
                                placeholder="your.email@example.com"
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Phone Field */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-900 mb-2">
                                Phone Number
                            </label>
                            <input
                                id="phone"
                                type="tel"
                                {...register('phone')}
                                placeholder="Enter your phone number"
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent ${errors.phone ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {errors.phone && (
                                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                            )}
                        </div>

                        {/* Bio Field */}
                        <div>
                            <label htmlFor="bio" className="block text-sm font-medium text-gray-900 mb-2">
                                Bio (Optional)
                            </label>
                            <textarea
                                id="bio"
                                {...register('bio')}
                                rows={4}
                                maxLength={1000}
                                placeholder="Tell us a bit about yourself..."
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent ${errors.bio ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            <div className="flex justify-between items-center mt-1">
                                {errors.bio ? (
                                    <p className="text-sm text-red-600">{errors.bio.message}</p>
                                ) : (
                                    <div></div>
                                )}
                                <p className={`text-sm ${bioLength > 900 ? 'text-red-600' :
                                        bioLength > 800 ? 'text-yellow-600' : 'text-gray-500'
                                    }`}>
                                    {bioLength}/1000
                                </p>
                            </div>
                        </div>

                        {/* Info Message */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex">
                                <i className="fas fa-info-circle text-yellow-400 mt-0.5 mr-3"></i>
                                <div>
                                    <h3 className="text-sm font-medium text-yellow-800">
                                        Admin Approval Required
                                    </h3>
                                    <div className="mt-2 text-sm text-yellow-700">
                                        <p>
                                            After submitting this form, please wait for an admin to review and approve your request.
                                            You will receive an email with your login credentials once approved.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#c53445] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#b02e3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Submitting Request...' : 'Submit Signup Request'}
                        </button>
                    </form>

                    {/* Back to Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                className="text-[#c53445] hover:text-[#b02e3d] font-medium transition-colors"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
