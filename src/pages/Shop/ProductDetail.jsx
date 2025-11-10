import { Link, useParams } from 'react-router-dom';
import { Star, ShoppingCart, Minus, Plus, Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { productApi } from '../../services/api';
import { useCart } from '../../context/CartContext';
import CartModal from '../../components/CartModal';
import CheckoutModal from '../../components/CheckoutModal';
import Header from '../../components/Layout/Header';
import { fullUrl } from '../../config/paths';

const ProductDetail = () => {
    const { productId } = useParams();
    const { addToCart, getCartCount, items: cartItems } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCartModal, setShowCartModal] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);

    // Fetch product data from backend
    useEffect(() => {
        if (productId) {
            fetchProduct();
        }
    }, [productId]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await productApi.getProductById(productId);
            setProduct(response.data);

            // Fetch related products (same category)
            if (response.data.category) {
                const relatedResponse = await productApi.searchProducts({ category: response.data.category });
                const filteredRelated = relatedResponse.data
                    .filter(p => p.id !== response.data.id)
                    .slice(0, 4);
                setRelatedProducts(filteredRelated);
            }
        } catch (err) {
            console.error('Error fetching product:', err);
            setError('Failed to load product. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return null;
        if (imageUrl.startsWith('http')) return imageUrl;
        return fullUrl(imageUrl);
    };

    const increaseQuantity = () => {
        if (!product) return;

        console.log('Increase quantity clicked. Current quantity:', quantity);
        console.log('Cart items:', cartItems);
        console.log('Product:', product);

        // Get current cart quantity for this product
        const existingCartItem = cartItems.find(item => item.id === product.id);
        const currentCartQuantity = existingCartItem ? existingCartItem.quantity : 0;

        // Calculate how many more can be added
        const availableToAdd = product.quantity - currentCartQuantity;

        console.log('Available to add:', availableToAdd, 'Current cart quantity:', currentCartQuantity);

        if (quantity < availableToAdd) {
            setQuantity(prev => prev + 1);
            console.log('Quantity increased to:', quantity + 1);
        } else {
            toast.error(`You can only add ${availableToAdd} more to your cart (${currentCartQuantity} already in cart)`);
        }
    };

    const decreaseQuantity = () => {
        console.log('Decrease quantity clicked. Current quantity:', quantity);
        setQuantity(prev => {
            const newQuantity = prev > 1 ? prev - 1 : 1;
            console.log('Quantity decreased to:', newQuantity);
            return newQuantity;
        });
    };

    const handleAddToCart = () => {
        // Check if product is out of stock
        if (product.quantity <= 0) {
            toast.error(`${product.name} is out of stock!`);
            return;
        }

        try {
            addToCart(product, quantity);
            toast.success(`${quantity} ${product.name} added to cart!`);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleOpenCart = () => {
        setShowCartModal(true);
    };

    const handleOpenCheckout = () => {
        setShowCheckoutModal(true);
    };

    // Helper function to get available quantity considering cart
    const getAvailableQuantity = () => {
        if (!product) return 0;
        const existingCartItem = cartItems.find(item => item.id === product.id);
        const currentCartQuantity = existingCartItem ? existingCartItem.quantity : 0;
        return product.quantity - currentCartQuantity;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin text-[#c53445]" />
                    <span className="text-lg text-gray-600">Loading product...</span>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error || 'Product not found'}</p>
                    <Link
                        to="/shop"
                        className="bg-[#c53445] text-white px-4 py-2 rounded-lg hover:bg-[#b02e3d] transition-colors"
                    >
                        Back to Shop
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <Header />

            {/* Cart Button - Additional to Header */}
            <div className="absolute top-28 right-7 z-10">
                <button
                    onClick={handleOpenCart}
                    className="relative bg-[#c53445] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#b02e3d] transition-colors"
                >
                    <ShoppingCart className="h-5 w-5 inline mr-1" />
                    Cart
                    {getCartCount() > 0 && (
                        <span className="absolute -top-2 -right-2 bg-white text-[#c53445] text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                            {getCartCount()}
                        </span>
                    )}
                </button>
            </div>

            {/* Main Product Section */}
            <section className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Product Images */}
                        <div>
                            {/* Main Image */}
                            <div className="bg-gray-200 rounded-lg h-[584px] flex items-center justify-center mb-4 overflow-hidden">
                                {product.imageUrls && product.imageUrls.length > 0 ? (
                                    <img
                                        src={getImageUrl(product.imageUrls[selectedImage])}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div
                                    className={`w-full h-full flex items-center justify-center ${product.imageUrls && product.imageUrls.length > 0 ? 'hidden' : ''}`}
                                    style={{ display: product.imageUrls && product.imageUrls.length > 0 ? 'none' : 'flex' }}
                                >
                                    <span className="text-gray-600 text-lg">No Image Available</span>
                                </div>
                            </div>

                            {/* Thumbnail Gallery */}
                            {product.imageUrls && product.imageUrls.length > 1 && (
                                <div className="grid grid-cols-4 gap-2">
                                    {product.imageUrls.map((imageUrl, index) => (
                                        <div
                                            key={index}
                                            className={`bg-gray-200 rounded-lg h-20 flex items-center justify-center cursor-pointer overflow-hidden ${selectedImage === index ? 'ring-2 ring-[#c53445]' : ''
                                                }`}
                                            onClick={() => setSelectedImage(index)}
                                        >
                                            <img
                                                src={getImageUrl(imageUrl)}
                                                alt={`${product.name} ${index + 1}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                            <div className="hidden w-full h-full flex items-center justify-center">
                                                <span className="text-gray-600 text-xs">Thumb {index + 1}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Product Details */}
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                {product.name}
                            </h1>
                            <p className="text-[#c53445] font-bold text-2xl mb-6">
                                MAD {product.price.toFixed(2)}
                            </p>
                            {product.description && (
                                <p className="text-gray-600 leading-relaxed mb-8">
                                    {product.description}
                                </p>
                            )}

                            {/* Product Info */}
                            <div className="mb-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-sm font-medium text-gray-500">Category</span>
                                        <p className="text-gray-900">{product.category || 'Uncategorized'}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-500">Status</span>
                                        <p className="text-gray-900 capitalize">{product.status || 'Available'}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-500">Stock</span>
                                        <p className="text-gray-900">
                                            {getAvailableQuantity()} available
                                            {(() => {
                                                const existingCartItem = cartItems.find(item => item.id === product.id);
                                                return existingCartItem ? ` (${existingCartItem.quantity} in cart)` : '';
                                            })()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Quantity Selector */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-900 mb-2">
                                    Quantity:
                                </label>
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={decreaseQuantity}
                                        className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50"
                                    >
                                        <Minus className="h-4 w-4" />
                                    </button>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => {
                                            const newQuantity = parseInt(e.target.value) || 1;

                                            // Get current cart quantity for this product
                                            const existingCartItem = cartItems.find(item => item.id === product.id);
                                            const currentCartQuantity = existingCartItem ? existingCartItem.quantity : 0;

                                            // Calculate how many more can be added
                                            const availableToAdd = product.quantity - currentCartQuantity;

                                            if (newQuantity > availableToAdd) {
                                                toast.error(`You can only add ${availableToAdd} more to your cart (${currentCartQuantity} already in cart)`);
                                                setQuantity(availableToAdd);
                                            } else {
                                                setQuantity(Math.max(1, newQuantity));
                                            }
                                        }}
                                        className="w-16 text-center border border-gray-300 rounded py-1"
                                        min="1"
                                        max={(() => {
                                            const existingCartItem = cartItems.find(item => item.id === product.id);
                                            const currentCartQuantity = existingCartItem ? existingCartItem.quantity : 0;
                                            return product.quantity - currentCartQuantity;
                                        })()}
                                    />
                                    <button
                                        onClick={increaseQuantity}
                                        className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={product.quantity <= 0 || getAvailableQuantity() <= 0}
                                    className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${product.quantity <= 0 || getAvailableQuantity() <= 0
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-[#c53445] text-white hover:bg-[#b02e3d]'
                                        }`}
                                >
                                    {product.quantity <= 0 ? 'Out of Stock' :
                                        getAvailableQuantity() <= 0 ? 'Maximum in Cart' : 'Add to Cart'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <section className="py-12 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
                            You Might Also Like
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {relatedProducts.map((relatedProduct) => (
                                <Link
                                    key={relatedProduct.id}
                                    to={`/products/${relatedProduct.id}`}
                                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                                >
                                    <div className="aspect-square bg-gray-200 flex items-center justify-center overflow-hidden">
                                        {relatedProduct.imageUrls && relatedProduct.imageUrls.length > 0 ? (
                                            <img
                                                src={getImageUrl(relatedProduct.imageUrls[0])}
                                                alt={relatedProduct.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className={`w-full h-full flex items-center justify-center ${relatedProduct.imageUrls && relatedProduct.imageUrls.length > 0 ? 'hidden' : ''}`}
                                            style={{ display: relatedProduct.imageUrls && relatedProduct.imageUrls.length > 0 ? 'none' : 'flex' }}
                                        >
                                            <span className="text-gray-600 text-sm">No Image</span>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
                                            {relatedProduct.name}
                                        </h3>
                                        <p className="text-[#c53445] font-bold">
                                            MAD {relatedProduct.price.toFixed(2)}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <p className="text-gray-300 mb-4 md:mb-0">© All rights are reserved.</p>
                        <div className="flex space-x-4">
                            <a href="https://www.facebook.com/simo.jumtek" target="_blank" rel="noreferrer" className="text-gray-300 hover:text-white">
                                <span className="sr-only">Facebook</span>
                                <i className="fab fa-facebook text-2xl"></i>
                            </a>
                            <a href="https://www.instagram.com/simofabyano/" target="_blank" rel="noreferrer" className="text-gray-300 hover:text-white">
                                <span className="sr-only">Instagram</span>
                                <i className="fab fa-instagram text-2xl"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Cart Modal */}
            <CartModal
                isOpen={showCartModal}
                onClose={() => setShowCartModal(false)}
                onOpenCheckout={handleOpenCheckout}
            />

            {/* Checkout Modal */}
            <CheckoutModal
                isOpen={showCheckoutModal}
                onClose={() => setShowCheckoutModal(false)}
            />
        </div>
    );
};

export default ProductDetail;
