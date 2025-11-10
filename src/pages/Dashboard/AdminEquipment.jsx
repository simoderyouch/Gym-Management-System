import { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { toast } from 'react-toastify';
import { fullUrl } from '../../config/paths';

const AdminEquipment = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [q, setQ] = useState('');
    const [category, setCategory] = useState('');
    const [status, setStatus] = useState('');
    const [condition, setCondition] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);

    // Form
    const [form, setForm] = useState({ name: '', category: '', status: 'available', condition: 'new', description: '' });
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState('');

    // Delete state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingItem, setDeletingItem] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => { fetchList(); }, []);

    const fetchList = async () => {
        try {
            setLoading(true);
            const res = await adminApi.getEquipment({ name: q || undefined, category: category || undefined, status: status || undefined, condition: condition || undefined });
            setItems(res.data || []);
        } catch (e) {
            console.error('Load equipment error:', e);
            toast.error('Failed to load equipment');
        } finally { setLoading(false); }
    };

    const applySearch = async () => {
        try {
            setSearchLoading(true);
            await fetchList();
        } finally { setSearchLoading(false); }
    };

    const clearFilters = async () => {
        setQ(''); setCategory(''); setStatus(''); setCondition('');
        await fetchList();
    };

    const openCreate = () => {
        setEditing(null);
        setForm({ name: '', category: '', status: 'available', condition: 'new', description: '' });
        setImage(null); setPreview('');
        setShowModal(true);
    };

    const openEdit = (it) => {
        setEditing(it);
        setForm({
            name: it.name || '',
            category: it.category || '',
            status: it.status || 'available',
            condition: it.condition || 'new',
            description: it.description || ''
        });
        setImage(null);
        setPreview(it.imageUrl ? (it.imageUrl.startsWith('http') ? it.imageUrl : fullUrl(it.imageUrl)) : '');
        setShowModal(true);
    };

    const closeModal = () => { if (!saving) { setShowModal(false); setEditing(null); setImage(null); setPreview(''); } };

    const onImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImage(file);
        const r = new FileReader(); r.onload = ev => setPreview(ev.target.result); r.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) { toast.error('Name is required'); return; }
        try {
            setSaving(true);
            const fd = new FormData();
            // Backend EquipmentController expects @ModelAttribute Equipment with optional image
            fd.append('name', form.name.trim());
            if (form.category) fd.append('category', form.category);
            if (form.status) fd.append('status', form.status);
            if (form.condition) fd.append('equipmentCondition', form.condition);
            if (form.description) fd.append('description', form.description);
            if (image) fd.append('image', image);

            if (editing) {
                await adminApi.updateEquipment(editing.id, fd);
                toast.success('Equipment updated');
            } else {
                await adminApi.createEquipment(fd);
                toast.success('Equipment created');
            }
            closeModal();
            await fetchList();
        } catch (e) {
            console.error('Save equipment error:', e);
            toast.error('Failed to save equipment');
        } finally { setSaving(false); }
    };

    const confirmDelete = (it) => { setDeletingItem(it); setShowDeleteModal(true); };
    const closeDelete = () => { if (!deleting) { setShowDeleteModal(false); setDeletingItem(null); } };
    const handleDelete = async () => {
        if (!deletingItem) return;
        try {
            setDeleting(true);
            await adminApi.deleteEquipment(deletingItem.id);
            toast.success('Equipment deleted');
            closeDelete();
            await fetchList();
        } catch (e) {
            console.error('Delete equipment error:', e);
            toast.error('Failed to delete equipment');
        } finally { setDeleting(false); }
    };

    const statusPill = (s) => s?.toLowerCase() === 'available' ? 'bg-[#c53445] text-white' : s?.toLowerCase() === 'in_use' || s === 'In Use' ? 'bg-purple-600 text-white' : 'bg-orange-500 text-white';
    const categoryIcon = (c) => c?.toLowerCase() === 'cardio' ? 'fas fa-heartbeat' : c?.toLowerCase() === 'strength' ? 'fas fa-dumbbell' : c?.toLowerCase() === 'functional' ? 'fas fa-running' : 'fas fa-dumbbell';

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
                <h1 className="text-2xl font-bold text-gray-900">Manage Equipment</h1>
                <button onClick={openCreate} className="px-4 py-2 bg-[#c53445] text-white rounded hover:bg-[#b02e3d]">Add New Equipment</button>
            </div>

            {/* Filter bar (mirrors public) */}
            <div className="bg-white border rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                <div className="relative">
                    <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applySearch()} placeholder="Search equipment..." className="w-full h-10 pl-10 pr-4 border rounded-lg focus:ring-2 focus:ring-[#c53445] text-sm" />
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                </div>
                <div>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-10 px-3 border rounded-lg text-sm">
                        <option value="">All Categories</option>
                        <option>Cardio</option>
                        <option>Strength</option>
                        <option>Functional</option>
                        <option>Accessories</option>
                    </select>
                </div>
                <div>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full h-10 px-3 border rounded-lg text-sm">
                        <option value="">All Status</option>
                        <option value="Available">Available</option>
                        <option value="In_Use">In Use</option>
                        <option value="Under_Maintenance">Under Maintenance</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full h-10 px-3 border rounded-lg text-sm">
                        <option value="">All Conditions</option>
                        <option>New</option>
                        <option>Used</option>
                    </select>
                    <button onClick={applySearch} disabled={searchLoading} className="h-10 px-4 border rounded hover:bg-gray-50 disabled:opacity-50 text-sm">{searchLoading ? '...' : 'Apply'}</button>
                    <button onClick={clearFilters} className="h-10 px-4 border rounded hover:bg-gray-50 text-sm">Clear</button>
                </div>
            </div>

            {/* Cards */}
            <div className="flex flex-wrap gap-[30px] items-start justify-start">
                {items.map((it) => {
                    const img = it.imageUrl ? (it.imageUrl.startsWith('http') ? it.imageUrl : fullUrl(it.imageUrl)) : '';
                    return (
                        <div key={it.id} className="bg-white rounded-lg shadow-sm border overflow-hidden w-[260px] flex-none">
                            <div className="w-full bg-gray-100 h-[180px] flex items-center justify-center">
                                {img ? (<img src={img} alt="equipment" className="h-full w-full object-cover" onError={(ev) => { ev.currentTarget.onerror = null; ev.currentTarget.src = 'https://via.placeholder.com/260?text=Equipment'; }} />) : (<i className={`${categoryIcon(it.category)} text-4xl text-gray-400`}></i>)}
                            </div>
                            <div className="p-4 space-y-2">
                                <h3 className="font-bold text-gray-900 truncate" title={it.name}>{it.name}</h3>
                                <p className="text-gray-600 text-sm"><i className={`${categoryIcon(it.category)} mr-2`}></i>{it.category || '-'}</p>
                                <div className="flex items-center justify-between">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusPill(it.status)}`}>
                                        {it.status === 'in_use'
                                            ? 'In Use'
                                            : it.status === 'under_maintenance'
                                                ? 'Under Maintenance'
                                                : 'Available'
                                        }
                                    </span>
                                    <div className="flex items-center gap-2 text-[#c53445]">
                                        <button title="Edit" onClick={() => openEdit(it)} className="px-2 py-1 border rounded text-gray-700 hover:text-[#c53445]"><i className="fas fa-edit"></i></button>
                                        <button title="Delete" onClick={() => confirmDelete(it)} className="px-2 py-1 border rounded text-red-600"><i className="fas fa-trash"></i></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Create/Update Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-lg shadow-lg overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-semibold">{editing ? 'Update Equipment' : 'Add New Equipment'}</h3>
                            <button onClick={closeModal} className="text-gray-500 hover:text-gray-700"><i className="fas fa-times"></i></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                                <div className="flex items-center gap-3">
                                    <div className="w-28 h-28 rounded-md overflow-hidden border bg-gray-50 flex items-center justify-center">
                                        {preview ? (<img src={preview} alt="preview" className="w-full h-full object-cover" />) : (<i className="fas fa-image text-gray-400"></i>)}
                                    </div>
                                    <label className="px-4 py-2 border rounded-md text-sm font-medium cursor-pointer hover:bg-gray-50">
                                        <i className="fas fa-cloud-upload-alt mr-2"></i>Upload
                                        <input type="file" accept="image/*" onChange={onImageChange} className="hidden" />
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                                        <option value="">Select category...</option>
                                        <option>Cardio</option>
                                        <option>Strength</option>
                                        <option>Functional</option>
                                        <option>Accessories</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                                        <option value="available">Available</option>
                                        <option value="in_use">In Use</option>
                                        <option value="under_maintenance">Under Maintenance</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                                    <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                                        <option value="new">New</option>
                                        <option value="used">Used</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent" />
                            </div>

                            <div className="flex justify-end space-x-3 pt-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-lg">Cancel</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 bg-[#c53445] text-white rounded-lg hover:bg-[#b02e3d] disabled:opacity-50">{saving ? 'Saving...' : (editing ? 'Update Equipment' : 'Add Equipment')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && deletingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white w-full max-w-md rounded-lg shadow-lg">
                        <div className="px-6 py-4 border-b"><h3 className="text-lg font-semibold text-red-600">Confirm Delete</h3></div>
                        <div className="p-6">
                            <p className="text-gray-700 mb-4">Delete <strong>{deletingItem.name}</strong>?</p>
                            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
                            <div className="flex justify-end gap-3">
                                <button onClick={closeDelete} className="px-4 py-2 border rounded-lg">Cancel</button>
                                <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">{deleting ? 'Deleting...' : 'Delete'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminEquipment;
