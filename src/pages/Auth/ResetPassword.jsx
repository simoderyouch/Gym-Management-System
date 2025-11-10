import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { authApi } from '../../services/authApi';

const emailSchema = yup.object({
    email: yup.string().email('Please enter a valid email').required('Email is required'),
}).required();

const codeSchema = yup.object({
    code: yup.string().required('Verification code is required').min(6, 'Code must be 6 digits'),
}).required();

const ResetPassword = () => {
    const [step, setStep] = useState(1); // 1: Email, 2: Verification Code
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const emailForm = useForm({
        resolver: yupResolver(emailSchema),
    });

    const codeForm = useForm({
        resolver: yupResolver(codeSchema),
    });

    const onEmailSubmit = async (data) => {
        setIsLoading(true);
        try {
            await authApi.requestPasswordReset(data.email);
            setEmail(data.email);
            setStep(2);
            toast.success('Verification code sent to your email!');
        } catch (error) {
            console.error('Request reset error:', error);
            const errorMessage = error.response?.data?.error || 'Failed to send verification code. Please try again.';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const onCodeSubmit = async (data) => {
        setIsLoading(true);
        try {
            await authApi.verifyResetCode(email, data.code);
            toast.success('Password reset successfully! Check your email for the new password.');
            navigate('/login');
        } catch (error) {
            console.error('Verify code error:', error);
            const errorMessage = error.response?.data?.error || 'Invalid verification code. Please try again.';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const goBackToEmail = () => {
        setStep(1);
        setEmail('');
        codeForm.reset();
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="bg-white rounded-lg shadow-md p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-sm font-bold text-gray-900 mb-1">
                            Reset Password
                        </h2>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            ApexFit
                        </h1>
                        <p className="text-sm text-gray-600">
                            {step === 1
                                ? 'Enter your email to receive a verification code'
                                : 'Enter the verification code sent to your email'
                            }
                        </p>
                    </div>

                    {/* Step 1: Email Form */}
                    {step === 1 && (
                        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    {...emailForm.register('email')}
                                    placeholder="your.email@example.com"
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent ${emailForm.formState.errors.email ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {emailForm.formState.errors.email && (
                                    <p className="mt-1 text-sm text-red-600">{emailForm.formState.errors.email.message}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#c53445] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#b02e3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Sending Code...' : 'Send Verification Code'}
                            </button>
                        </form>
                    )}

                    {/* Step 2: Verification Code Form */}
                    {step === 2 && (
                        <form onSubmit={codeForm.handleSubmit(onCodeSubmit)} className="space-y-6">
                            <div className="text-center mb-4">
                                <p className="text-sm text-gray-600">
                                    Verification code sent to:
                                </p>
                                <p className="text-sm font-medium text-gray-900">{email}</p>
                            </div>

                            <div>
                                <label htmlFor="code" className="block text-sm font-medium text-gray-900 mb-2">
                                    Verification Code
                                </label>
                                <input
                                    id="code"
                                    type="text"
                                    maxLength="6"
                                    {...codeForm.register('code')}
                                    placeholder="Enter 6-digit code"
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent text-center text-lg tracking-widest ${codeForm.formState.errors.code ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {codeForm.formState.errors.code && (
                                    <p className="mt-1 text-sm text-red-600">{codeForm.formState.errors.code.message}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#c53445] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#b02e3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Verifying...' : 'Verify Code & Reset Password'}
                            </button>

                            <button
                                type="button"
                                onClick={goBackToEmail}
                                disabled={isLoading}
                                className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Back to Email
                            </button>
                        </form>
                    )}

                    {/* Back to Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Remember your password?{' '}
                            <Link
                                to="/login"
                                className="text-[#c53445] hover:text-[#b02e3d] font-medium transition-colors"
                            >
                                Back to Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
