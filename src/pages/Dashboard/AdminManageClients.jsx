import { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import { signupApi } from '../../services/signupApi';
import { toast } from 'react-toastify';
import { profilePictureUrl } from '../../config/paths';

const AdminManageClients = () => {
    const [search, setSearch] = useState('');
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingClient, setDeletingClient] = useState(null);
    const [editingClient, setEditingClient] = useState(null);
    const [gyms, setGyms] = useState([]);
    // Import CSV state
    const [importFile, setImportFile] = useState(null);
    const [importFileName, setImportFileName] = useState('');
    const [importLoading, setImportLoading] = useState(false);
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        gymId: '',
        // Optional membership fields
        membershipStartDate: '',
        membershipEndDate: '',
        membershipPrice: ''
    });
    const [profileImage, setProfileImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [showRenewModal, setShowRenewModal] = useState(false);
    const [renewingClient, setRenewingClient] = useState(null);
    const [renewForm, setRenewForm] = useState({
        startDate: '',
        endDate: '',
        price: 100
    });
    const [submitting, setSubmitting] = useState(false);

    // Signup requests state
    const [showSignupRequestsModal, setShowSignupRequestsModal] = useState(false);
    const [signupRequests, setSignupRequests] = useState([]);
    const [signupRequestsLoading, setSignupRequestsLoading] = useState(false);
    const [processingRequestId, setProcessingRequestId] = useState(null);
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [processAction, setProcessAction] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        fetchClients();
        fetchGyms();
    }, []);

    const fetchGyms = async () => {
        try {
            const response = await adminApi.getGyms();
            setGyms(response.data || []);
        } catch (error) {
            console.error('Error fetching gyms:', error);
        }
    };

    const fetchClients = async () => {
        try {
            setLoading(true);
            const response = await adminApi.searchClients({});
            setClients(response.data || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
            toast.error('Failed to load clients');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!search.trim()) {
            fetchClients();
            return;
        }

        try {
            setSearchLoading(true);
            const response = await adminApi.searchClients({ name: search });
            setClients(response.data || []);
        } catch (error) {
            console.error('Error searching clients:', error);
            toast.error('Failed to search clients');
        } finally {
            setSearchLoading(false);
        }
    };

    const handleDeleteClient = async (clientId) => {
        try {
            await adminApi.deleteClient(clientId);
            toast.success('Client deleted successfully');
            fetchClients(); // Refresh the list
        } catch (error) {
            console.error('Error deleting client:', error);
            toast.error('Failed to delete client');
        }
    };

    const confirmDelete = (client) => {
        setDeletingClient(client);
        setShowDeleteModal(true);
    };

    const getMembershipStatus = (client) => {
        if (!client.membership) return 'No Membership';
        const now = new Date();
        const endDate = new Date(client.membership.endDate);
        if (endDate < now) return 'Expired';
        return 'Active';
    };

    const shouldShowRenewButton = (client) => {
        if (!client.membership) return true; // No membership, can renew
        const now = new Date();
        const endDate = new Date(client.membership.endDate);
        const oneDayFromNow = new Date();
        oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

        // Show renew button if membership is expired or expires within 1 day
        return endDate <= oneDayFromNow;
    };

    const openRenewModal = (client) => {
        setRenewingClient(client);
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
        setRenewingClient(null);
        setRenewForm({
            startDate: '',
            endDate: '',
            price: 100
        });
    };

    const handleRenewMembership = async (e) => {
        e.preventDefault();
        if (!renewingClient) return;

        try {
            await adminApi.renewMembership(renewingClient.id, renewForm);
            toast.success('Membership renewed successfully');
            closeRenewModal();
            fetchClients(); // Refresh the list
        } catch (error) {
            console.error('Error renewing membership:', error);
            toast.error('Failed to renew membership');
        }
    };

    const statusClass = (status) => {
        if (status === 'Active') return 'bg-green-100 text-green-800';
        if (status === 'Expired') return 'bg-red-100 text-red-800';
        return 'bg-yellow-100 text-yellow-800';
    };

    // Signup requests functions
    const fetchSignupRequests = async () => {
        try {
            setSignupRequestsLoading(true);
            const response = await signupApi.getPendingSignupRequests();
            setSignupRequests(response.data || []);
        } catch (error) {
            console.error('Error fetching signup requests:', error);
            toast.error('Failed to load signup requests');
        } finally {
            setSignupRequestsLoading(false);
        }
    };

    const openSignupRequestsModal = () => {
        setShowSignupRequestsModal(true);
        fetchSignupRequests();
    };

    const closeSignupRequestsModal = () => {
        setShowSignupRequestsModal(false);
        setSignupRequests([]);
    };

    const openProcessModal = (request, action) => {
        setSelectedRequest(request);
        setProcessAction(action);
        setRejectionReason('');
        setShowProcessModal(true);
    };

    const closeProcessModal = () => {
        setShowProcessModal(false);
        setSelectedRequest(null);
        setProcessAction('');
        setRejectionReason('');
    };

    const handleProcessRequest = async () => {
        if (!selectedRequest) return;

        if (processAction === 'reject' && !rejectionReason.trim()) {
            toast.error('Please provide a rejection reason');
            return;
        }

        try {
            setProcessingRequestId(selectedRequest.id);
            await signupApi.processSignupRequest({
                requestId: selectedRequest.id,
                action: processAction,
                rejectionReason: processAction === 'reject' ? rejectionReason : null
            });

            const actionText = processAction === 'approve' ? 'approved' : 'rejected';
            toast.success(`Signup request ${actionText} successfully`);

            closeProcessModal();
            fetchSignupRequests(); // Refresh the list
            if (processAction === 'approve') {
                fetchClients(); // Refresh clients list if approved
            }
        } catch (error) {
            console.error('Error processing signup request:', error);
            const errorMessage = error.response?.data?.error || 'Failed to process signup request';
            toast.error(errorMessage);
        } finally {
            setProcessingRequestId(null);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const openCreateModal = () => {
        setEditingClient(null);
        setForm({
            firstName: '',
            lastName: '',
            email: '',
            phoneNumber: '',
            gymId: '',
            // Optional membership fields
            membershipStartDate: '',
            membershipEndDate: '',
            membershipPrice: ''
        });
        setProfileImage(null);
        setImagePreview(null);
        setShowModal(true);
    };

    const openEditModal = (client) => {
        setEditingClient(client);
        setForm({
            firstName: client.firstName || '',
            lastName: client.lastName || '',
            email: client.email || '',
            phoneNumber: client.phoneNumber || '',
            gymId: client.gym?.id || '',
            // Membership fields not used for editing
            membershipStartDate: '',
            membershipEndDate: '',
            membershipPrice: ''
        });
        setProfileImage(null);
        setImagePreview(client.profilePictureUrl ? getImageUrl(client.profilePictureUrl) : null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setImagePreview(null);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setDeletingClient(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('firstName', form.firstName);
            fd.append('lastName', form.lastName);
            fd.append('email', form.email);
            if (form.phoneNumber) fd.append('phoneNumber', form.phoneNumber);
            if (form.gymId) {
                // For create, backend expects nested binding as gym.id
                if (editingClient) {
                    fd.append('gymId', form.gymId);
                } else {
                    fd.append('gym.id', form.gymId);
                }
            }
            if (profileImage) fd.append('profileImage', profileImage);

            // Add optional membership fields for creation only
            if (!editingClient) {
                if (form.membershipStartDate) fd.append('membershipStartDate', form.membershipStartDate);
                if (form.membershipEndDate) fd.append('membershipEndDate', form.membershipEndDate);
                if (form.membershipPrice) fd.append('membershipPrice', form.membershipPrice);
            }

            if (editingClient) {
                const res = await adminApi.updateClientMultipart(editingClient.id, fd);
                toast.success('Client updated');
            } else {
                const res = await adminApi.createClientMultipart(fd);
                toast.success('Client created');
            }
            closeModal();
            // Ensure we fetch the fresh list with backend-generated profilePictureUrl
            await fetchClients();
        } catch (err) {
            console.error('Save client error', err);
            toast.error('Failed to save client');
        } finally {
            setSubmitting(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfileImage(file);
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const getImageUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return encodeURI(profilePictureUrl(url));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c53445]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Manage Clients</h1>
            <div className="flex flex-col space-y-4">

                {/* First row: Search + Add Client */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Search clients..."
                                className="w-72 pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445]"
                            />
                            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        </div>
                        <button
                            onClick={handleSearch}
                            disabled={searchLoading}
                            className="px-4 py-2  text-black border border-gray-300 rounded hover:border-[#c53445] disabled:opacity-50"
                        >
                            {searchLoading ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                    <button onClick={openCreateModal} className="px-4 py-2 bg-[#c53445] text-white rounded hover:bg-[#b02e3d]">Add Client</button>
                </div>
                {/* Second row: Import CSV + Signup Requests */}
                <div className="flex items-center justify-between">
                    {/* Import CSV – choose file, show name, validate, upload with loading */}
                    <div className="flex items-center space-x-2">
                        <label className="px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <i className="fas fa-file-import mr-2"></i>
                            {importFileName || 'Import CSV'}
                            <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setImportFile(file);
                                    setImportFileName(file.name);
                                }}
                            />
                        </label>
                        <button
                            disabled={!importFile || importLoading}
                            onClick={async () => {
                                if (!importFile) return;
                                try {
                                    // Light client-side validation of CSV content
                                    const text = await importFile.text();
                                    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
                                    if (lines.length === 0) throw new Error('CSV is empty');
                                    const first = lines[0];
                                    const firstLower = first.toLowerCase();
                                    // Detect header if it contains at least required field names
                                    const hasHeader = firstLower.includes('firstname') && firstLower.includes('email');
                                    let headerMap = {};
                                    if (hasHeader) {
                                        const cols = first.split(',').map(c => c.trim());
                                        cols.forEach((c, idx) => (headerMap[c.toLowerCase()] = idx));
                                        // Validate header columns
                                        const required = ['firstname', 'lastname', 'email'];
                                        const optional = ['phonenumber', 'gymid', 'startdate', 'enddate', 'price'];
                                        const allowed = new Set([...required, ...optional]);
                                        const unknown = cols
                                            .map(c => c.trim())
                                            .filter(c => c.length > 0 && !allowed.has(c.toLowerCase()));
                                        const headerErrors = [];
                                        // Required presence
                                        required.forEach(r => { if (headerMap[r] === undefined) headerErrors.push(`Missing required column '${r}' in header`); });
                                        // Unknowns
                                        unknown.forEach(u => headerErrors.push(`Unknown/unsupported column '${u}' in header`));
                                        // Helpful hint if price was renamed
                                        if (headerMap['price'] === undefined) headerErrors.push("Optional column 'price' is missing – did you rename it? If you used a different name (e.g., 'hahha'), rename back to 'price'.");
                                        if (headerErrors.length) {
                                            const preview = headerErrors.slice(0, 8).map(e => `- ${e}`).join('\n');
                                            toast.error(`CSV header issues in ${importFileName || 'selected file'}:\n${preview}`);
                                            setImportLoading(false);
                                            return;
                                        }
                                    }
                                    const dataLines = hasHeader ? lines.slice(1) : lines;
                                    if (dataLines.length === 0) throw new Error('No data rows found');
                                    // validate first few rows
                                    const errors = [];
                                    const sample = dataLines.slice(0, Math.min(10, dataLines.length));
                                    sample.forEach((l, idx) => {
                                        const parts = l.split(',');
                                        const rowNum = idx + 1 + (hasHeader ? 1 : 0);
                                        // Resolve indices (header aware or positional fallback)
                                        const idxFirst = hasHeader ? headerMap['firstname'] : 0;
                                        const idxLast = hasHeader ? headerMap['lastname'] : 1;
                                        const idxEmail = hasHeader ? headerMap['email'] : 2;
                                        const idxStart = hasHeader ? headerMap['startdate'] : 5;
                                        const idxEnd = hasHeader ? headerMap['enddate'] : 6;
                                        const idxPrice = hasHeader ? headerMap['price'] : 7;
                                        if (idxFirst === undefined || idxLast === undefined || idxEmail === undefined) {
                                            errors.push(`Row ${rowNum}: missing required data for firstName/lastName/email`);
                                            return;
                                        }
                                        const email = parts[idxEmail]?.trim();
                                        if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
                                            errors.push(`Row ${rowNum}: invalid 'email' value -> ${email || 'empty'}`);
                                        }
                                        const start = parts[idxStart]?.trim();
                                        const end = parts[idxEnd]?.trim();
                                        if (start) {
                                            const sd = Date.parse(start);
                                            if (isNaN(sd)) errors.push(`Row ${rowNum}: invalid 'startDate' value -> ${start}`);
                                            if (end) {
                                                const ed = Date.parse(end);
                                                if (isNaN(ed)) {
                                                    errors.push(`Row ${rowNum}: invalid 'endDate' value -> ${end}`);
                                                } else if (ed <= sd) {
                                                    errors.push(`Row ${rowNum}: 'endDate' (${end}) must be after 'startDate' (${start})`);
                                                }
                                            }
                                        }
                                        const price = parts[idxPrice]?.trim();
                                        if (price) {
                                            const priceNum = Number(price);
                                            if (isNaN(priceNum)) {
                                                errors.push(`Row ${rowNum}: 'price' must be numeric -> ${price}`);
                                            } else if (priceNum < 0) {
                                                errors.push(`Row ${rowNum}: 'price' cannot be negative -> ${price}`);
                                            }
                                        }
                                    });
                                    if (errors.length) {
                                        const preview = errors.slice(0, 8).map(e => `- ${e}`).join('\n');
                                        const more = errors.length > 8 ? `\n...and ${errors.length - 8} more` : '';
                                        toast.error(`CSV validation failed in ${importFileName || 'selected file'} (${errors.length} issue${errors.length > 1 ? 's' : ''})\n${preview}${more}\nExpected columns: firstName,lastName,email,phoneNumber?,gymId?,startDate?,endDate?,price?`);
                                        setImportLoading(false);
                                        return;
                                    }
                                    setImportLoading(true);
                                    const fd = new FormData();
                                    fd.append('file', importFile);
                                    toast.info('Uploading and importing clients...');
                                    await adminApi.importClients(fd);
                                    toast.success('Import completed');
                                    setImportFile(null);
                                    setImportFileName('');
                                    await fetchClients();
                                } catch (err) {
                                    console.error('Import failed', err);
                                    toast.error(err?.response?.data?.error || 'Failed to import clients');
                                } finally {
                                    setImportLoading(false);
                                }
                            }}
                            className={`px-4 py-2 rounded text-white ${importLoading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} disabled:opacity-50`}
                        >
                            {importLoading ? (<span className="inline-flex items-center"><span className="animate-spin mr-2"><i className="fas fa-circle-notch"></i></span>Importing...</span>) : 'Upload'}
                        </button>
                    </div>
                    <button onClick={openSignupRequestsModal} className="px-4 py-2  border text-gray-600 rounded-full rounded hover:bg-gray-100 flex items-center">
                        <i className="fas fa-user-plus mr-2"></i>
                        Signup Requests
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscription Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {clients.length > 0 ? (
                                clients.map(client => {
                                    const status = getMembershipStatus(client);
                                    return (
                                        <tr key={client.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                {client.profilePictureUrl ? (
                                                    <img
                                                        src={getImageUrl(client.profilePictureUrl)}
                                                        alt="client"
                                                        className="w-10 h-10 rounded-full object-cover border"
                                                        onError={(e) => {
                                                            // Graceful fallback if a single image fails to load
                                                            e.currentTarget.onerror = null;
                                                            e.currentTarget.src = 'https://via.placeholder.com/40?text=C';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                                                        <i className="fas fa-user"></i>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{client.id}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {client.firstName} {client.lastName}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{client.email}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusClass(status)}`}>
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex space-x-3 text-[#c53445]">
                                                    <button title="Edit" onClick={() => openEditModal(client)}><i className="fas fa-pen"></i></button>
                                                    {shouldShowRenewButton(client) && (
                                                        <button
                                                            title="Renew Membership"
                                                            className="text-green-600 hover:text-green-800"
                                                            onClick={() => openRenewModal(client)}
                                                        >
                                                            <i className="fas fa-sync-alt"></i>
                                                        </button>
                                                    )}
                                                    <button
                                                        title="Delete"
                                                        className="text-red-600 hover:text-red-800"
                                                        onClick={() => confirmDelete(client)}
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                        No clients found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 h-full -translate-y-6 z-50 flex items-center justify-center bg-black/30">
                    {/* Fullscreen container to match spec: overlay + centered form card */}
                    <div className="bg-white rounded-lg shadow-lg w-full h-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-semibold">{editingClient ? 'Edit Client' : 'Add Client'}</h3>
                            <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Avatar and upload */}
                            <div className="flex flex-col items-center">
                                <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <i className="fas fa-user text-gray-400 text-3xl"></i>
                                    )}
                                </div>
                                <label className="mt-3 inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium cursor-pointer hover:bg-gray-50">
                                    <i className="fas fa-cloud-upload-alt mr-2"></i>
                                    Upload Photo
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                    <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                    <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Gym</label>
                                    <select value={form.gymId} onChange={(e) => setForm({ ...form, gymId: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent">
                                        <option value="">Select a gym...</option>
                                        {gyms.map(gym => (
                                            <option key={gym.id} value={gym.id}>{gym.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Optional Membership Section - Only show for creating new clients */}
                            {!editingClient && (
                                <div className="border-t pt-6">
                                    <h4 className="text-md font-medium text-gray-900 mb-4">
                                        Optional Membership Setup
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Leave these fields empty to use default membership (1 month from today, $100)
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                            <input
                                                type="date"
                                                value={form.membershipStartDate}
                                                onChange={(e) => setForm({ ...form, membershipStartDate: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                            <input
                                                type="date"
                                                value={form.membershipEndDate}
                                                onChange={(e) => setForm({ ...form, membershipEndDate: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                                            <input
                                                type="number"
                                                value={form.membershipPrice}
                                                onChange={(e) => setForm({ ...form, membershipPrice: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                                min="0"
                                                step="0.01"
                                                placeholder="100.00"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end space-x-3 pt-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-lg" disabled={submitting}>Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-[#c53445] text-white rounded-lg hover:bg-[#b02e3d] disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2" disabled={submitting}>
                                    {submitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span>{editingClient ? 'Updating...' : 'Creating...'}</span>
                                        </>
                                    ) : (
                                        <span>{editingClient ? 'Update Client' : 'Create Client'}</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && deletingClient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white w-full max-w-md rounded-lg shadow-lg">
                        <div className="px-6 py-4 border-b">
                            <h3 className="text-lg font-semibold text-red-600">Confirm Delete</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-700 mb-4">
                                Are you sure you want to delete <strong>{deletingClient.firstName} {deletingClient.lastName}</strong>?
                            </p>
                            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
                            <div className="flex justify-end space-x-3">
                                <button onClick={closeDeleteModal} className="px-4 py-2 border rounded-lg">
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        handleDeleteClient(deletingClient.id);
                                        closeDeleteModal();
                                    }}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Delete Client
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Renew Membership Modal */}
            {showRenewModal && renewingClient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white w-full max-w-md rounded-lg shadow-lg">
                        <div className="px-6 py-4 border-b">
                            <h3 className="text-lg font-semibold text-green-600">Renew Membership</h3>
                        </div>
                        <form onSubmit={handleRenewMembership} className="p-6">
                            <div className="mb-4">
                                <p className="text-gray-700 mb-4">
                                    Renew membership for <strong>{renewingClient.firstName} {renewingClient.lastName}</strong>
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
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    Renew Membership
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Signup Requests Modal */}
            {showSignupRequestsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-lg shadow-lg overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Signup Requests</h3>
                            <button onClick={closeSignupRequestsModal} className="text-gray-500 hover:text-gray-700">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            {signupRequestsLoading ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c53445]"></div>
                                </div>
                            ) : signupRequests.length === 0 ? (
                                <div className="text-center py-8">
                                    <i className="fas fa-inbox text-4xl text-gray-400 mb-4"></i>
                                    <p className="text-gray-500">No pending signup requests</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-3 px-4 font-medium text-gray-900">Name</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-900">Phone</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-900">Bio</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-900">Submitted</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {signupRequests.map((request) => (
                                                <tr key={request.id} className="border-b hover:bg-gray-50">
                                                    <td className="py-3 px-4">
                                                        <div className="font-medium text-gray-900">
                                                            {request.firstName} {request.lastName}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-600">{request.email}</td>
                                                    <td className="py-3 px-4 text-gray-600">{request.phone}</td>
                                                    <td className="py-3 px-4 text-gray-600">
                                                        {request.bio ? (
                                                            <div className="max-w-xs truncate" title={request.bio}>
                                                                {request.bio}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400">No bio</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-600 text-sm">
                                                        {formatDate(request.createdAt)}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => openProcessModal(request, 'approve')}
                                                                disabled={processingRequestId === request.id}
                                                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                                                            >
                                                                {processingRequestId === request.id ? '...' : 'Approve'}
                                                            </button>
                                                            <button
                                                                onClick={() => openProcessModal(request, 'reject')}
                                                                disabled={processingRequestId === request.id}
                                                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                                                            >
                                                                {processingRequestId === request.id ? '...' : 'Reject'}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Process Request Modal */}
            {showProcessModal && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white w-full max-w-md rounded-lg shadow-lg">
                        <div className="px-6 py-4 border-b">
                            <h3 className="text-lg font-semibold">
                                {processAction === 'approve' ? 'Approve' : 'Reject'} Signup Request
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="mb-4">
                                <p className="text-gray-700 mb-2">
                                    <strong>Name:</strong> {selectedRequest.firstName} {selectedRequest.lastName}
                                </p>
                                <p className="text-gray-700 mb-2">
                                    <strong>Email:</strong> {selectedRequest.email}
                                </p>
                                <p className="text-gray-700 mb-4">
                                    <strong>Phone:</strong> {selectedRequest.phone}
                                </p>
                            </div>

                            {processAction === 'approve' ? (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                    <p className="text-green-800 text-sm">
                                        <strong>Approve this request?</strong><br />
                                        A client account will be created and welcome email with credentials will be sent.
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Rejection Reason (Required)
                                    </label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        rows={3}
                                        maxLength={500}
                                        placeholder="Please provide a reason for rejection..."
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                        required
                                    />
                                    <p className="text-sm text-gray-500 mt-1">{rejectionReason.length}/500</p>
                                </div>
                            )}

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={closeProcessModal}
                                    disabled={processingRequestId === selectedRequest.id}
                                    className="px-4 py-2 border rounded-lg disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleProcessRequest}
                                    disabled={processingRequestId === selectedRequest.id}
                                    className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 ${processAction === 'approve'
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-red-600 hover:bg-red-700'
                                        }`}
                                >
                                    {processingRequestId === selectedRequest.id
                                        ? 'Processing...'
                                        : (processAction === 'approve' ? 'Approve' : 'Reject')
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminManageClients;
