import { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import { profilePictureUrl } from '../../config/paths';
import { toast } from 'react-toastify';

const AdminManageCoaches = () => {
    const [search, setSearch] = useState('');
    const [coaches, setCoaches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingCoach, setDeletingCoach] = useState(null);
    const [editingCoach, setEditingCoach] = useState(null);
    const [gyms, setGyms] = useState([]);
    const [specialtyFilter, setSpecialtyFilter] = useState('');
    const [gymFilter, setGymFilter] = useState('');
    const [activeOnly, setActiveOnly] = useState(false);
    // removed acceptingOnly filter per request
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        bio: '',
        specialties: '',
        certifications: '',
        services: '',
        acceptNewClients: true,
        active: true,
        gymId: ''
    });
    const [profileImage, setProfileImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        fetchCoaches();
        fetchGyms();
        fetchCoachMetrics();
    }, []);

    const fetchGyms = async () => {
        try {
            const res = await adminApi.getGyms();
            setGyms(res.data || []);
        } catch (e) {
            // ignore
        }
    };

    const [coachMetrics, setCoachMetrics] = useState(null);
    const fetchCoachMetrics = async () => {
        try {
            const res = await adminApi.getCoachMetrics();
            setCoachMetrics(res.data || null);
        } catch (e) {
            // ignore
        }
    };

    const fetchCoaches = async () => {
        try {
            setLoading(true);
            // Prefer public endpoint that returns CoachDTO with profilePictureUrl and gym
            const res = await adminApi.getAllCoachesPublic();
            setCoaches(res.data || []);
            // Also refresh metrics to keep "New This Month" accurate
            await fetchCoachMetrics();
        } catch (e) {
            toast.error('Failed to load coaches');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        try {
            setSearchLoading(true);
            const params = {};
            if (search && search.trim()) params.name = search.trim();
            if (specialtyFilter && specialtyFilter.trim()) params.specialty = specialtyFilter.trim();
            if (gymFilter) params.gymId = parseInt(gymFilter); // Convert to number for backend
            const res = await adminApi.searchCoachesPublic(params);
            let list = res.data || [];
            if (activeOnly) list = list.filter(c => c.active);
            // acceptingOnly removed per request
            setCoaches(list);
        } catch (e) {
            toast.error('Failed to search coaches');
        } finally {
            setSearchLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await adminApi.deleteCoach(id);
            toast.success('Coach deleted');
            fetchCoaches(); // This will also refresh metrics
        } catch (e) {
            toast.error('Failed to delete coach');
        }
    };

    const confirmDelete = (coach) => {
        setDeletingCoach(coach);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setDeletingCoach(null);
    };

    const openCreateModal = () => {
        setEditingCoach(null);
        setForm({ firstName: '', lastName: '', email: '', phoneNumber: '', bio: '', specialties: '', certifications: '', services: '', acceptNewClients: true, active: true, gymId: '' });
        setProfileImage(null);
        setImagePreview(null);
        setShowModal(true);
    };

    const openEditModal = (coach) => {
        setEditingCoach(coach);
        setForm({
            firstName: coach.firstName || '',
            lastName: coach.lastName || '',
            email: coach.email || '',
            phoneNumber: coach.phoneNumber || '',
            bio: coach.bio || '',
            specialties: coach.specialties || '',
            certifications: coach.certifications || '',
            services: coach.services || '',
            acceptNewClients: typeof coach.acceptNewClients === 'boolean' ? coach.acceptNewClients : true,
            active: typeof coach.active === 'boolean' ? coach.active : true,
            gymId: coach.gym?.id || ''
        });
        setProfileImage(null);
        setImagePreview(coach.profilePictureUrl ? getImageUrl(coach.profilePictureUrl) : null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setImagePreview(null);
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfileImage(file);
            const reader = new FileReader();
            reader.onload = (ev) => setImagePreview(ev.target.result);
            reader.readAsDataURL(file);
        }
    };

    const getImageUrl = (url) => {
        if (!url) return '';
        return encodeURI(profilePictureUrl(url));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const fd = new FormData();
            fd.append('firstName', form.firstName);
            fd.append('lastName', form.lastName);
            fd.append('email', form.email);
            if (form.phoneNumber) fd.append('phoneNumber', form.phoneNumber);
            if (form.bio) fd.append('bio', form.bio);
            if (form.specialties) fd.append('specialties', form.specialties);
            if (form.certifications) fd.append('certifications', form.certifications);
            if (form.services) fd.append('services', form.services);
            fd.append('acceptNewClients', form.acceptNewClients.toString());
            fd.append('active', form.active.toString());
            if (form.gymId) {
                fd.append('gymId', form.gymId);
            }
            if (profileImage) fd.append('profileImage', profileImage);

            if (editingCoach) {
                await adminApi.updateCoachMultipart(editingCoach.id, fd);
                toast.success('Coach updated');
            } else {
                await adminApi.createCoachMultipart(fd);
                toast.success('Coach created');
            }
            closeModal();
            await fetchCoaches();
        } catch (err) {
            console.error(err);
            toast.error('Failed to save coach');
        }
    };

    const statusClass = (s) => (s ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-500');

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c53445]"></div>
            </div>
        );
    }

    return (
        <div className="max-w-full space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <h1 className="text-xl font-bold text-gray-900">Manage Coaches</h1>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button className="px-3 py-2 bg-[#c53445] text-white rounded hover:bg-[#b02e3d] text-sm" onClick={openCreateModal}>Add New Coach</button>
                    <div className="relative">
                        <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Search coaches..." className="w-full sm:w-64 pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] text-sm" />
                        <i className="fas fa-search absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                    </div>
                    <button onClick={handleSearch} disabled={searchLoading} className="px-3 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 text-sm">{searchLoading ? 'Searching...' : 'Search'}</button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Specialty</label>
                    <input value={specialtyFilter} onChange={(e) => setSpecialtyFilter(e.target.value)} placeholder="e.g., strength" className="w-full px-2 py-1.5 border rounded-lg focus:ring-2 focus:ring-[#c53445] text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Gym</label>
                    <select value={gymFilter} onChange={(e) => setGymFilter(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg focus:ring-2 focus:ring-[#c53445] text-sm">
                        <option value="">All gyms</option>
                        {gyms.map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}
                    </select>
                </div>
                <div className="flex items-center space-x-2">
                    <button type="button" onClick={() => setActiveOnly(!activeOnly)} className={`relative inline-flex h-5 w-9 items-center rounded-full ${activeOnly ? 'bg-[#c53445]' : 'bg-gray-200'}`}>
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${activeOnly ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                    <span className="text-xs text-gray-700">Active only</span>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={handleSearch} className="px-2 py-1.5 border rounded hover:bg-gray-50 text-sm">Apply</button>
                    <button onClick={() => { setSpecialtyFilter(''); setGymFilter(''); setActiveOnly(false); setSearch(''); fetchCoaches(); }} className="px-2 py-1.5 border rounded hover:bg-gray-50 text-sm">Clear</button>
                </div>
            </div>

            {/* Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white border rounded-lg p-3">
                    <p className="text-xs text-gray-600">Total Coaches</p>
                    <p className="text-xl font-bold">{coaches.length}</p>
                </div>
                <div className="bg-white border rounded-lg p-3">
                    <p className="text-xs text-gray-600">Active Coaches</p>
                    <p className="text-xl font-bold">{coaches.filter(c => c.active).length}</p>
                </div>
                <div className="bg-white border rounded-lg p-3">
                    <p className="text-xs text-gray-600">New This Month</p>
                    <p className="text-xl font-bold">
                        {coachMetrics?.newCoachesThisMonth !== undefined
                            ? coachMetrics.newCoachesThisMonth
                            : (() => {
                                const now = new Date();
                                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                                const count = coaches.filter(c => {
                                    if (!c.createdAt) return false;
                                    const d = new Date(c.createdAt);
                                    return d >= startOfMonth && d <= now;
                                }).length;
                                return count;
                            })()
                        }
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Specialty</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Gym</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {coaches.map(c => (
                                <tr key={c.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 text-sm font-medium text-gray-900">
                                        <div className="flex items-center space-x-2">
                                            {c.profilePictureUrl ? (
                                                <img src={getImageUrl(c.profilePictureUrl)} alt="coach" className="w-7 h-7 rounded-full object-cover border" onError={(ev) => { ev.currentTarget.onerror = null; ev.currentTarget.src = 'https://via.placeholder.com/28?text=C'; }} />
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs"><i className="fas fa-user"></i></div>
                                            )}
                                            <div className="relative group max-w-[120px]">
                                                <span className="inline-block truncate text-xs">{c.firstName} {c.lastName}</span>
                                                <div className="absolute z-50 hidden group-hover:block left-0 top-full mt-1 whitespace-normal break-words bg-white border border-gray-300 rounded-lg shadow-lg p-2 text-xs text-gray-800 max-w-[200px]">
                                                    {c.firstName} {c.lastName}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-sm text-gray-700">
                                        <div className="relative group max-w-[140px]">
                                            <span className="block truncate text-xs">{c.email}</span>
                                            <div className="absolute z-50 hidden group-hover:block left-0 top-full mt-1 whitespace-normal break-words bg-white border border-gray-300 rounded-lg shadow-lg p-2 text-xs text-gray-800 max-w-[200px]">
                                                {c.email}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-sm text-gray-700">
                                        <div className="relative group max-w-[120px]">
                                            <span className="block truncate text-xs">{c.specialties || '-'}</span>
                                            <div className="absolute z-50 hidden group-hover:block left-0 top-full mt-1 whitespace-normal break-words bg-white border border-gray-300 rounded-lg shadow-lg p-2 text-xs text-gray-800 max-w-[200px]">
                                                {c.specialties || '-'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-sm text-gray-700">
                                        <div className="relative group max-w-[100px]">
                                            <span className="block truncate text-xs">{c.gym?.name || '-'}</span>
                                            <div className="absolute z-50 hidden group-hover:block left-0 top-full mt-1 whitespace-normal break-words bg-white border border-gray-300 rounded-lg shadow-lg p-2 text-xs text-gray-800 max-w-[200px]">
                                                {c.gym?.name || '-'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClass(c.active)}`}>{c.active ? 'Active' : 'Inactive'}</span></td>
                                    <td className="px-3 py-2 text-sm">
                                        <div className="flex space-x-2 text-[#c53445]">
                                            <button title="Edit" onClick={() => openEditModal(c)} className="text-xs"><i className="fas fa-pen"></i></button>
                                            <button title="Delete" className="text-red-600 text-xs" onClick={() => confirmDelete(c)}><i className="fas fa-trash"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-lg shadow-lg w-full h-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-semibold">{editingCoach ? 'Edit Coach' : 'Add Coach'}</h3>
                            <button onClick={closeModal} className="text-gray-500 hover:text-gray-700"><i className="fas fa-times"></i></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="flex flex-col items-center">
                                <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                                    {imagePreview ? (<img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />) : (<i className="fas fa-user text-gray-400 text-3xl"></i>)}
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
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Bio <span className="text-sm text-gray-500">({form.bio?.length || 0}/1000 characters)</span>
                                    </label>
                                    <textarea
                                        value={form.bio}
                                        onChange={(e) => setForm({ ...form, bio: e.target.value })}
                                        maxLength={1000}
                                        rows={3}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent resize-none"
                                        placeholder="Tell clients about yourself and your coaching philosophy..."
                                    />
                                    {form.bio && form.bio.length > 900 && (
                                        <p className={`text-sm mt-1 ${form.bio.length >= 1000 ? 'text-red-500' : 'text-yellow-600'}`}>
                                            {1000 - form.bio.length} characters remaining
                                        </p>
                                    )}
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Specialties</label>
                                    <input value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>
                                    <input value={form.certifications} onChange={(e) => setForm({ ...form, certifications: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Services</label>
                                    <input value={form.services} onChange={(e) => setForm({ ...form, services: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Gym</label>
                                    <select value={form.gymId} onChange={(e) => setForm({ ...form, gymId: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent">
                                        <option value="">Select a gym...</option>
                                        {gyms.map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Accepting New Clients</label>
                                    <div className="flex items-center space-x-3">
                                        <button type="button" onClick={() => setForm({ ...form, acceptNewClients: !form.acceptNewClients })} className={`relative inline-flex h-6 w-11 items-center rounded-full ${form.acceptNewClients ? 'bg-[#c53445]' : 'bg-gray-200'}`}>
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.acceptNewClients ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                        <span className="text-sm text-gray-700">{form.acceptNewClients ? 'Yes' : 'No'}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Active</label>
                                    <div className="flex items-center space-x-3">
                                        <button type="button" onClick={() => setForm({ ...form, active: !form.active })} className={`relative inline-flex h-6 w-11 items-center rounded-full ${form.active ? 'bg-[#c53445]' : 'bg-gray-200'}`}>
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.active ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                        <span className="text-sm text-gray-700">{form.active ? 'Active' : 'Inactive'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-[#c53445] text-white rounded-lg hover:bg-[#b02e3d]">{editingCoach ? 'Update Coach' : 'Create Coach'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && deletingCoach && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white w-full max-w-md rounded-lg shadow-lg">
                        <div className="px-6 py-4 border-b">
                            <h3 className="text-lg font-semibold text-red-600">Confirm Delete</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-700 mb-4">
                                Are you sure you want to delete <strong>{deletingCoach.firstName} {deletingCoach.lastName}</strong>?
                            </p>
                            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
                            <div className="flex justify-end space-x-3">
                                <button onClick={closeDeleteModal} className="px-4 py-2 border rounded-lg">Cancel</button>
                                <button
                                    onClick={() => { handleDelete(deletingCoach.id); closeDeleteModal(); }}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Delete Coach
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminManageCoaches;
