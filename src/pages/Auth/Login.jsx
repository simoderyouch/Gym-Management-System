import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/authApi';

const schema = yup.object({
    email: yup.string().email('Please enter a valid email').required('Email is required'),
    password: yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
}).required();

const Login = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/dashboard';

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
    });

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            // Use real authentication from AuthContext
            const result = await login({
                email: data.email,
                password: data.password
            });

            toast.success(`Welcome back, ${result.user.name}!`);

            // Redirect based on role
            if (result.user.role === 'CLIENT' || result.user.role === 'client') {
                navigate('/dashboard');
            } else if (result.user.role === 'COACH' || result.user.role === 'coach') {
                navigate('/coach-dashboard');
            } else if (result.user.role === 'ADMIN' || result.user.role === 'admin') {
                navigate('/admin-dashboard');
            } else {
                // Default to client dashboard
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Login error:', error);
            const errorMessage = error.response?.data?.error || 'Login failed. Please try again.';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="bg-white rounded-lg shadow-md p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-sm font-bold text-gray-900 mb-1">
                            Welcome to
                        </h2>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            ApexFit
                        </h1>
                        <p className="text-sm text-gray-600">
                            Log in to your account
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                                Email
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

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                {...register('password')}
                                placeholder="••••••••••"
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent ${errors.password ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Forgot Password Link */}
                        <div className="text-right">
                            <Link
                                to="/resetpass"
                                className="text-sm text-[#c53445] hover:text-[#b02e3d] transition-colors"
                            >
                                Forgot Password?
                            </Link>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#c53445] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#b02e3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>

                    {/* Sign Up Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link
                                to="/signup"
                                className="text-[#c53445] hover:text-[#b02e3d] font-medium transition-colors"
                            >
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
