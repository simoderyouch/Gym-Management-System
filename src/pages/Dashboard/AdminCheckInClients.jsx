import { useState, useEffect, useRef } from 'react';
import { adminApi } from '../../services/adminApi';
import { toast, ToastContainer } from 'react-toastify';
import { fullUrl } from '../../config/paths';

const AdminCheckInClients = () => {
    const [clientId, setClientId] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [selectedGym, setSelectedGym] = useState('');
    const [gyms, setGyms] = useState([]);
    const [client, setClient] = useState(null);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [filteredAttendance, setFilteredAttendance] = useState([]);
    const [membershipHistory, setMembershipHistory] = useState([]);
    const [filteredMembershipHistory, setFilteredMembershipHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [membershipInfo, setMembershipInfo] = useState(null);
    const [renewLoading, setRenewLoading] = useState(false);

    // Refs
    const clientIdInputRef = useRef(null);
    const pageContainerRef = useRef(null);

    const [isFullscreen, setIsFullscreen] = useState(false);
    const toastOpts = { containerId: 'checkin' };

    // Helper: format date as D-M-Y
    const formatDMY = (value) => {
        if (!value) return 'N/A';
        const d = new Date(value);
        if (isNaN(d)) return 'N/A';
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const focusClientIdInput = () => {
        if (clientIdInputRef.current) {
            clientIdInputRef.current.focus();
            clientIdInputRef.current.select?.();
        }
    };

    // Fullscreen API helpers
    const enterFullscreen = async () => {
        try {
            // Only the check-in container goes fullscreen (excludes sidebar/header)
            if (pageContainerRef.current && !document.fullscreenElement) {
                await pageContainerRef.current.requestFullscreen();
            }
        } catch (e) {
            console.error('Failed to enter fullscreen', e);
        }
    };

    const exitFullscreen = async () => {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            }
        } catch (e) {
            console.error('Failed to exit fullscreen', e);
        }
    };

    const toggleFullscreen = () => {
        if (document.fullscreenElement) {
            exitFullscreen();
        } else {
            enterFullscreen();
        }
    };

    // Renew membership modal state
    const [showRenewModal, setShowRenewModal] = useState(false);
    const [renewForm, setRenewForm] = useState({
        startDate: '',
        endDate: '',
        price: 100
    });

    // Attendance filtering
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

    // Membership history filtering
    const [selectedMembershipYear, setSelectedMembershipYear] = useState('');

    // Load gyms on component mount and focus the Client ID input for quick scanning
    useEffect(() => {
        fetchGyms();
        // Small timeout ensures focus after initial render
        const t = setTimeout(() => focusClientIdInput(), 0);
        const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFsChange);
        return () => {
            clearTimeout(t);
            document.removeEventListener('fullscreenchange', onFsChange);
        };
    }, []);

    // Filter attendance when attendanceHistory or filters change
    useEffect(() => {
        if (attendanceHistory.length > 0) {
            const filtered = attendanceHistory.filter(item => {
                const itemDate = new Date(item.checkedAt);
                const itemYear = itemDate.getFullYear();
                const itemMonth = itemDate.getMonth() + 1;

                return itemYear === selectedYear && itemMonth === selectedMonth;
            });
            setFilteredAttendance(filtered);
        } else {
            setFilteredAttendance([]);
        }
    }, [attendanceHistory, selectedYear, selectedMonth]);

    // Filter membership history when membershipHistory or filters change
    useEffect(() => {
        console.log('Filtering membership history:', membershipHistory, 'selectedYear:', selectedMembershipYear);
        if (membershipHistory.length > 0) {
            const filtered = membershipHistory.filter(item => {
                if (!selectedMembershipYear) return true; // Show all if no year selected
                const itemDate = new Date(item.startDate);
                const itemYear = itemDate.getFullYear();
                return itemYear === selectedMembershipYear;
            });
            console.log('Filtered membership history:', filtered);
            setFilteredMembershipHistory(filtered);
        } else {
            setFilteredMembershipHistory([]);
        }
    }, [membershipHistory, selectedMembershipYear]);

    const fetchGyms = async () => {
        try {
            const response = await adminApi.getGyms();
            setGyms(response.data || []);
        } catch (error) {
            console.error('Error fetching gyms:', error);
            toast.error('Failed to load gyms', toastOpts);
        }
    };

    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return fullUrl(url);
    };

    // Attendance guard: require at least 5 hours since the most recent attendance
    const canRecordAttendanceNow = (history = []) => {
        if (!history || history.length === 0) return true;
        // Assume history is newest-first; if not, compute most recent
        const mostRecent = history.reduce((latest, item) => {
            const t = new Date(item.checkedAt).getTime();
            return t > latest ? t : latest;
        }, 0);
        if (!mostRecent) return true;
        const now = Date.now();
        const diffHours = (now - mostRecent) / (1000 * 60 * 60);
        return diffHours >= 5; // enforce 5-hour gap
    };

    const handleSearch = async (autoRecordOnEnter = false) => {
        if (!clientId.trim() && !firstName.trim() && !lastName.trim()) {
            toast.error('Please enter a client ID, first name, or last name', toastOpts);
            return;
        }

        setSearchLoading(true);
        try {
            const params = {};
            if (clientId.trim()) params.clientId = parseInt(clientId.trim());
            if (firstName.trim()) params.firstName = firstName.trim();
            if (lastName.trim()) params.lastName = lastName.trim();
            if (selectedGym) params.gymId = parseInt(selectedGym);

            const response = await adminApi.searchClients(params);
            if (response.data && response.data.length > 0) {
                const foundClient = response.data[0];
                setClient(foundClient);

                // Fetch membership info
                try {
                    const membershipResponse = await adminApi.getClientMembership(foundClient.id);
                    setMembershipInfo(membershipResponse.data);
                } catch (error) {
                    console.error('Error fetching membership:', error);
                    setMembershipInfo(null);
                }

                // Fetch membership history for this client
                try {
                    const membershipHistoryResponse = await adminApi.getClientMembershipHistory(foundClient.id);
                    console.log('Membership history response:', membershipHistoryResponse.data);
                    setMembershipHistory(membershipHistoryResponse.data || []);
                } catch (error) {
                    console.error('Error fetching membership history:', error);
                    setMembershipHistory([]);
                }

                // Fetch attendance history for this client
                const attendanceResponse = await adminApi.getClientAttendance(foundClient.id);
                const fetchedHistory = attendanceResponse.data || [];
                setAttendanceHistory(fetchedHistory);

                // Auto record attendance when triggered from Client ID Enter
                if (autoRecordOnEnter && clientId.trim()) {
                    (async () => {
                        try {
                            // Guard: only if last attendance >= 5 hours ago
                            const allowed = canRecordAttendanceNow(fetchedHistory);
                            if (!allowed) {
                                toast.warn('Attendance already recorded recently (less than 5 hours).', toastOpts);
                                return;
                            }
                            await adminApi.createAttendance(foundClient.id);
                            const refreshed = await adminApi.getClientAttendance(foundClient.id);
                            setAttendanceHistory(refreshed.data || []);
                            toast.success('Attendance recorded', toastOpts);
                        } catch (err) {
                            console.error('Auto attendance failed:', err);
                            toast.error('Failed to auto record attendance', toastOpts);
                        }
                    })();
                }
                // After successful fetch, clear and refocus Client ID for next entry
                setClientId('');
                focusClientIdInput();
            } else {
                setClient(null);
                setAttendanceHistory([]);
                setMembershipHistory([]);
                setMembershipInfo(null);
                toast.warning('No client found with the provided criteria', toastOpts);
                // Keep the entered id, but refocus to let user correct quickly
                focusClientIdInput();
            }
        } catch (error) {
            console.error('Error searching for client:', error);
            toast.error('Failed to search for client', toastOpts);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleAddAttendance = async () => {
        if (!client) {
            toast.error('Please search for a client first', toastOpts);
            return;
        }

        setLoading(true);
        try {
            // Guard based on current in-memory history
            const allowed = canRecordAttendanceNow(attendanceHistory);
            if (!allowed) {
                toast.warn('You cannot record more than one attendance within 5 hours.', toastOpts);
                return;
            }
            await adminApi.createAttendance(client.id);
            toast.success('Attendance recorded successfully', toastOpts);

            // Refresh attendance history
            const attendanceResponse = await adminApi.getClientAttendance(client.id);
            setAttendanceHistory(attendanceResponse.data || []);
        } catch (error) {
            console.error('Error creating attendance:', error);
            toast.error('Failed to record attendance', toastOpts);
        } finally {
            setLoading(false);
        }
    };

    const openRenewModal = () => {
        if (!client) {
            toast.error('Please search for a client first', toastOpts);
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const oneMonthFromToday = new Date();
        oneMonthFromToday.setMonth(oneMonthFromToday.getMonth() + 1);
        const oneMonthFromTodayStr = oneMonthFromToday.toISOString().split('T')[0];

        setRenewForm({
            startDate: today,
            endDate: oneMonthFromTodayStr,
            price: 100
        });
        setShowRenewModal(true);
    };

    const closeRenewModal = () => {
        setShowRenewModal(false);
        setRenewForm({
            startDate: '',
            endDate: '',
            price: 100
        });
    };

    const handleRenewMembership = async (e) => {
        e.preventDefault();
        if (!client) return;

        try {
            setRenewLoading(true);
            await adminApi.renewMembership(client.id, renewForm);
            toast.success('Membership renewed successfully', toastOpts);
            closeRenewModal();

            // Refresh membership info and history
            const membershipResponse = await adminApi.getClientMembership(client.id);
            setMembershipInfo(membershipResponse.data);

            // Refresh membership history
            const membershipHistoryResponse = await adminApi.getClientMembershipHistory(client.id);
            setMembershipHistory(membershipHistoryResponse.data || []);
        } catch (error) {
            console.error('Error renewing membership:', error);
            toast.error('Failed to renew membership', toastOpts);
        } finally {
            setRenewLoading(false);
        }
    };

    const refreshMembershipHistory = async () => {
        if (!client) return;

        try {
            // Refresh both membership info and history
            const [membershipResponse, membershipHistoryResponse] = await Promise.all([
                adminApi.getClientMembership(client.id),
                adminApi.getClientMembershipHistory(client.id)
            ]);

            console.log('Refreshed membership info:', membershipResponse.data);
            console.log('Refreshed membership history:', membershipHistoryResponse.data);

            setMembershipInfo(membershipResponse.data);
            setMembershipHistory(membershipHistoryResponse.data || []);
            toast.success('Membership data refreshed', toastOpts);
        } catch (error) {
            console.error('Error refreshing membership data:', error);
            toast.error('Failed to refresh membership data', toastOpts);
        }
    };

    const clearFilters = () => {
        setClientId('');
        setFirstName('');
        setLastName('');
        setSelectedGym('');
        setClient(null);
        setAttendanceHistory([]);
        setMembershipHistory([]);
        setMembershipInfo(null);
        setSelectedYear(new Date().getFullYear());
        setSelectedMonth(new Date().getMonth() + 1);
        setSelectedMembershipYear('');
    };

    const getMembershipStatusColor = (remainingDays, isExpired) => {
        if (isExpired) return 'bg-red-100 text-red-800';
        if (remainingDays <= 7) return 'bg-yellow-100 text-yellow-800';
        if (remainingDays <= 30) return 'bg-orange-100 text-orange-800';
        return 'bg-green-100 text-green-800';
    };

    const getMembershipStatusText = (remainingDays, isExpired) => {
        if (isExpired) return 'Expired';
        if (remainingDays <= 7) return 'Expiring Soon';
        if (remainingDays <= 30) return 'Expiring This Month';
        return 'Active';
    };

    // Generate year options (current year and 5 years back)
    const getYearOptions = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = currentYear; i >= currentYear - 5; i--) {
            years.push(i);
        }
        return years;
    };

    // Generate month options
    const getMonthOptions = () => {
        const months = [
            { value: 1, label: 'January' },
            { value: 2, label: 'February' },
            { value: 3, label: 'March' },
            { value: 4, label: 'April' },
            { value: 5, label: 'May' },
            { value: 6, label: 'June' },
            { value: 7, label: 'July' },
            { value: 8, label: 'August' },
            { value: 9, label: 'September' },
            { value: 10, label: 'October' },
            { value: 11, label: 'November' },
            { value: 12, label: 'December' }
        ];
        return months;
    };

    return (
        <div
            ref={pageContainerRef}
            className={`space-y-6 ${isFullscreen ? 'h-full min-h-screen w-full bg-white overflow-auto' : ''}`}
        >
            {/* Toast container scoped to this page, positioned above fullscreen content */}
            <ToastContainer
                containerId="checkin"
                position="top-center"
                newestOnTop
                closeOnClick
                pauseOnFocusLoss={false}
                draggable
                pauseOnHover
                style={{ zIndex: 999999 }}
            />
            {/* Header Card: Search & Filters */}
            <div className="bg-white border rounded-lg p-6">
                <h2 className="text-sm font-bold text-gray-900 mb-2">Client Details & Check-in</h2>
                <p className="text-xs text-gray-500 mb-4">View client profile and manage attendance.</p>

                {/* Fullscreen Toggle */}
                <div className="mb-3">
                    <button
                        type="button"
                        onClick={toggleFullscreen}
                        className="px-3 py-1.5 text-xs rounded-md border hover:bg-gray-50"
                        title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                    >
                        {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Check-in'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
                    <div className="relative">
                        <input
                            type='number'
                            min={1}
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                            placeholder="Client ID"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                            ref={clientIdInputRef}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSearch(true);
                                }
                            }}
                        />
                    </div>
                    <div className="relative">
                        <input
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="First Name"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                        />
                    </div>
                    <div className="relative">
                        <input
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Last Name"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                        />
                    </div>
                    <div>
                        <select
                            value={selectedGym}
                            onChange={(e) => setSelectedGym(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            <option value="">All Gyms</option>
                            {gyms.map((gym) => (
                                <option key={gym.id} value={gym.id}>
                                    {gym.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => handleSearch(false)}
                            disabled={searchLoading}
                            className="px-4 py-2 bg-[#c53445] text-white rounded-lg hover:bg-[#b02e3d] disabled:opacity-50"
                        >
                            {searchLoading ? 'Searching...' : 'Search'}
                        </button>
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                            Clear
                        </button>
                    </div>
                </div>

                {/* Client Profile Card */}
                {client && (
                    <div className="bg-gray-50 border rounded-lg p-6">
                        <div className="flex items-start space-x-6">
                            {/* Client Image */}
                            <div className="flex-shrink-0">
                                <div className="relative w-80 h-96 sm:w-96 sm:h-[480px] border-[.1rem] border-white shadow-lg rounded-2xl  outline outline-2 outline-gray-200 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-200">
                                    {client.profilePictureUrl ? (
                                        <img
                                            src={getImageUrl(client.profilePictureUrl)}
                                            alt={`${client.firstName} ${client.lastName}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                            <i className="fas fa-user-circle text-7xl sm:text-8xl mb-2"></i>
                                            <span className="text-sm font-medium text-gray-500">No Photo</span>
                                        </div>
                                    )}
                                    <div className="hidden w-full h-full flex flex-col items-center justify-center text-gray-400">
                                        <i className="fas fa-user-circle text-7xl sm:text-8xl mb-2"></i>
                                        <span className="text-sm font-medium text-gray-500">No Photo</span>
                                    </div>
                                </div>
                            </div>

                            {/* Client Info */}
                            <div className="flex-1 space-y-6">
                                <div className='space-y-2 text-sm'>
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        {client.firstName} {client.lastName}
                                    </h3>
                                    <div className='flex items-center gap-2 text-xl  '>
                                        <span className=' text-2xl'>ID : </span>
                                        <span className='font-bold text-[#c53445]'>{client.id}</span>
                                    </div>
                                    <p className="text-gray-600">Email: {client.email}</p>
                                    <p className="text-gray-600">Phone: {client.phoneNumber || 'N/A'}</p>
                                    <p className="text-gray-600">Gym: {client.gym?.name || 'N/A'}</p>
                                </div>

                                {/* Membership Info */}
                                {membershipInfo && (
                                    <div className="bg-white py-10 px-8 rounded-lg border">
                                        <h4 className="font-semibold text-gray-900 mb-2">Membership Information</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-600">Status</p>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getMembershipStatusColor(membershipInfo.remainingDays, membershipInfo.isExpired)}`}>
                                                    {getMembershipStatusText(membershipInfo.remainingDays, membershipInfo.isExpired)}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Remaining Days</p>
                                                <p className="font-semibold">
                                                    {membershipInfo.isExpired ?
                                                        `${Math.abs(membershipInfo.remainingDays)} days expired` :
                                                        `${membershipInfo.remainingDays} days`
                                                    }
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Expiration Date</p>
                                                <p className="font-semibold">
                                                    {formatDMY(membershipInfo.expirationDate)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Membership Type</p>
                                                <p className="font-semibold">
                                                    {membershipInfo.membership?.type || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex justify-between px-1">
                                    <button
                                        onClick={handleAddAttendance}
                                        disabled={loading}
                                        className="px-5 py-2 text-sm h-fit bg-[#c53445] text-white rounded-3xl hover:bg-[#b02e3d] disabled:opacity-50"
                                    >
                                        {loading ? 'Recording...' : 'Add Attendance'}
                                    </button>
                                    <button
                                        onClick={openRenewModal}
                                        disabled={renewLoading}
                                        className="px-5 py-2 h-fit text-sm bg-green-500 text-white rounded-3xl hover:bg-green-600 disabled:opacity-50"
                                    >
                                        Renew Membership
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Membership History - Only show if client is found */}
            {client && (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden mx-auto" style={{ width: isFullscreen ? '95%' : '100%' }}>
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">Membership History</h3>
                                <p className="text-xs text-gray-500">Complete history of all memberships from newest to oldest.</p>
                            </div>

                            {/* Membership History Filters */}
                            <div className="flex items-center space-x-3">
                                <div>
                                    <select
                                        value={selectedMembershipYear}
                                        onChange={(e) => setSelectedMembershipYear(parseInt(e.target.value))}
                                        className="px-3 py-2 border rounded-lg text-sm"
                                    >
                                        <option value="">All Years</option>
                                        {getYearOptions().map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={refreshMembershipHistory}
                                    className="px-3 py-2 bg-[#c53445] text-white rounded-lg hover:bg-[#b02e3d] text-sm"
                                    title="Refresh membership data"
                                >
                                    <i className="fas fa-sync-alt mr-1"></i>
                                    Refresh
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredMembershipHistory.length > 0 ? (
                                    filteredMembershipHistory.map((membership, idx) => {
                                        const startDate = new Date(membership.startDate);
                                        const endDate = new Date(membership.endDate);
                                        const now = new Date();
                                        const isExpired = endDate < now;
                                        const isActive = startDate <= now && endDate >= now;
                                        const isFuture = startDate > now;

                                        const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

                                        const getStatusColor = () => {
                                            if (isExpired) return 'bg-red-100 text-red-800';
                                            if (isActive) return 'bg-green-100 text-green-800';
                                            if (isFuture) return 'bg-blue-100 text-blue-800';
                                            return 'bg-gray-100 text-gray-800';
                                        };

                                        const getStatusText = () => {
                                            if (isExpired) return 'Expired';
                                            if (isActive) return 'Active';
                                            if (isFuture) return 'Future';
                                            return 'Unknown';
                                        };

                                        return (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {formatDMY(startDate)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {formatDMY(endDate)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    MAD {membership.price}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
                                                        {getStatusText()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {durationDays} days
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                            {membershipHistory.length > 0 ?
                                                `No memberships found for ${selectedMembershipYear}` :
                                                'No membership history found'
                                            }
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Attendance History - Only show if client is found */}
            {client && (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden mx-auto" style={{ width: isFullscreen ? '95%' : '100%' }}>
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">Attendance History</h3>
                                <p className="text-xs text-gray-500">Detailed log of all client check-ins.</p>
                            </div>

                            {/* Attendance Filters */}
                            <div className="flex items-center space-x-3">
                                <div>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                        className="px-3 py-2 border rounded-lg text-sm"
                                    >
                                        {getYearOptions().map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                        className="px-3 py-2 border rounded-lg text-sm"
                                    >
                                        {getMonthOptions().map(month => (
                                            <option key={month.value} value={month.value}>{month.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gym</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredAttendance.length > 0 ? (
                                    filteredAttendance.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {formatDMY(item.checkedAt)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {new Date(item.checkedAt).toLocaleTimeString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {client.gym?.name || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Present
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                            {attendanceHistory.length > 0 ?
                                                `No attendance records found for ${getMonthOptions().find(m => m.value === selectedMonth)?.label} ${selectedYear}` :
                                                'No attendance records found'
                                            }
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Renew Membership Modal */}
            {showRenewModal && client && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white w-full max-w-md rounded-lg shadow-lg">
                        <div className="px-6 py-4 border-b">
                            <h3 className="text-lg font-semibold text-green-600">Renew Membership</h3>
                        </div>
                        <form onSubmit={handleRenewMembership} className="p-6">
                            <div className="mb-4">
                                <p className="text-gray-700 mb-4">
                                    Renew membership for <strong>{client.firstName} {client.lastName}</strong>
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={renewForm.startDate}
                                        onChange={(e) => setRenewForm({ ...renewForm, startDate: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={renewForm.endDate}
                                        onChange={(e) => setRenewForm({ ...renewForm, endDate: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                                    <input
                                        type="number"
                                        value={renewForm.price}
                                        onChange={(e) => setRenewForm({ ...renewForm, price: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeRenewModal}
                                    className="px-4 py-2 border rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={renewLoading}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                    {renewLoading ? 'Renewing...' : 'Renew Membership'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCheckInClients;
