import { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { toast } from 'react-toastify';
import { fullUrl } from '../../config/paths';

const AdminShopProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [priceMax, setPriceMax] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);

    // Form
    const [form, setForm] = useState({ name: '', price: '', quantity: '', category: '', status: 'Active', description: '' });
    const [images, setImages] = useState([]);
    const [existingPreviews, setExistingPreviews] = useState([]);
    const [newPreviews, setNewPreviews] = useState([]);
    const [fileKey, setFileKey] = useState(0); // force input reset so same file can be re-selected

    // Delete
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingItem, setDeletingItem] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await adminApi.getProducts();
            setProducts(res.data || []);
        } catch (e) {
            console.error('Error loading products:', e);
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const applySearch = async () => {
        try {
            setSearchLoading(true);
            const params = {};
            if (search && search.trim()) params.q = search.trim();
            if (category && category.trim()) params.category = category.trim();
            if (priceMax && Number(priceMax) > 0) params.priceLessThan = Number(priceMax);
            const res = await adminApi.searchProducts(params);
            let list = res.data || [];
            setProducts(list);
        } catch (e) {
            console.error('Search products error:', e);
            toast.error('Failed to search products');
        } finally {
            setSearchLoading(false);
        }
    };

    const clearFilters = () => {
        setSearch('');
        setCategory('');
        setPriceMax('');
        fetchProducts();
    };

    const openCreateModal = () => {
        setEditing(null);
        setForm({ name: '', price: '', quantity: '', category: '', status: 'Active', description: '' });
        setImages([]);
        setExistingPreviews([]);
        setNewPreviews([]);
        setFileKey(k => k + 1);
        setShowModal(true);
    };

    const openEditModal = (p) => {
        setEditing(p);
        setForm({
            name: p.name || '',
            price: p.price ?? '',
            quantity: p.quantity ?? '',
            category: p.category || '',
            status: p.status || 'Active',
            description: p.description || ''
        });
        setImages([]);
    const previews = Array.isArray(p.imageUrls) ? p.imageUrls.map(u => (u.startsWith('http') ? u : fullUrl(u))) : [];
        setExistingPreviews(previews.slice(0, 4));
        setNewPreviews([]);
        setFileKey(k => k + 1);
        setShowModal(true);
    };

    const closeModal = () => {
        if (saving) return;
        setShowModal(false);
        setEditing(null);
        setForm({ name: '', price: '', quantity: '', category: '', status: 'Active', description: '' });
        setImages([]);
        setExistingPreviews([]);
        setNewPreviews([]);
        setFileKey(k => k + 1);
    };

    const onImagesChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        const availableSlots = Math.max(0, 4 - (existingPreviews.length + newPreviews.length));
        const toAdd = files.slice(0, availableSlots);
        if (!toAdd.length) return;
        setImages(prev => [...prev, ...toAdd]);
        const readers = toAdd.map(file => new Promise(resolve => {
            const r = new FileReader();
            r.onload = ev => resolve(ev.target.result);
            r.readAsDataURL(file);
        }));
        Promise.all(readers).then(previews => setNewPreviews(prev => [...prev, ...previews]));
        // reset input so same files can be picked again later
        e.target.value = '';
        setFileKey(k => k + 1);
    };

    const removeNewPreview = (idx) => {
        setNewPreviews(prev => prev.filter((_, i) => i !== idx));
        setImages(prev => prev.filter((_, i) => i !== idx));
        setFileKey(k => k + 1);
    };

    const removeExistingPreview = (idx) => {
        setExistingPreviews(prev => prev.filter((_, i) => i !== idx));
        setFileKey(k => k + 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) { toast.error('Product name is required'); return; }
        if (!String(form.price).trim() || Number(form.price) <= 0) { toast.error('Valid price is required'); return; }
        if (!String(form.quantity).trim() || Number(form.quantity) < 0) { toast.error('Valid quantity is required'); return; }
        try {
            setSaving(true);
            const fd = new FormData();
            const productPayload = {
                name: form.name.trim(),
                price: Number(form.price),
                quantity: Number(form.quantity),
                category: form.category || undefined,
                status: form.status || undefined,
                description: form.description || undefined,
            };
            fd.append('product', new Blob([JSON.stringify(productPayload)], { type: 'application/json' }));

            // Handle images for product updates
            if (editing) {
                // For updates: send new images if any, or empty array to clear existing
                if (images.length > 0) {
                    images.forEach(file => fd.append('images', file));
                } else {
                    // Send empty images array to clear existing images
                    fd.append('images', new Blob([], { type: 'application/octet-stream' }));
                }
            } else {
                // For creation: send new images if any
                if (images.length > 0) {
                    images.forEach(file => fd.append('images', file));
                }
            }
            if (editing) {
                await adminApi.updateProductMultipart(editing.id, fd);
                toast.success('Product updated');
            } else {
                await adminApi.createProductMultipart(fd);
                toast.success('Product created');
            }
            closeModal();
            await fetchProducts();
        } catch (e) {
            console.error('Save product error:', e);
            const msg = e.response?.data || e.message || 'Failed to save product';
            toast.error(String(msg));
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (item) => { setDeletingItem(item); setShowDeleteModal(true); };
    const closeDeleteModal = () => { if (!deleting) { setShowDeleteModal(false); setDeletingItem(null); } };
    const handleDelete = async () => {
        if (!deletingItem) return;
        try {
            setDeleting(true);
            await adminApi.deleteProduct(deletingItem.id);
            toast.success('Product deleted');
            closeDeleteModal();
            await fetchProducts();
        } catch (e) {
            console.error('Delete product error:', e);
            toast.error(e.response?.data?.error || 'Failed to delete product');
        } finally { setDeleting(false); }
    };

    // Status pill removed; we'll use quantity-based stock badges in the grid

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c53445]"></div>
            </div>
        );
    }

    const totalPreviewCount = existingPreviews.length + newPreviews.length;

    return (
        <div className="space-y-4">
            {/* Title row */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Shop Products</h1>
            </div>

            {/* Filter row */}
            <div className="bg-white border rounded-lg p-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                <div className="relative md:col-span-2">
                    <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applySearch()} placeholder="Search products..." className="w-full h-10 pl-10 pr-4 border rounded-lg focus:ring-2 focus:ring-[#c53445] text-sm" />
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                </div>
                <div>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-10 px-3 border rounded-lg text-sm">
                        <option value="">Category</option>
                        <option value="Cardio">Cardio</option>
                        <option value="Strength">Strength</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Supplements">Supplements</option>
                    </select>
                </div>
                <div>
                    <input type="number" min="0" step="0.01" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="Max price" className="w-full h-10 px-3 border rounded-lg text-sm" />
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={applySearch} disabled={searchLoading} className="h-10 px-4 border rounded hover:bg-gray-50 disabled:opacity-50 text-sm">{searchLoading ? '...' : 'Apply'}</button>
                    <button onClick={clearFilters} className="h-10 px-4 border rounded hover:bg-gray-50 text-sm">Clear</button>
                </div>
            </div>

            {/* Create button row */}
            <div className="flex justify-end">
                <button onClick={openCreateModal} className="px-4 py-2 bg-[#c53445] text-white rounded hover:bg-[#b02e3d]">Add New Product</button>
            </div>

            {/* Product Grid */}
            <div className="flex flex-wrap gap-[10px] items-start justify-start pt-10 border-t border-gray-100">
                {(products || []).map(p => {
                    const quantity = p.quantity ?? p.stock ?? 0;
                    const stockLabel = quantity <= 0 ? 'Out of Stock' : (quantity < 15 ? 'Low Stock' : 'In Stock');
                    const stockClass = quantity <= 0 ? 'bg-red-100 text-red-800' : (quantity < 15 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800');
                    const img0 = (p.imageUrls && p.imageUrls[0]) || '';
                    const imageUrl = img0 && img0.startsWith('http') ? img0 : (img0 ? fullUrl(img0) : '');
                    return (
                        <div key={p.id} className="bg-white border rounded-lg overflow-hidden w-[220px] flex-none h-full flex flex-col justify-start">
                            <div className="w-full bg-gray-100 h-[200px] flex items-center justify-center">
                                {imageUrl ? (
                                    <img src={imageUrl} alt="product" className="h-full w-full object-contain" onError={(ev) => { ev.currentTarget.onerror = null; ev.currentTarget.src = 'https://via.placeholder.com/240?text=Product'; }} />
                                ) : (
                                    <i className="fas fa-box text-gray-400 text-3xl"></i>
                                )}
                            </div>
                            <div className="p-4 space-y-2 flex-1 flex flex-col justify-start">
                                <h3 className="font-medium text-gray-900 truncate" title={p.name}>{p.name}</h3>
                                <p className="text-gray-700">Price: {p.price?.toLocaleString?.() ?? p.price} MAD</p>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Stock: {quantity}</span>
                                    <span className={`px-2 py-0.5 rounded ${stockClass}`}>{stockLabel}</span>
                                </div>
                                <div className="flex items-center justify-end space-x-2 pt-2">
                                    <button onClick={() => openEditModal(p)} className="px-2 py-1 border rounded text-gray-700 hover:text-[#c53445]"><i className="fas fa-edit"></i></button>
                                    <button onClick={() => confirmDelete(p)} className="px-2 py-1 border rounded text-red-600"><i className="fas fa-trash"></i></button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Centered Modal (Create/Update) */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-lg shadow-lg overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-semibold">{editing ? 'Update Product' : 'Add New Product'}</h3>
                            <button onClick={closeModal} className="text-gray-500 hover:text-gray-700"><i className="fas fa-times"></i></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
                            {/* Images */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Product Images (up to 4)</label>
                                <div className="flex flex-wrap gap-3 items-center">
                                    {existingPreviews.map((src, idx) => (
                                        <div key={`ex-${idx}`} className="relative w-28 h-28 rounded-md overflow-hidden border">
                                            <img src={src} alt="existing" className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => removeExistingPreview(idx)} className="absolute top-1 right-1 z-10 bg-gray-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow">
                                                <i className="fas fa-times text-xs"></i>
                                            </button>
                                        </div>
                                    ))}
                                    {newPreviews.map((src, idx) => (
                                        <div key={`new-${idx}`} className="relative w-28 h-28 rounded-md overflow-hidden border">
                                            <img src={src} alt="preview" className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => removeNewPreview(idx)} className="absolute top-1 right-1 z-10 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow">
                                                <i className="fas fa-times text-xs"></i>
                                            </button>
                                        </div>
                                    ))}
                                    {totalPreviewCount < 4 && (
                                        <label className="w-28 h-28 flex items-center justify-center border border-dashed rounded-md cursor-pointer text-gray-400">
                                            <i className="fas fa-plus"></i>
                                            <input key={fileKey} type="file" accept="image/*" multiple onChange={onImagesChange} className="hidden" />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (MAD)</label>
                                    <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                    <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                                        <option value="">Select category...</option>
                                        <option value="Cardio">Cardio</option>
                                        <option value="Strength">Strength</option>
                                        <option value="Accessories">Accessories</option>
                                        <option value="Supplements">Supplements</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                                        <option>Active</option>
                                        <option>Draft</option>
                                        <option>Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent" />
                            </div>

                            <div className="flex justify-end space-x-3 pt-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-lg">Cancel</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 bg-[#c53445] text-white rounded-lg hover:bg-[#b02e3d] disabled:opacity-50">{saving ? 'Saving...' : (editing ? 'Update Product' : 'Add Product')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && deletingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white w-full max-w-md rounded-lg shadow-lg">
                        <div className="px-6 py-4 border-b">
                            <h3 className="text-lg font-semibold text-red-600">Confirm Delete</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-700 mb-4">Are you sure you want to delete <strong>{deletingItem.name}</strong>?</p>
                            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
                            <div className="flex justify-end space-x-3">
                                <button onClick={closeDeleteModal} className="px-4 py-2 border rounded-lg">Cancel</button>
                                <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">{deleting ? 'Deleting...' : 'Delete'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminShopProducts;
