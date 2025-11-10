import { Link } from 'react-router-dom';
import { Star, ShoppingCart, ChevronDown, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { productApi } from '../../services/api';
import { useCart } from '../../context/CartContext';
import CartModal from '../../components/CartModal';
import CheckoutModal from '../../components/CheckoutModal';
import Header from '../../components/Layout/Header';
import { fullUrl } from '../../config/paths';

const Products = () => {
    const { addToCart, getCartCount } = useCart();
    const [selectedCategory, setSelectedCategory] = useState('All Categories');
    const [selectedPrice, setSelectedPrice] = useState('All Prices');
    const [selectedSort, setSelectedSort] = useState('Sort By');
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCartModal, setShowCartModal] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);

    // Fetch products from backend
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await productApi.getAllProducts();
            setProducts(response.data);
            setFilteredProducts(response.data);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Failed to load products. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Filter and sort products
    useEffect(() => {
        let filtered = products;

        // Filter by search term
        if (searchTerm.trim()) {
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by category
        if (selectedCategory !== 'All Categories') {
            filtered = filtered.filter(product => product.category === selectedCategory);
        }

        // Filter by price
        if (selectedPrice !== 'All Prices') {
            switch (selectedPrice) {
                case 'Under $20':
                    filtered = filtered.filter(product => product.price < 20);
                    break;
                case '$20 - $50':
                    filtered = filtered.filter(product => product.price >= 20 && product.price <= 50);
                    break;
                case 'Over $50':
                    filtered = filtered.filter(product => product.price > 50);
                    break;
                default:
                    break;
            }
        }

        // Sort products
        switch (selectedSort) {
            case 'Price: Low to High':
                filtered = [...filtered].sort((a, b) => a.price - b.price);
                break;
            case 'Price: High to Low':
                filtered = [...filtered].sort((a, b) => b.price - a.price);
                break;
            case 'Name: A to Z':
                filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'Name: Z to A':
                filtered = [...filtered].sort((a, b) => b.name.localeCompare(a.name));
                break;
            default:
                break;
        }

        setFilteredProducts(filtered);
    }, [products, searchTerm, selectedCategory, selectedPrice, selectedSort]);

    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return null;
        if (imageUrl.startsWith('http')) return imageUrl;
        return fullUrl(imageUrl);
    };

    const handleAddToCart = (product) => {
        // Check if product is out of stock
        if (product.quantity <= 0) {
            toast.error(`${product.name} is out of stock!`);
            return;
        }

        try {
            addToCart(product, 1);
            toast.success(`${product.name} added to cart!`);
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

    // Helper function to check if product is at max in cart
    const isProductAtMaxInCart = (product) => {
        const cartItems = useCart().items;
        const existingCartItem = cartItems.find(item => item.id === product.id);
        const currentCartQuantity = existingCartItem ? existingCartItem.quantity : 0;
        return product.quantity - currentCartQuantity <= 0;
    };

    // Get unique categories from products
    const categories = ['All Categories', ...new Set(products.map(product => product.category).filter(Boolean))];

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin text-[#c53445]" />
                    <span className="text-lg text-gray-600">Loading products...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={fetchProducts}
                        className="bg-[#c53445] text-white px-4 py-2 rounded-lg hover:bg-[#b02e3d] transition-colors"
                    >
                        Try Again
                    </button>
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

            {/* Promotional Banner */}
            <section className="bg-pink-50 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Elevate Your Training
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Discover our exclusive collection of fitness apparel and gear designed to boost your performance.
                    </p>
                </div>
            </section>

            {/* Products Section */}
            <section className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header with Filters */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">
                            All Products
                        </h2>

                        {/* Filter Options */}
                        <div className="flex flex-wrap gap-3">
                            {/* Search Input */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                />
                            </div>

                            {/* Category Filter */}
                            <div className="relative">
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-[#c53445] focus:border-transparent pr-8"
                                >
                                    {categories.map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                            </div>

                            {/* Price Filter */}
                            <div className="relative">
                                <select
                                    value={selectedPrice}
                                    onChange={(e) => setSelectedPrice(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-[#c53445] focus:border-transparent pr-8"
                                >
                                    <option>All Prices</option>
                                    <option>Under MAD 20</option>
                                    <option>MAD 20 - MAD 50</option>
                                    <option>Over MAD 50</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                            </div>

                            {/* Sort Filter */}
                            <div className="relative">
                                <select
                                    value={selectedSort}
                                    onChange={(e) => setSelectedSort(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-[#c53445] focus:border-transparent pr-8"
                                >
                                    <option>Sort By</option>
                                    <option>Price: Low to High</option>
                                    <option>Price: High to Low</option>
                                    <option>Name: A to Z</option>
                                    <option>Name: Z to A</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Results Count */}
                    <div className="mb-6">
                        <p className="text-gray-600">
                            Showing {filteredProducts.length} of {products.length} products
                        </p>
                    </div>

                    {/* Products Grid */}
                    {filteredProducts.length === 0 ? (
                        <div className="text-center py-12">
                            <i className="fas fa-search text-6xl text-gray-300 mb-4"></i>
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">No products found</h3>
                            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {filteredProducts.map((product) => (
                                <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                                    {/* Product Image */}
                                    <Link to={`/products/${product.id}`}>
                                        <div className="aspect-square bg-gray-200 flex items-center justify-center overflow-hidden">
                                            {product.imageUrls && product.imageUrls.length > 0 ? (
                                                <img
                                                    src={getImageUrl(product.imageUrls[0])}
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
                                                <span className="text-gray-600 text-sm">No Image</span>
                                            </div>
                                        </div>
                                    </Link>

                                    {/* Product Info */}
                                    <div className="p-4 flex flex-col h-full">
                                        <Link to={`/products/${product.id}`}>
                                            <h3 className="font-bold text-gray-900 mb-2 hover:text-[#c53445] transition-colors line-clamp-2">
                                                {product.name}
                                            </h3>
                                        </Link>
                                        {product.description && (
                                            <p className="text-gray-600 text-sm mb-3 line-clamp-1">
                                                {product.description}
                                            </p>
                                        )}
                                        <p className="text-[#c53445] font-bold text-lg mb-4">
                                            MAD {product.price.toFixed(2)}
                                        </p>

                                        {/* Add to Cart Button */}
                                        <button
                                            onClick={() => handleAddToCart(product)}
                                            disabled={product.quantity <= 0 || isProductAtMaxInCart(product)}
                                            className={`w-full mt-auto py-2 px-4 rounded-lg font-medium transition-colors ${product.quantity <= 0 || isProductAtMaxInCart(product)
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : 'bg-[#c53445] text-white hover:bg-[#b02e3d]'
                                                }`}
                                        >
                                            {product.quantity <= 0 ? 'Out of Stock' :
                                                isProductAtMaxInCart(product) ? 'Max in Cart' : 'Add to Cart'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

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

export default Products;

