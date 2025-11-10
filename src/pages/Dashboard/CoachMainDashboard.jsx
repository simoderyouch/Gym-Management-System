import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { coachApi } from '../../services/api.js';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const CoachMainDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        activeClients: 0,
        upcomingSessions: 0,
        averageRating: 0,
        totalReviews: 0,
        coachName: 'Coach',
        engagementData: {
            labels: [],
            data: []
        },
        recentActivity: []
    });

    const navigate = useNavigate();

    // Load dashboard data
    const loadDashboardData = async () => {
        try {
            setLoading(true);
            console.log('Loading dashboard data...');

            // Load active client count
            const activeClientsResponse = await coachApi.getActiveClientCount();
            console.log('Active clients response:', activeClientsResponse);
            // Handle different response structures
            let activeClients = 0;
            if (typeof activeClientsResponse.data === 'number') {
                activeClients = activeClientsResponse.data;
            } else if (activeClientsResponse.data && typeof activeClientsResponse.data === 'object') {
                // If it's an object, try to extract the value
                activeClients = activeClientsResponse.data.value || activeClientsResponse.data.count || activeClientsResponse.data.activeClients || 0;
            }
            console.log('Active clients:', activeClients);

            // Load upcoming sessions
            const upcomingSessionsResponse = await coachApi.getUpcomingSessions();
            console.log('Upcoming sessions response:', upcomingSessionsResponse);
            const upcomingSessions = upcomingSessionsResponse.data?.value?.length || upcomingSessionsResponse.data?.length || 0;
            console.log('Upcoming sessions count:', upcomingSessions);

            // Load engagement overview for chart
            const engagementResponse = await coachApi.getCompletedSessionsOverview(10);
            console.log('Completed sessions response:', engagementResponse);
            const engagementData = engagementResponse.data?.value || engagementResponse.data || [];
            console.log('Completed sessions data:', engagementData);

            // Load coach profile for rating and name
            const profileResponse = await coachApi.getMyProfile();
            const profile = profileResponse.data;
            console.log('Coach profile:', profile);

            // Generate recent activity based on real data
            const recentActivity = [];

            // Add activity based on upcoming sessions
            if (upcomingSessions > 0) {
                recentActivity.push({
                    type: 'session',
                    message: `${upcomingSessions} upcoming session${upcomingSessions > 1 ? 's' : ''} scheduled`,
                    color: 'blue',
                    icon: 'fas fa-calendar'
                });
            }

            // Add activity based on active clients
            if (activeClients > 0) {
                recentActivity.push({
                    type: 'client',
                    message: `${activeClients} active client${activeClients > 1 ? 's' : ''} in your roster`,
                    color: 'green',
                    icon: 'fas fa-users'
                });
            }

            // Add activity based on rating
            if (profile.averageRating && profile.averageRating > 0) {
                recentActivity.push({
                    type: 'rating',
                    message: `Average rating: ${profile.averageRating.toFixed(1)}/5 from ${profile.totalRatings || 0} reviews`,
                    color: 'orange',
                    icon: 'fas fa-star'
                });
            }

            // If no real activity, add placeholder
            if (recentActivity.length === 0) {
                recentActivity.push({
                    type: 'welcome',
                    message: 'Welcome to your coaching dashboard!',
                    color: 'green',
                    icon: 'fas fa-heart'
                });
            }

            setDashboardData({
                activeClients: Number(activeClients) || 0,
                upcomingSessions: Number(upcomingSessions) || 0,
                averageRating: Number(profile.averageRating) || 0,
                totalReviews: Number(profile.totalRatings) || 0,
                coachName: String(profile.firstName || 'Coach'),
                engagementData: {
                    labels: engagementData.map(item => {
                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        return `${monthNames[item.month - 1]} ${item.year}`;
                    }),
                    data: engagementData.map(item => item.count || item.sessionCount || 0)
                },
                recentActivity
            });
            console.log('Dashboard data set successfully');
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    // Load data on component mount
    useEffect(() => {
        console.log('CoachMainDashboard useEffect triggered');
        console.log('User state:', user);

        // If user is null/undefined, wait a bit and try again
        if (!user) {
            console.log('User not loaded yet, waiting...');
            const timer = setTimeout(() => {
                if (user?.token) {
                    console.log('User loaded, loading dashboard data');
                    loadDashboardData();
                }
            }, 1000);
            return () => clearTimeout(timer);
        }

        if (user?.token) {
            console.log('User has token, loading dashboard data');
            loadDashboardData();
        } else {
            console.log('No user token found');
        }
    }, [user?.token]);

    // Chart data configuration
    const chartData = {
        labels: dashboardData.engagementData.labels,
        datasets: [
            {
                label: 'Completed Sessions',
                data: dashboardData.engagementData.data,
                borderColor: '#c53445',
                backgroundColor: 'rgba(197, 52, 69, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#c53445',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        size: 12,
                    },
                },
            },
            title: {
                display: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                    font: {
                        size: 12,
                    },
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)',
                },
            },
            x: {
                ticks: {
                    font: {
                        size: 12,
                    },
                },
                grid: {
                    display: false,
                },
            },
        },
        elements: {
            point: {
                hoverBackgroundColor: '#c53445',
            },
        },
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[#c53445]" />
            </div>
        );
    }

    // Fallback if no data loaded
    if (!dashboardData.coachName || dashboardData.coachName === 'Coach') {
        return (
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Welcome to your Dashboard!</h1>
                        <p className="text-gray-600 mt-2">Loading your coaching data...</p>
                    </div>
                    <button
                        onClick={loadDashboardData}
                        className="px-4 py-2 bg-[#c53445] text-white rounded-lg font-medium hover:bg-[#b02e3d] transition-colors flex items-center space-x-2"
                    >
                        <i className="fas fa-sync-alt"></i>
                        <span>Refresh</span>
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <p className="text-center text-gray-500">Loading dashboard data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Greeting */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Good morning, {String(dashboardData.coachName || 'Coach')}!
                    </h1>
                    <p className="text-gray-600 mt-2">Here's what's happening with your coaching business today.</p>
                </div>
                <button
                    onClick={loadDashboardData}
                    className="px-4 py-2 bg-[#c53445] text-white rounded-lg font-medium hover:bg-[#b02e3d] transition-colors flex items-center space-x-2"
                >
                    <i className="fas fa-sync-alt"></i>
                    <span>Refresh</span>
                </button>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Active Clients */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Active Clients</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{String(dashboardData.activeClients || 0)}</p>
                            <p className="text-sm text-green-600 mt-1">Currently active</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <i className="fas fa-users text-blue-600 text-xl"></i>
                        </div>
                    </div>
                </div>

                {/* Upcoming Sessions */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Upcoming Sessions</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{String(dashboardData.upcomingSessions || 0)}</p>
                            <p className="text-sm text-gray-600 mt-1">scheduled sessions</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <i className="fas fa-calendar text-orange-600 text-xl"></i>
                        </div>
                    </div>
                </div>

                {/* Average Client Rating */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Avg. Client Rating</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{String((dashboardData.averageRating || 0).toFixed(1))} /5</p>
                            <p className="text-sm text-gray-600 mt-1">based on {String(dashboardData.totalReviews || 0)} reviews</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <i className="fas fa-star text-green-600 text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/coach-dashboard/bookings')}
                            className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center space-x-3">
                                <i className="fas fa-calendar-plus text-[#c53445]"></i>
                                <span className="font-medium">View Today's Sessions</span>
                            </div>
                        </button>
                        <button
                            onClick={() => navigate('/coach-dashboard/chat')}
                            className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center space-x-3">
                                <i className="fas fa-comments text-[#c53445]"></i>
                                <span className="font-medium">Check Messages</span>
                            </div>
                        </button>
                        <button
                            onClick={() => navigate('/coach-dashboard/clients')}
                            className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center space-x-3">
                                <i className="fas fa-users text-[#c53445]"></i>
                                <span className="font-medium">Manage Clients</span>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                        {dashboardData.recentActivity.map((activity, index) => (
                            <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                                <div className={`w-2 h-2 rounded-full ${activity.color}-500`}></div>
                                <span className="text-sm text-gray-600">
                                    {activity.message}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Client Engagement Overview Chart */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Completed Sessions Overview</h2>
                    <p className="text-gray-600 mt-1">Monthly completed session counts for the last 10 months.</p>
                </div>
                {dashboardData.engagementData.labels.length > 0 ? (
                    <div className="h-80">
                        <Line data={chartData} options={chartOptions} />
                    </div>
                ) : (
                    <div className="h-80 flex items-center justify-center text-gray-500">
                        <p>No completed sessions data available</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoachMainDashboard;
