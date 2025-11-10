import { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';

const AdminGymManagement = () => {
    const [gyms, setGyms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '' });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingItem, setDeletingItem] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchGyms();
    }, []);

    const fetchGyms = async () => {
        try {
            setLoading(true);
            const res = await adminApi.getGyms();
            setGyms(res.data || []);
        } catch (e) {
            console.error('Error loading gyms:', e);
            toast.error('Failed to load gyms');
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditing(null);
        setForm({ name: '' });
        setShowModal(true);
    };

    const openEditModal = (gym) => {
        setEditing(gym);
        setForm({ name: gym.name });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditing(null);
        setForm({ name: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error('Gym name is required');
            return;
        }

        try {
            setSaving(true);
            if (editing) {
                await adminApi.updateGym(editing.id, form);
                toast.success('Gym updated successfully');
            } else {
                await adminApi.createGym(form);
                toast.success('Gym created successfully');
            }
            closeModal();
            await fetchGyms();
        } catch (e) {
            console.error('Error saving gym:', e);
            const msg = e.response?.data?.error || 'Failed to save gym';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const openDeleteModal = (gym) => {
        setDeletingItem(gym);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setDeletingItem(null);
    };

    const handleDelete = async () => {
        if (!deletingItem) return;
        try {
            setDeleting(true);
            await adminApi.deleteGym(deletingItem.id);
            toast.success('Gym deleted successfully');
            closeDeleteModal();
            await fetchGyms();
        } catch (e) {
            console.error('Delete gym error:', e);
            const msg = e.response?.data?.error || 'Failed to delete gym';
            toast.error(msg);
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[#c53445]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Manage Gyms</h1>
                <button
                    onClick={openCreateModal}
                    className="flex items-center space-x-2 px-4 py-2 bg-[#c53445] text-white rounded-lg hover:bg-[#b02e3d] transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span>Create New Gym</span>
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Gym Name
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {gyms.length > 0 ? gyms.map(gym => (
                            <tr key={gym.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {gym.id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {gym.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end space-x-2">
                                        <button
                                            onClick={() => openEditModal(gym)}
                                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors"
                                            title="Edit Gym"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => openDeleteModal(gym)}
                                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                                            title="Delete Gym"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                                    No gyms found. Create your first gym!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            {editing ? 'Edit Gym' : 'Create New Gym'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Gym Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                    placeholder="Enter gym name"
                                    required
                                />
                            </div>
                            <div className="flex items-center justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 bg-[#c53445] text-white rounded-md hover:bg-[#b02e3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    <span>{saving ? 'Saving...' : (editing ? 'Update' : 'Create')}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Gym</h2>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete the gym "{deletingItem?.name}"? This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-end space-x-3">
                            <button
                                onClick={closeDeleteModal}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                                <span>{deleting ? 'Deleting...' : 'Delete'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminGymManagement;
