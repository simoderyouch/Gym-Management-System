import { Bar, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const AdminMainDashboard = () => {
    const [summary, setSummary] = useState(null);
    const [monthlyData, setMonthlyData] = useState([]);
    const [coachMetrics, setCoachMetrics] = useState(null);
    const [expiringMemberships, setExpiringMemberships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const navigate = useNavigate();

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [summaryRes, monthlyRes, coachRes, expiringRes] = await Promise.all([
                adminApi.getSummary(),
                adminApi.getMonthlyOverview(selectedYear),
                adminApi.getCoachMetrics(),
                adminApi.getExpiringMemberships()
            ]);

            setSummary(summaryRes.data);
            setMonthlyData(monthlyRes.data);
            setCoachMetrics(coachRes.data);
            setExpiringMemberships(expiringRes.data || []);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [selectedYear]);
    const kpis = [
        {
            title: 'Total Clients',
            value: summary?.totalClients || '0',
            sub: 'Active registered clients',
            icon: 'fas fa-users'
        },
        {
            title: 'Total Coaches',
            value: summary?.totalCoaches || '0',
            sub: `${coachMetrics?.newCoachesThisMonth || 0} new this month`,
            icon: 'fas fa-user-tie'
        },
        {
            title: 'Active Memberships',
            value: summary?.activeMemberships || '0',
            sub: 'Current valid memberships',
            icon: 'fas fa-id-card'
        },
        {
            title: 'Revenue This Month',
            value: `MAD ${(summary?.revenueThisMonth || 0).toLocaleString()}`,
            sub: 'Monthly revenue',
            icon: 'fas fa-dollar-sign'
        },
    ];

    const barData = {
        labels: monthlyData.map(item => {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return monthNames[item.month - 1];
        }),
        datasets: [
            {
                label: 'New Sign-ups',
                data: monthlyData.map(item => item.newClients),
                backgroundColor: '#c53445',
                borderRadius: 6,
            },
        ],
    };
    const barOptions = { responsive: true, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true } } };

    const lineData = {
        labels: monthlyData.map(item => {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return monthNames[item.month - 1];
        }),
        datasets: [
            {
                label: 'Revenue',
                data: monthlyData.map(item => item.revenue),
                borderColor: '#c53445',
                backgroundColor: 'rgba(197,52,69,0.08)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: '#c53445',
            },
        ],
    };
    const lineOptions = { responsive: true, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: false } } };

    const quickActions = [
        {
            icon: 'fas fa-user-plus',
            label: 'Add New Client',
            action: () => navigate('/admin-dashboard/manage-clients')
        },
        {
            icon: 'fas fa-bullhorn',
            label: 'Create Announcement',
            action: () => navigate('/admin-dashboard/announcements')
        },
        {
            icon: 'fas fa-dumbbell',
            label: 'Manage Equipment',
            action: () => navigate('/admin-dashboard/equipment')
        },
        {
            icon: 'fas fa-building',
            label: 'Manage Gyms',
            action: () => navigate('/admin-dashboard/manage-gyms')
        },
        {
            icon: 'fas fa-plus-square',
            label: 'Add New Product',
            action: () => navigate('/admin-dashboard/shop-products')
        },
    ];

    const handleRenewMembership = async (clientId) => {
        try {
            // Navigate to manage clients page with focus on this client
            navigate(`/admin-dashboard/manage-clients?clientId=${clientId}`);
            toast.info('Redirecting to client management for renewal');
        } catch (error) {
            console.error('Error handling membership renewal:', error);
            toast.error('Failed to process renewal request');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c53445]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {kpis.map((kpi) => (
                    <div key={kpi.title} className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">{kpi.title}</p>
                                <p className="text-2xl font-bold text-gray-900 mt-2">{kpi.value}</p>
                                <p className="text-xs text-gray-500 mt-1">{kpi.sub}</p>
                            </div>
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                <i className={`${kpi.icon} text-gray-600`}></i>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Expiration Notifications */}
                <div className="bg-white rounded-lg shadow-sm border p-6 lg:col-span-2">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                        <i className="fas fa-bell text-[#c53445]"></i>
                        <span>Client Expiration Notifications</span>
                    </h2>
                    <div className="space-y-3">
                        {expiringMemberships.length > 0 ? (
                            expiringMemberships.map((client, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
                                    <div>
                                        <p className="font-medium text-gray-900">{client.firstName} {client.lastName}</p>
                                        <p className="text-xs text-gray-600">
                                            Membership expires on <span className="px-2 py-1 bg-gray-200 rounded">{client.expiryDate}</span>
                                            {client.daysUntilExpiry === 0 && (
                                                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">Expires Today</span>
                                            )}
                                            {client.daysUntilExpiry === 1 && (
                                                <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">Expires Tomorrow</span>
                                            )}
                                            {client.daysUntilExpiry > 1 && (
                                                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">In {client.daysUntilExpiry} days</span>
                                            )}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleRenewMembership(client.id)}
                                        className="px-3 py-1 bg-[#c53445] text-white rounded hover:bg-[#b02e3d] text-sm transition-colors"
                                    >
                                        Renew Now
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <i className="fas fa-check-circle text-2xl mb-2"></i>
                                <p>No memberships expiring soon</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                        <i className="fas fa-bolt text-[#c53445]"></i>
                        <span>Quick Actions</span>
                    </h2>
                    <div className="space-y-3">
                        {quickActions.map((action) => (
                            <button
                                key={action.label}
                                onClick={action.action}
                                className="w-full flex items-center justify-between border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
                            >
                                <span className="flex items-center space-x-3 text-gray-700">
                                    <i className={`${action.icon}`}></i>
                                    <span>{action.label}</span>
                                </span>
                                <i className="fas fa-chevron-right text-gray-400"></i>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-gray-900">Analytics Overview</h2>
                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700">Year:</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="px-3 py-1 border rounded-lg text-sm focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                        >
                            {Array.from({ length: 5 }, (_, i) => {
                                const year = new Date().getFullYear() - i;
                                return (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-3">New Client Sign-ups ({selectedYear})</h3>
                        <Bar data={barData} options={barOptions} height={200} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Revenue Trends ({selectedYear})</h3>
                        <Line data={lineData} options={lineOptions} height={200} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminMainDashboard;
