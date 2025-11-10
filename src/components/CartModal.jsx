import React from 'react';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext';
import { fullUrl } from '../config/paths';

const CartModal = ({ isOpen, onClose, onOpenCheckout }) => {
    const { items, removeFromCart, updateQuantity, getCartTotal, getCartCount } = useCart();

    const handleQuantityChange = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
            toast.success('Item removed from cart');
        } else {
            try {
                updateQuantity(productId, newQuantity);
            } catch (error) {
                toast.error(error.message);
            }
        }
    };

    const handleBuyNow = () => {
        if (getCartCount() === 0) {
            toast.error('Your cart is empty');
            return;
        }
        onClose(); // Close cart modal
        onOpenCheckout(); // Open checkout modal
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-900">Shopping Cart ({getCartCount()} items)</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {items.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-gray-400 mb-4">
                                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                            <p className="text-gray-500">Add some products to get started!</p>
                        </div>
                    ) : (
                        <>
                            {/* Cart Items */}
                            <div className="space-y-4 mb-6">
                                {items.map((item) => (
                                    <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                                        {/* Product Image */}
                                        <div className="flex-shrink-0">
                                            {item.imageUrl ? (
                                                <img
                                                    src={item.imageUrl.startsWith('http') ? item.imageUrl : fullUrl(item.imageUrl)}
                                                    alt={item.name}
                                                    className="w-16 h-16 object-cover rounded"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                                                    <span className="text-gray-500 text-xs">No Image</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-medium text-gray-900 truncate">
                                                {item.name}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                MAD {item.price.toFixed(2)} each
                                            </p>
                                            {item.productQuantity && (
                                                <p className="text-xs text-gray-400">
                                                    Stock: {item.productQuantity} available
                                                </p>
                                            )}
                                        </div>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50"
                                            >
                                                <Minus className="h-3 w-3" />
                                            </button>
                                            <span className="w-8 text-center text-sm font-medium">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                disabled={item.productQuantity && item.quantity >= item.productQuantity}
                                                className={`w-8 h-8 border border-gray-300 rounded flex items-center justify-center ${item.productQuantity && item.quantity >= item.productQuantity
                                                        ? 'bg-gray-100 cursor-not-allowed'
                                                        : 'hover:bg-gray-50'
                                                    }`}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </button>
                                        </div>

                                        {/* Price and Remove */}
                                        <div className="flex flex-col items-end space-y-2">
                                            <p className="text-sm font-medium text-gray-900">
                                                MAD {(item.price * item.quantity).toFixed(2)}
                                            </p>
                                            <button
                                                onClick={() => {
                                                    removeFromCart(item.id);
                                                    toast.success('Item removed from cart');
                                                }}
                                                className="text-red-500 hover:text-red-700 transition-colors"
                                                title="Remove item"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Cart Summary */}
                            <div className="border-t pt-4">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                                    <span className="text-xl font-bold text-[#c53445]">
                                        MAD {getCartTotal().toFixed(2)}
                                    </span>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex space-x-3">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Continue Shopping
                                    </button>
                                    <button
                                        onClick={handleBuyNow}
                                        className="flex-1 bg-[#c53445] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#b02e3d] transition-colors"
                                    >
                                        Buy Now
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CartModal;
