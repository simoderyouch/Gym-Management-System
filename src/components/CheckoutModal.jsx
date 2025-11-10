import React, { useState } from 'react';
import { X, User, Phone, Mail, MapPin, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext';
import { orderApi } from '../services/api';
import { fullUrl } from '../config/paths';

const CheckoutModal = ({ isOpen, onClose }) => {
    const { items, getCartTotal, clearCart } = useCart();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        email: '',
        location: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form
        if (!formData.firstName || !formData.lastName || !formData.phoneNumber || !formData.email || !formData.location) {
            toast.error('Please fill in all fields');
            return;
        }

        if (items.length === 0) {
            toast.error('Your cart is empty');
            return;
        }

        setLoading(true);

        try {
            const orderData = {
                buyerInfo: {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phoneNumber: formData.phoneNumber,
                    email: formData.email,
                    location: formData.location
                },
                items: items.map(item => ({
                    productId: item.id,
                    quantity: item.quantity
                }))
            };

            const response = await orderApi.createOrder(orderData);

            toast.success('Order placed successfully!');
            clearCart();
            onClose();

            // Reset form
            setFormData({
                firstName: '',
                lastName: '',
                phoneNumber: '',
                email: '',
                location: ''
            });

        } catch (error) {
            console.error('Error creating order:', error);
            const errorMessage = error.response?.data || 'Failed to place order. Please try again.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-900">Checkout</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Order Summary */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                        <div className="space-y-3">
                            {items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center">
                                    <div className="flex items-center space-x-3">
                                        {item.imageUrl && (
                                            <img
                                                src={item.imageUrl.startsWith('http') ? item.imageUrl : fullUrl(item.imageUrl)}
                                                alt={item.name}
                                                className="w-12 h-12 object-cover rounded"
                                            />
                                        )}
                                        <div>
                                            <p className="font-medium text-gray-900">{item.name}</p>
                                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                        </div>
                                    </div>
                                    <p className="font-medium text-gray-900">
                                        MAD {(item.price * item.quantity).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="border-t pt-4 mt-4">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-gray-900">Total:</span>
                                <span className="text-xl font-bold text-[#c53445]">
                                    MAD {getCartTotal().toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Buyer Information Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Buyer Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                                    First Name *
                                </label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Name *
                                </label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                                Delivery Location *
                            </label>
                            <textarea
                                id="location"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                placeholder="Enter your full address for delivery"
                                required
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-[#c53445] text-white rounded-lg hover:bg-[#b02e3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <span>Place Order</span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CheckoutModal;
