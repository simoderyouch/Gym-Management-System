import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { bookingApi } from '../../services/api';
import {
    Calendar,
    Clock,
    User,
    Edit,
    Trash2,
    X,
    Loader2,
    AlertCircle,
    CheckCircle,
    XCircle
} from 'lucide-react';

const ClientBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedFilter, setSelectedFilter] = useState('All');
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [updating, setUpdating] = useState(false);

    // Advanced filtering states
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedWeek, setSelectedWeek] = useState('All');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    // Form state for update modal (same as TrainerProfile)
    const [bookingForm, setBookingForm] = useState({
        requestedDateTime: '',
        sessionType: 'Personal Training',
        durationMinutes: 60,
        notes: ''
    });

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await bookingApi.getMyBookings();
            console.log('Bookings response:', response.data);
            setBookings(response.data);
        } catch (err) {
            console.error('Error fetching bookings:', err);
            setError('Failed to load bookings. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (bookingId) => {
        try {
            await bookingApi.cancelBooking(bookingId);
            toast.success('Booking cancelled successfully!');
            fetchBookings(); // Refresh the list
        } catch (error) {
            console.error('Error cancelling booking:', error);
            const errorMessage = error.response?.data?.error || 'Failed to cancel booking.';
            toast.error(errorMessage);
        }
    };

    const handleUpdate = (booking) => {
        setSelectedBooking(booking);

        // Format the date for datetime-local input
        let formattedDateTime = '';
        if (booking.serviceDateTime) {
            const date = new Date(booking.serviceDateTime);
            formattedDateTime = date.toISOString().slice(0, 16);
        }

        setBookingForm({
            requestedDateTime: formattedDateTime,
            sessionType: booking.sessionType || 'Personal Training',
            durationMinutes: booking.durationMinutes || 60,
            notes: booking.notes || ''
        });
        setShowUpdateModal(true);
    };

    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        try {
            setUpdating(true);

            // Build update data object, only including fields that have values
            const updateData = {};

            if (bookingForm.requestedDateTime) {
                const selectedDate = new Date(bookingForm.requestedDateTime);
                const now = new Date();

                if (selectedDate <= now) {
                    toast.error('Please select a future date and time');
                    setUpdating(false);
                    return;
                }

                updateData.requestedDateTime = selectedDate.toISOString();
            }

            if (bookingForm.sessionType && bookingForm.sessionType.trim()) {
                updateData.sessionType = bookingForm.sessionType.trim();
            }

            if (bookingForm.durationMinutes && bookingForm.durationMinutes > 0) {
                updateData.durationMinutes = parseInt(bookingForm.durationMinutes);
            }

            if (bookingForm.notes && bookingForm.notes.trim()) {
                updateData.notes = bookingForm.notes.trim();
            }

            console.log('Sending update data:', updateData);
            await bookingApi.updateBookingRequest(selectedBooking.id, updateData);
            toast.success('Booking updated successfully!');
            setShowUpdateModal(false);
            fetchBookings(); // Refresh the list
        } catch (error) {
            console.error('Error updating booking:', error);
            const errorMessage = error.response?.data?.error || 'Failed to update booking.';
            toast.error(errorMessage);
        } finally {
            setUpdating(false);
        }
    };



    const handleDelete = async () => {
        if (!selectedBooking) return;

        try {
            setDeleting(true);
            await bookingApi.deleteBookingRequest(selectedBooking.id);
            toast.success('Booking deleted successfully!');
            setShowDeleteModal(false);
            fetchBookings(); // Refresh the list
        } catch (error) {
            console.error('Error deleting booking:', error);
            const errorMessage = error.response?.data?.error || 'Failed to delete booking.';
            toast.error(errorMessage);
        } finally {
            setDeleting(false);
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

    // Helper functions for advanced filtering
    const getWeekOfMonth = (date) => {
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const firstDayOfWeek = firstDay.getDay();
        const dayOfMonth = date.getDate();
        return Math.ceil((dayOfMonth + firstDayOfWeek) / 7);
    };

    const getMonthName = (monthNumber) => {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[monthNumber - 1];
    };

    const getWeekLabel = (weekNumber) => {
        const weekLabels = ['1st Week', '2nd Week', '3rd Week', '4th Week', '5th Week'];
        return weekLabels[weekNumber - 1] || `${weekNumber}th Week`;
    };

    // Generate years for dropdown (current year + 2 years back and 1 year forward)
    const generateYearOptions = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = currentYear - 2; i <= currentYear + 1; i++) {
            years.push(i);
        }
        return years;
    };

    // Generate weeks for dropdown
    const generateWeekOptions = () => {
        return ['All', '1st Week', '2nd Week', '3rd Week', '4th Week', '5th Week'];
    };

    // Apply advanced filtering
    const applyAdvancedFilters = (bookings) => {
        return bookings.filter(booking => {
            if (!booking.serviceDateTime) return false;

            const bookingDate = new Date(booking.serviceDateTime);
            const bookingYear = bookingDate.getFullYear();
            const bookingMonth = bookingDate.getMonth() + 1;
            const bookingWeek = getWeekOfMonth(bookingDate);

            // Filter by year
            if (selectedYear && bookingYear !== selectedYear) return false;

            // Filter by month
            if (selectedMonth && bookingMonth !== selectedMonth) return false;

            // Filter by week
            if (selectedWeek !== 'All') {
                const weekNumber = parseInt(selectedWeek.split(' ')[0]);
                if (bookingWeek !== weekNumber) return false;
            }

            return true;
        });
    };

    // Apply all filters
    const filteredBookings = (() => {
        let filtered = bookings;

        // First apply status filter
        if (selectedFilter !== 'All') {
            filtered = filtered.filter(booking => booking.status === selectedFilter);
        }

        // Then apply advanced filters
        filtered = applyAdvancedFilters(filtered);

        return filtered;
    })();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin text-[#c53445]" />
                    <span className="text-lg text-gray-600">Loading bookings...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-4">{error}</p>
                <button
                    onClick={fetchBookings}
                    className="bg-[#c53445] text-white px-4 py-2 rounded-lg hover:bg-[#b02e3d] transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
                    <p className="text-gray-600 mt-2">Upcoming & Past Sessions</p>
                    <p className="text-gray-500 text-sm">Manage your fitness bookings effortlessly.</p>
                </div>
                <button
                    onClick={fetchBookings}
                    disabled={loading}
                    className="bg-[#c53445] text-white px-4 py-2 rounded-lg hover:bg-[#b02e3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                    <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Filter */}
            <div className="bg-white p-4 rounded-lg shadow border">
                <div className="flex flex-col space-y-4">
                    {/* Basic Status Filter */}
                    <div className="flex items-center space-x-4">
                        <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
                        <select
                            value={selectedFilter}
                            onChange={(e) => setSelectedFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                        >
                            <option value="All">All Bookings</option>
                            <option value="PENDING">Pending</option>
                            <option value="ACCEPTED">Accepted</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>

                    {/* Advanced Filters Toggle */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className="text-sm text-[#c53445] hover:text-[#b02e3d] font-medium flex items-center space-x-1"
                        >
                            <span>{showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters</span>
                            <svg
                                className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Active Filters Summary */}
                        {(selectedYear !== new Date().getFullYear() || selectedMonth !== new Date().getMonth() + 1 || selectedWeek !== 'All') && (
                            <div className="text-sm text-gray-600">
                                Active: {getMonthName(selectedMonth)} {selectedYear}
                                {selectedWeek !== 'All' && ` - ${selectedWeek}`}
                            </div>
                        )}
                    </div>

                    {/* Advanced Filters */}
                    {showAdvancedFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                            {/* Year Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                >
                                    {generateYearOptions().map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Month Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                >
                                    <option value={1}>January</option>
                                    <option value={2}>February</option>
                                    <option value={3}>March</option>
                                    <option value={4}>April</option>
                                    <option value={5}>May</option>
                                    <option value={6}>June</option>
                                    <option value={7}>July</option>
                                    <option value={8}>August</option>
                                    <option value={9}>September</option>
                                    <option value={10}>October</option>
                                    <option value={11}>November</option>
                                    <option value={12}>December</option>
                                </select>
                            </div>

                            {/* Week Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Week of Month</label>
                                <select
                                    value={selectedWeek}
                                    onChange={(e) => setSelectedWeek(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                >
                                    {generateWeekOptions().map(week => (
                                        <option key={week} value={week}>{week}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Clear Filters Button */}
                    {(selectedYear !== new Date().getFullYear() || selectedMonth !== new Date().getMonth() + 1 || selectedWeek !== 'All') && (
                        <div className="pt-2 border-t border-gray-200">
                            <button
                                onClick={() => {
                                    setSelectedYear(new Date().getFullYear());
                                    setSelectedMonth(new Date().getMonth() + 1);
                                    setSelectedWeek('All');
                                }}
                                className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                            >
                                Clear Date Filters
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Results Summary */}
            <div className="bg-white p-4 rounded-lg shadow border">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Showing <span className="font-medium text-gray-900">{filteredBookings.length}</span> of <span className="font-medium text-gray-900">{bookings.length}</span> bookings
                    </div>
                    <div className="text-sm text-gray-500">
                        {filteredBookings.length > 0 && (
                            <span>
                                {selectedFilter !== 'All' && `${selectedFilter} status`}
                                {(selectedYear !== new Date().getFullYear() || selectedMonth !== new Date().getMonth() + 1 || selectedWeek !== 'All') && (
                                    <span>
                                        {selectedFilter !== 'All' && ' • '}
                                        {getMonthName(selectedMonth)} {selectedYear}
                                        {selectedWeek !== 'All' && ` - ${selectedWeek}`}
                                    </span>
                                )}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-lg shadow border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Coach
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date/Time
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Session Type
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
                            {filteredBookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <User className="h-5 w-5 text-gray-400 mr-2" />
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {booking.coach?.firstName} {booking.coach?.lastName}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {booking.coach?.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                            <div className="text-sm text-gray-900">
                                                {formatDateTime(booking.serviceDateTime)}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {booking.sessionType || 'Not specified'}
                                        </div>
                                        {booking.durationMinutes && (
                                            <div className="text-sm text-gray-500">
                                                {booking.durationMinutes} minutes
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                            {getStatusIcon(booking.status)}
                                            <span className="ml-1">{booking.status}</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                            {booking.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => handleUpdate(booking)}
                                                        className="text-blue-600 hover:text-blue-800 transition-colors"
                                                        title="Update Booking"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedBooking(booking);
                                                            setShowDeleteModal(true);
                                                        }}
                                                        className="text-red-600 hover:text-red-800 transition-colors"
                                                        title="Delete Booking"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </>
                                            )}
                                            {booking.status === 'ACCEPTED' && (
                                                <button
                                                    onClick={() => handleCancel(booking.id)}
                                                    className="text-red-600 hover:text-red-800 transition-colors"
                                                    title="Cancel Booking"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredBookings.length === 0 && (
                    <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No bookings found</p>
                    </div>
                )}
            </div>

            {/* Update Booking Modal */}
            {showUpdateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Update Booking</h3>
                        <form onSubmit={handleBookingSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date & Time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={bookingForm.requestedDateTime}
                                    onChange={(e) => setBookingForm({ ...bookingForm, requestedDateTime: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Session Type
                                </label>
                                <select
                                    value={bookingForm.sessionType}
                                    onChange={(e) => setBookingForm({ ...bookingForm, sessionType: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                >
                                    <option>Personal Training</option>
                                    <option>Group Class</option>
                                    <option>Nutrition Consultation</option>
                                    <option>Fitness Assessment</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Duration (minutes)
                                </label>
                                <select
                                    value={bookingForm.durationMinutes}
                                    onChange={(e) => setBookingForm({ ...bookingForm, durationMinutes: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                >
                                    <option value={30}>30 minutes</option>
                                    <option value={60}>60 minutes</option>
                                    <option value={90}>90 minutes</option>
                                    <option value={120}>120 minutes</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={bookingForm.notes}
                                    onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                    placeholder="Any specific goals or requirements..."
                                />
                            </div>
                            <div className="flex space-x-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="flex-1 bg-[#c53445] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#b02e3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                >
                                    {updating && <Loader2 className="h-4 w-4 animate-spin" />}
                                    <span>{updating ? 'Updating...' : 'Update Booking'}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowUpdateModal(false)}
                                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Booking Modal */}
            {showDeleteModal && selectedBooking && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-900">Delete Booking</h2>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
                                <p className="text-gray-700">
                                    Are you sure you want to delete this booking? This action cannot be undone.
                                </p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                <p className="text-sm text-gray-600">
                                    <strong>Coach:</strong> {selectedBooking.coach?.firstName} {selectedBooking.coach?.lastName}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Date:</strong> {formatDateTime(selectedBooking.serviceDateTime)}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Status:</strong> {selectedBooking.status}
                                </p>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                >
                                    {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                                    <span>{deleting ? 'Deleting...' : 'Delete Booking'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientBookings;
