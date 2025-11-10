import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { profilePictureUrl } from '../../config/paths';
import { useAuth } from '../../context/AuthContext';
import { bookingApi } from '../../services/api';
import { Loader2, Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Search, Filter, CalendarDays } from 'lucide-react';

const CoachBookings = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState({});

    // Filter states
    const [selectedFilter, setSelectedFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedWeek, setSelectedWeek] = useState('All');

    // Modal states
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [notes, setNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');

    // Load bookings
    const loadBookings = async () => {
        try {
            setLoading(true);
            const response = await bookingApi.getAllCoachBookings();
            console.log('Coach bookings response:', response.data);
            console.log('Bookings data structure:', response.data?.value || response.data);
            setBookings(response.data?.value || response.data || []);
        } catch (error) {
            console.error('Error loading bookings:', error);
            toast.error('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    // Load pending bookings
    const loadPendingBookings = async () => {
        try {
            setLoading(true);
            const response = await bookingApi.getPendingBookings();
            console.log('Pending bookings response:', response.data);
            console.log('Pending bookings data structure:', response.data?.value || response.data);
            setBookings(response.data?.value || response.data || []);
        } catch (error) {
            console.error('Error loading pending bookings:', error);
            toast.error('Failed to load pending bookings');
        } finally {
            setLoading(false);
        }
    };

    // Handle accept booking
    const handleAccept = async () => {
        if (!selectedBooking) return;

        try {
            setActionLoading(prev => ({ ...prev, [selectedBooking.id]: true }));
            console.log('Attempting to accept booking:', selectedBooking.id, 'with notes:', notes);
            const response = await bookingApi.acceptBooking(selectedBooking.id, notes);
            console.log('Accept booking response:', response);
            toast.success('Booking accepted successfully!');
            setShowAcceptModal(false);
            setSelectedBooking(null);
            setNotes('');
            loadBookings(); // Refresh the list
        } catch (error) {
            console.error('Error accepting booking:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Failed to accept booking';
            toast.error(`Failed to accept booking: ${errorMessage}`);
        } finally {
            setActionLoading(prev => ({ ...prev, [selectedBooking.id]: false }));
        }
    };

    // Handle reject booking
    const handleReject = async () => {
        if (!selectedBooking || !rejectionReason.trim()) {
            toast.error('Please provide a rejection reason');
            return;
        }

        try {
            setActionLoading(prev => ({ ...prev, [selectedBooking.id]: true }));
            console.log('Attempting to reject booking:', selectedBooking.id, 'with reason:', rejectionReason);
            const response = await bookingApi.rejectBooking(selectedBooking.id, rejectionReason);
            console.log('Reject booking response:', response);
            toast.success('Booking rejected');
            setShowRejectModal(false);
            setSelectedBooking(null);
            setRejectionReason('');
            loadBookings(); // Refresh the list
        } catch (error) {
            console.error('Error rejecting booking:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Failed to reject booking';
            toast.error(`Failed to reject booking: ${errorMessage}`);
        } finally {
            setActionLoading(prev => ({ ...prev, [selectedBooking.id]: false }));
        }
    };

    // Handle complete booking
    const handleComplete = async (bookingId) => {
        try {
            setActionLoading(prev => ({ ...prev, [bookingId]: true }));
            await bookingApi.completeBooking(bookingId);
            toast.success('Booking marked as completed!');
            loadBookings(); // Refresh the list
        } catch (error) {
            console.error('Error completing booking:', error);
            toast.error('Failed to complete booking');
        } finally {
            setActionLoading(prev => ({ ...prev, [bookingId]: false }));
        }
    };

    // Filter bookings based on selected criteria
    const getFilteredBookings = () => {
        let filtered = bookings;

        // Status filter
        if (selectedFilter !== 'All') {
            filtered = filtered.filter(booking =>
                booking.status.toLowerCase() === selectedFilter.toLowerCase()
            );
        }

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(booking =>
                booking.client?.firstName?.toLowerCase().includes(query) ||
                booking.client?.lastName?.toLowerCase().includes(query) ||
                booking.client?.email?.toLowerCase().includes(query) ||
                booking.sessionType?.toLowerCase().includes(query) ||
                booking.notes?.toLowerCase().includes(query) ||
                booking.coachNotes?.toLowerCase().includes(query)
            );
        }

        // Year filter
        if (selectedYear) {
            filtered = filtered.filter(booking => {
                const bookingDate = new Date(booking.serviceDateTime);
                return bookingDate.getFullYear() === selectedYear;
            });
        }

        // Month filter
        if (selectedMonth !== null) {
            filtered = filtered.filter(booking => {
                const bookingDate = new Date(booking.serviceDateTime);
                return bookingDate.getMonth() === selectedMonth;
            });
        }

        // Week filter
        if (selectedWeek !== 'All') {
            filtered = filtered.filter(booking => {
                const bookingDate = new Date(booking.serviceDateTime);
                const weekOfMonth = getWeekOfMonth(bookingDate);
                return weekOfMonth === parseInt(selectedWeek);
            });
        }

        return filtered.sort((a, b) => new Date(a.serviceDateTime) - new Date(b.serviceDateTime));
    };

    // Helper function to get week of month
    const getWeekOfMonth = (date) => {
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const firstDayWeek = firstDay.getDay();
        const offsetDate = date.getDate() + firstDayWeek - 1;
        return Math.floor(offsetDate / 7) + 1;
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'ACCEPTED':
                return 'bg-green-100 text-green-800';
            case 'REJECTED':
                return 'bg-red-100 text-red-800';
            case 'CANCELLED':
                return 'bg-gray-100 text-gray-800';
            case 'COMPLETED':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Format date and time
    const formatDateTime = (dateTime) => {
        const date = new Date(dateTime);
        return {
            date: date.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }),
            time: date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            })
        };
    };

    // Get image URL helper
    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return encodeURI(profilePictureUrl(url));
    };

    // Get available years from bookings
    const getAvailableYears = () => {
        const years = [...new Set(bookings.map(booking =>
            new Date(booking.serviceDateTime).getFullYear()
        ))];
        return years.sort((a, b) => b - a);
    };

    // Get available months from bookings
    const getAvailableMonths = () => {
        const months = [...new Set(bookings.map(booking =>
            new Date(booking.serviceDateTime).getMonth()
        ))];
        return months.sort((a, b) => a - b);
    };

    // Load data on component mount
    useEffect(() => {
        if (user?.token) {
            loadBookings();
        }
    }, [user]);

    // Load pending bookings when filter changes
    useEffect(() => {
        if (selectedFilter === 'Pending') {
            loadPendingBookings();
        } else if (selectedFilter === 'All') {
            loadBookings();
        }
    }, [selectedFilter]);

    const filteredBookings = getFilteredBookings();
    const availableYears = getAvailableYears();
    const availableMonths = getAvailableMonths();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
                    <p className="text-gray-600 mt-2">Manage your coaching sessions and appointments.</p>
                </div>

                {/* Quick Stats */}
                <div className="flex space-x-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
                            <div>
                                <p className="text-sm text-gray-600">Pending</p>
                                <p className="text-lg font-semibold">
                                    {bookings.filter(b => b.status === 'PENDING').length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                            <div>
                                <p className="text-sm text-gray-600">Accepted</p>
                                <p className="text-lg font-semibold">
                                    {bookings.filter(b => b.status === 'ACCEPTED').length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex items-center">
                            <Calendar className="w-5 h-5 text-blue-500 mr-2" />
                            <div>
                                <p className="text-sm text-gray-600">Total</p>
                                <p className="text-lg font-semibold">{bookings.length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                            value={selectedFilter}
                            onChange={(e) => setSelectedFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Accepted">Accepted</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Cancelled">Cancelled</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>

                    {/* Year Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                        >
                            <option value="">All Years</option>
                            {availableYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    {/* Month Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                        >
                            <option value="">All Months</option>
                            {availableMonths.map(month => (
                                <option key={month} value={month}>
                                    {new Date(2024, month).toLocaleDateString('en-US', { month: 'long' })}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Week Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Week</label>
                        <select
                            value={selectedWeek}
                            onChange={(e) => setSelectedWeek(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                        >
                            <option value="All">All Weeks</option>
                            <option value="1">Week 1</option>
                            <option value="2">Week 2</option>
                            <option value="3">Week 3</option>
                            <option value="4">Week 4</option>
                            <option value="5">Week 5</option>
                        </select>
                    </div>
                </div>

                {/* Search */}
                <div className="mt-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by client name, email, session type, or notes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Results Summary */}
                <div className="mt-4 text-sm text-gray-600">
                    Showing {filteredBookings.length} of {bookings.length} bookings
                </div>
            </div>

            {/* Bookings Table */}
            {loading ? (
                <div className="bg-white rounded-lg shadow-sm border p-12">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#c53445]" />
                        <p className="text-gray-600">Loading bookings...</p>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Client
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Session Details
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date/Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Notes
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredBookings.map((booking) => {
                                    const { date, time } = formatDateTime(booking.serviceDateTime);
                                    return (
                                        <tr key={booking.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {booking.client?.profilePictureUrl ? (
                                                        <img
                                                            src={getImageUrl(booking.client.profilePictureUrl)}
                                                            alt={`${booking.client.firstName} ${booking.client.lastName}`}
                                                            className="w-10 h-10 rounded-full object-cover mr-3"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div className={`w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3 ${booking.client?.profilePictureUrl ? 'hidden' : ''}`}>
                                                        <User className="w-5 h-5 text-gray-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {booking.client?.firstName} {booking.client?.lastName}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {booking.client?.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {booking.sessionType || 'Personal Training'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {booking.durationMinutes ? `${booking.durationMinutes} min` : '60 min'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{date}</div>
                                                <div className="text-sm text-gray-500">{time}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 max-w-xs space-y-2">
                                                    {/* Client Notes */}
                                                    {booking.notes && (
                                                        <div className="bg-blue-50 p-2 rounded border-l-4 border-blue-400">
                                                            <p className="text-xs text-blue-600 font-medium mb-1">Client Notes:</p>
                                                            <p className="text-sm text-gray-700 italic">
                                                                "{booking.notes}"
                                                            </p>
                                                        </div>
                                                    )}
                                                    {/* Coach Notes */}
                                                    {booking.coachNotes && (
                                                        <div className="bg-green-50 p-2 rounded border-l-4 border-green-400">
                                                            <p className="text-xs text-green-600 font-medium mb-1">Coach Notes:</p>
                                                            <p className="text-sm text-gray-700 italic">
                                                                "{booking.coachNotes}"
                                                            </p>
                                                        </div>
                                                    )}
                                                    {/* No Notes */}
                                                    {!booking.notes && !booking.coachNotes && (
                                                        <span className="text-gray-400 text-sm">No notes</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    {booking.status === 'PENDING' && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedBooking(booking);
                                                                    setShowAcceptModal(true);
                                                                }}
                                                                disabled={actionLoading[booking.id]}
                                                                className="text-green-600 hover:text-green-800 transition-colors disabled:opacity-50"
                                                            >
                                                                {actionLoading[booking.id] ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    'Accept'
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedBooking(booking);
                                                                    setShowRejectModal(true);
                                                                }}
                                                                disabled={actionLoading[booking.id]}
                                                                className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                                                            >
                                                                {actionLoading[booking.id] ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    'Reject'
                                                                )}
                                                            </button>
                                                        </>
                                                    )}
                                                    {booking.status === 'ACCEPTED' && (
                                                        <button
                                                            onClick={() => handleComplete(booking.id)}
                                                            disabled={actionLoading[booking.id]}
                                                            className="text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
                                                        >
                                                            {actionLoading[booking.id] ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                'Complete'
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredBookings.length === 0 && (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                    <p className="text-gray-500">
                        {bookings.length === 0
                            ? 'You don\'t have any bookings yet.'
                            : 'No bookings match your current filters.'
                        }
                    </p>
                </div>
            )}

            {/* Accept Modal */}
            {showAcceptModal && selectedBooking && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Accept Booking</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Accept booking from {selectedBooking.client?.firstName} {selectedBooking.client?.lastName}?
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notes (Optional)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add any notes for the client..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                rows="3"
                            />
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={handleAccept}
                                disabled={actionLoading[selectedBooking.id]}
                                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                {actionLoading[selectedBooking.id] ? (
                                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                ) : (
                                    'Accept'
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setShowAcceptModal(false);
                                    setSelectedBooking(null);
                                    setNotes('');
                                }}
                                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && selectedBooking && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Booking</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Reject booking from {selectedBooking.client?.firstName} {selectedBooking.client?.lastName}?
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reason <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Please provide a reason for rejection..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                rows="3"
                                required
                            />
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={handleReject}
                                disabled={actionLoading[selectedBooking.id] || !rejectionReason.trim()}
                                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {actionLoading[selectedBooking.id] ? (
                                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                ) : (
                                    'Reject'
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setSelectedBooking(null);
                                    setRejectionReason('');
                                }}
                                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoachBookings;
