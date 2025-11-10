import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { adminApi } from '../../services/adminApi';
import { Loader2, Search, Filter, Calendar, User, Clock, RefreshCw } from 'lucide-react';

const AdminBookingsOverview = () => {
    const [bookings, setBookings] = useState([]);
    const [summary, setSummary] = useState({
        total: 0,
        confirmed: 0,
        pending: 0,
        cancelled: 0
    });
    const [loading, setLoading] = useState(true);
    const [summaryLoading, setSummaryLoading] = useState(true);

    // Filter states
    const [filters, setFilters] = useState({
        status: '',
        from: '',
        to: '',
        coachName: '',
        clientName: ''
    });
    const [showFilters, setShowFilters] = useState(false);

    // Load bookings summary
    const loadSummary = async () => {
        try {
            setSummaryLoading(true);
            const response = await adminApi.getBookingsSummary();
            setSummary(response.data);
        } catch (error) {
            console.error('Error loading bookings summary:', error);
            toast.error('Failed to load bookings summary');
        } finally {
            setSummaryLoading(false);
        }
    };

    // Load bookings with filters
    const loadBookings = async () => {
        try {
            setLoading(true);
            const params = {};

            // Add filters to params
            if (filters.status) params.status = filters.status;
            if (filters.from) {
                // start of day ISO
                params.from = new Date(filters.from + 'T00:00:00').toISOString();
            }
            if (filters.to) {
                // end of day ISO
                params.to = new Date(filters.to + 'T23:59:59').toISOString();
            }
            if (filters.coachName) params.coachName = filters.coachName;
            if (filters.clientName) params.clientName = filters.clientName;

            const response = await adminApi.getBookings(params);
            setBookings(response.data);
        } catch (error) {
            console.error('Error loading bookings:', error);
            toast.error('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    // Apply filters
    const applyFilters = () => {
        loadBookings();
    };

    // Clear filters
    const clearFilters = () => {
        setFilters({
            status: '',
            from: '',
            to: '',
            coachName: '',
            clientName: ''
        });
        loadBookings();
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    // Format time for display
    const formatTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Get status class for styling
    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'accepted':
            case 'confirmed':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'rejected':
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            case 'completed':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Load data on component mount
    useEffect(() => {
        loadSummary();
        loadBookings();
    }, []);

    // Reload when filters change
    useEffect(() => {
        loadBookings();
    }, [filters]);

    return (
        <div className="max-w-full space-y-4">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <h1 className="text-xl font-bold text-gray-900">Booking Overview</h1>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                        <Filter className="w-4 h-4" />
                        <span>Filters</span>
                    </button>
                    <button
                        onClick={() => {
                            loadSummary();
                            loadBookings();
                        }}
                        className="flex items-center space-x-2 px-3 py-2 bg-[#c53445] text-white rounded-lg hover:bg-[#a02a37] transition-colors text-sm"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="bg-white border rounded-lg p-3">
                    <p className="text-xs text-gray-600">Total Bookings</p>
                    {summaryLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-[#c53445] mt-1" />
                    ) : (
                        <p className="text-xl font-bold">{summary.total}</p>
                    )}
                </div>
                <div className="bg-white border rounded-lg p-3">
                    <p className="text-xs text-gray-600">Confirmed</p>
                    {summaryLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-[#c53445] mt-1" />
                    ) : (
                        <p className="text-xl font-bold text-green-600">{summary.confirmed}</p>
                    )}
                </div>
                <div className="bg-white border rounded-lg p-3">
                    <p className="text-xs text-gray-600">Pending</p>
                    {summaryLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-[#c53445] mt-1" />
                    ) : (
                        <p className="text-xl font-bold text-yellow-600">{summary.pending}</p>
                    )}
                </div>
                <div className="bg-white border rounded-lg p-3">
                    <p className="text-xs text-gray-600">Cancelled</p>
                    {summaryLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-[#c53445] mt-1" />
                    ) : (
                        <p className="text-xl font-bold text-red-600">{summary.cancelled}</p>
                    )}
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="bg-white border rounded-lg p-3">
                    <h3 className="text-base font-semibold mb-3">Filters</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {/* Status Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent text-sm"
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="accepted">Accepted</option>
                                <option value="rejected">Rejected</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>

                        {/* Date Range Filters */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
                            <input
                                type="date"
                                value={filters.from}
                                onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
                            <input
                                type="date"
                                value={filters.to}
                                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent text-sm"
                            />
                        </div>

                        {/* Coach Name Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Coach Name</label>
                            <input
                                type="text"
                                placeholder="Search by coach name..."
                                value={filters.coachName}
                                onChange={(e) => setFilters({ ...filters, coachName: e.target.value })}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent text-sm"
                            />
                        </div>

                        {/* Client Name Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Client Name</label>
                            <input
                                type="text"
                                placeholder="Search by client name..."
                                value={filters.clientName}
                                onChange={(e) => setFilters({ ...filters, clientName: e.target.value })}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent text-sm"
                            />
                        </div>

                        {/* Filter Actions */}
                        <div className="flex items-end space-x-2">
                            <button
                                onClick={clearFilters}
                                className="px-2 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                            >
                                Clear
                            </button>
                            <button
                                onClick={applyFilters}
                                className="px-2 py-1.5 bg-[#c53445] text-white rounded-lg hover:bg-[#a02a37] transition-colors text-sm"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bookings Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <h2 className="text-base font-semibold text-gray-900">All Bookings</h2>
                        <p className="text-xs text-gray-500">
                            {loading ? 'Loading...' : `${bookings.length} bookings found`}
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-[#c53445]" />
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                            <p className="text-gray-500">Try adjusting your filters or check back later.</p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Client Name
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Coach Name
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Service Type
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Time
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                        Notes
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {bookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                                            {booking.client ? `${booking.client.firstName} ${booking.client.lastName}` : 'N/A'}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                                            {booking.coach ? `${booking.coach.firstName} ${booking.coach.lastName}` : 'N/A'}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">
                                            {booking.sessionType || 'N/A'}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">
                                            {formatDate(booking.serviceDateTime)}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">
                                            {formatTime(booking.serviceDateTime)}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(booking.status)}`}>
                                                {booking.status || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-700 w-32 break-words">
                                            {booking.notes || 'No notes'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminBookingsOverview;
