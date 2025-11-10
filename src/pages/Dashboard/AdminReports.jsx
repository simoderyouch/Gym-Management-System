import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    Package,
    Loader2,
    Calendar,
    Phone,
    Mail,
    MapPin
} from 'lucide-react';
import { toast } from 'react-toastify';
import { orderApi } from '../../services/api';
import { fullUrl } from '../../config/paths';

const AdminReports = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const [stats, setStats] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        confirmedOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0
    });
    const [updatingOrder, setUpdatingOrder] = useState(null);

    useEffect(() => {
        fetchOrders();
        fetchStats();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await orderApi.getAllOrders();
            console.log('Orders response:', response.data);
            setOrders(response.data);
        } catch (err) {
            console.error('Error fetching orders:', err);
            if (err.response?.status === 403) {
                setError('Access denied. Please make sure you are logged in as an admin.');
            } else {
                setError('Failed to load orders. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await orderApi.getOrderStats();
            console.log('Stats response:', response.data);
            setStats(response.data);
        } catch (err) {
            console.error('Error fetching stats:', err);
            if (err.response?.status === 403) {
                console.error('Access denied for stats. Please make sure you are logged in as an admin.');
            }
        }
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            setUpdatingOrder(orderId);
            let response;
            switch (newStatus) {
                case 'CONFIRMED':
                    response = await orderApi.confirmOrder(orderId);
                    break;
                case 'CANCELLED':
                    response = await orderApi.cancelOrder(orderId);
                    break;
                case 'COMPLETED':
                    response = await orderApi.completeOrder(orderId);
                    break;
                default:
                    return;
            }

            // Update the order in the list
            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order.id === orderId ? response.data : order
                )
            );

            // Refresh stats
            fetchStats();

            toast.success(`Order ${newStatus.toLowerCase()} successfully!`);
        } catch (error) {
            console.error('Error updating order status:', error);
            const errorMessage = error.response?.data || 'Failed to update order status.';
            toast.error(errorMessage);
        } finally {
            setUpdatingOrder(null);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'CONFIRMED':
                return 'bg-blue-100 text-blue-800';
            case 'COMPLETED':
                return 'bg-green-100 text-green-800';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'PENDING':
                return <Clock className="h-4 w-4" />;
            case 'CONFIRMED':
                return <CheckCircle className="h-4 w-4" />;
            case 'COMPLETED':
                return <Package className="h-4 w-4" />;
            case 'CANCELLED':
                return <XCircle className="h-4 w-4" />;
            default:
                return <Clock className="h-4 w-4" />;
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = searchTerm === '' ||
            (order.buyer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.buyer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.buyer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.buyer?.phoneNumber?.includes(searchTerm) ||
                order.id.toString().includes(searchTerm));

        const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin text-[#c53445]" />
                    <span className="text-lg text-gray-600">Loading orders...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                    onClick={fetchOrders}
                    className="bg-[#c53445] text-white px-4 py-2 rounded-lg hover:bg-[#b02e3d] transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Management</h1>
                    <p className="text-gray-600">Manage and track all customer orders</p>
                </div>
                <button
                    onClick={() => {
                        fetchOrders();
                        fetchStats();
                    }}
                    disabled={loading}
                    className="bg-[#c53445] text-white px-4 py-2 rounded-lg hover:bg-[#b02e3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                    <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <div className="bg-white p-4 rounded-lg shadow border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Orders</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                        </div>
                        <Package className="h-8 w-8 text-blue-500" />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Pending</p>
                            <p className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</p>
                        </div>
                        <Clock className="h-8 w-8 text-yellow-500" />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Confirmed</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.confirmedOrders}</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-blue-500" />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Completed</p>
                            <p className="text-2xl font-bold text-green-600">{stats.completedOrders}</p>
                        </div>
                        <Package className="h-8 w-8 text-green-500" />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Cancelled</p>
                            <p className="text-2xl font-bold text-red-600">{stats.cancelledOrders}</p>
                        </div>
                        <XCircle className="h-8 w-8 text-red-500" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow border mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Search orders by buyer name, email, phone, or order ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                        >
                            <option value="ALL">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Buyer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Items
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-xs font-medium text-gray-900">
                                                {order.buyer?.firstName} {order.buyer?.lastName}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {order.buyer?.email}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {order.orderItems?.length || 0} items
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        MAD {typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : order.totalAmount}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                            {getStatusIcon(order.status)}
                                            <span className="ml-1">{order.status}</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(order.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedOrder(order);
                                                    setShowOrderDetails(true);
                                                }}
                                                className="text-[#c53445] hover:text-[#b02e3d] transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>

                                            {order.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusUpdate(order.id, 'CONFIRMED')}
                                                        disabled={updatingOrder === order.id}
                                                        className="text-green-600 hover:text-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Confirm Order"
                                                    >
                                                        {updatingOrder === order.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <CheckCircle className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(order.id, 'CANCELLED')}
                                                        disabled={updatingOrder === order.id}
                                                        className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Cancel Order"
                                                    >
                                                        {updatingOrder === order.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <XCircle className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </>
                                            )}

                                            {order.status === 'CONFIRMED' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusUpdate(order.id, 'COMPLETED')}
                                                        disabled={updatingOrder === order.id}
                                                        className="text-green-600 hover:text-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Complete Order"
                                                    >
                                                        {updatingOrder === order.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Package className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(order.id, 'CANCELLED')}
                                                        disabled={updatingOrder === order.id}
                                                        className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Cancel Order"
                                                    >
                                                        {updatingOrder === order.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <XCircle className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredOrders.length === 0 && (
                    <div className="text-center py-8">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No orders found</p>
                    </div>
                )}
            </div>

            {/* Order Details Modal */}
            {showOrderDetails && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-2xl font-bold text-gray-900">
                                Order #{selectedOrder.id} Details
                            </h2>
                            <button
                                onClick={() => setShowOrderDetails(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Buyer Information */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Buyer Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm text-gray-600">
                                            {selectedOrder.buyer?.firstName} {selectedOrder.buyer?.lastName}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm text-gray-600">
                                            {selectedOrder.buyer?.phoneNumber}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm text-gray-600">
                                            {selectedOrder.buyer?.email}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm text-gray-600">
                                            {selectedOrder.buyer?.location}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                                <div className="space-y-3">
                                    {selectedOrder.orderItems?.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                {item.product?.imageUrls?.[0] ? (
                                                            <img
                                                               src={item.product.imageUrls[0].startsWith('http') ? item.product.imageUrls[0] : fullUrl(item.product.imageUrls[0])}
                                                                alt={item.product.name || 'Product'}
                                                                className="w-12 h-12 object-cover rounded"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                }}
                                                            />
                                                ) : (
                                                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                                        <Package className="h-6 w-6 text-gray-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {item.product?.name || 'Product Name Unavailable'}
                                                    </p>
                                                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                                    <p className="text-xs text-gray-500">Unit Price: MAD {typeof item.unitPrice === 'number' ? item.unitPrice.toFixed(2) : item.unitPrice}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-gray-900">MAD {typeof item.totalPrice === 'number' ? item.totalPrice.toFixed(2) : item.totalPrice}</p>
                                                <p className="text-sm text-gray-600">Total</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="border-t pt-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                                    <span className="text-xl font-bold text-[#c53445]">
                                        MAD {typeof selectedOrder.totalAmount === 'number' ? selectedOrder.totalAmount.toFixed(2) : selectedOrder.totalAmount}
                                    </span>
                                </div>
                                <div className="mt-2 text-sm text-gray-600">
                                    <p>Order Date: {formatDate(selectedOrder.createdAt)}</p>
                                    {selectedOrder.updatedAt && (
                                        <p>Last Updated: {formatDate(selectedOrder.updatedAt)}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReports;
