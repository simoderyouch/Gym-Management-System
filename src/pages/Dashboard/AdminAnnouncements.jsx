import { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { toast } from 'react-toastify';

const AdminAnnouncements = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ title: '', content: '' });

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingItem, setDeletingItem] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const res = await adminApi.getAnnouncements();
            const list = (res.data || []).slice().sort((a, b) => {
                const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
                const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
                if (tb !== ta) return tb - ta; // newest first
                // fallback to id desc when createdAt equal/missing
                const ia = typeof a?.id === 'number' ? a.id : 0;
                const ib = typeof b?.id === 'number' ? b.id : 0;
                return ib - ia;
            });
            setAnnouncements(list);
        } catch (e) {
            console.error('Error loading announcements:', e);
            toast.error('Failed to load announcements');
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditing(null);
        setForm({ title: '', content: '' });
        setShowModal(true);
    };

    const openEditModal = (a) => {
        setEditing(a);
        setForm({ title: a.title || '', content: a.content || '' });
        setShowModal(true);
    };

    const closeModal = () => {
        if (saving) return;
        setShowModal(false);
        setEditing(null);
        setForm({ title: '', content: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) {
            toast.error('Title is required');
            return;
        }
        try {
            setSaving(true);
            const payload = { title: form.title.trim(), content: form.content?.trim() || '' };
            if (editing) {
                await adminApi.updateAnnouncement(editing.id, payload);
                toast.success('Announcement updated');
            } else {
                await adminApi.createAnnouncement(payload);
                toast.success('Announcement created');
            }
            closeModal();
            await fetchAnnouncements();
        } catch (e) {
            console.error('Save announcement error:', e);
            const msg = e.response?.data?.error || 'Failed to save announcement';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (a) => {
        setDeletingItem(a);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        if (deleting) return;
        setShowDeleteModal(false);
        setDeletingItem(null);
    };

    const handleDelete = async () => {
        if (!deletingItem) return;
        try {
            setDeleting(true);
            await adminApi.deleteAnnouncement(deletingItem.id);
            toast.success('Announcement deleted');
            closeDeleteModal();
            await fetchAnnouncements();
        } catch (e) {
            console.error('Delete announcement error:', e);
            const msg = e.response?.data?.error || 'Failed to delete announcement';
            toast.error(msg);
        } finally {
            setDeleting(false);
        }
    };

    const formatDate = (iso) => {
        if (!iso) return '-';
        try { return new Date(iso).toLocaleString(); } catch { return '-'; }
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
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
                <button onClick={openCreateModal} className="px-4 py-2 bg-[#c53445] text-white rounded hover:bg-[#b02e3d]">Create Announcement</button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {announcements.length > 0 ? announcements.map(a => (
                            <tr key={a.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-900 truncate max-w-xs">
                                    <div className="relative group">
                                        <span className="inline-block truncate max-w-xs">{a.title}</span>
                                        <div className="absolute z-50 hidden group-hover:block left-0 top-full mt-2 whitespace-normal break-words bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-sm text-gray-800 max-w-[360px]">
                                            {a.title}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700">{formatDate(a.createdAt)}</td>
                                <td className="px-6 py-4 text-right text-sm text-gray-700">
                                    <div className="inline-flex items-center space-x-3 text-[#c53445]">
                                        <button className="hover:text-[#b02e3d]" title="Edit" onClick={() => openEditModal(a)}>
                                            <i className="fas fa-pen"></i>
                                        </button>
                                        <button className="text-red-600 hover:text-red-800" title="Delete" onClick={() => confirmDelete(a)}>
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="3" className="px-6 py-4 text-center text-gray-500">No announcements found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white w-full max-w-xl rounded-lg shadow-lg overflow-hidden">
                        <div className="px-6 py-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-semibold">{editing ? 'Update Announcement' : 'Create Announcement'}</h3>
                            <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                    placeholder="Announcement title"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                                <textarea
                                    value={form.content}
                                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                                    rows={6}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent resize-y"
                                    placeholder="Write announcement details..."
                                />
                            </div>
                            <div className="flex justify-end space-x-3 pt-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-lg">Cancel</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 bg-[#c53445] text-white rounded-lg hover:bg-[#b02e3d] disabled:opacity-50">
                                    {saving ? 'Saving...' : (editing ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDeleteModal && deletingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white w-full max-w-md rounded-lg shadow-lg">
                        <div className="px-6 py-4 border-b">
                            <h3 className="text-lg font-semibold text-red-600">Confirm Delete</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-700 mb-4">Are you sure you want to delete <strong>{deletingItem.title}</strong>?</p>
                            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
                            <div className="flex justify-end space-x-3">
                                <button onClick={closeDeleteModal} className="px-4 py-2 border rounded-lg">Cancel</button>
                                <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAnnouncements;
