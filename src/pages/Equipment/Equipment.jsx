import { Link } from 'react-router-dom';
import { Star, Search, ChevronDown, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { equipmentApi } from '../../services/api';
import Header from '../../components/Layout/Header';
import { fullUrl } from '../../config/paths';

const Equipment = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All Categories');
    const [selectedStatus, setSelectedStatus] = useState('All Status');
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filteredEquipment, setFilteredEquipment] = useState([]);

    // Fetch equipment data from backend
    useEffect(() => {
        fetchEquipment();
    }, []);

    const fetchEquipment = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await equipmentApi.getAllEquipment();
            setEquipment(response.data);
            setFilteredEquipment(response.data);
        } catch (err) {
            console.error('Error fetching equipment:', err);
            setError('Failed to load equipment. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Filter equipment based on search and filter criteria
    useEffect(() => {
        let filtered = equipment;

        // Filter by search term
        if (searchTerm.trim()) {
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by category
        if (selectedCategory !== 'All Categories') {
            filtered = filtered.filter(item => item.category === selectedCategory);
        }

        // Filter by status - fix the status filtering
        if (selectedStatus !== 'All Status') {
            filtered = filtered.filter(item => {
                const itemStatus = item.status?.toLowerCase();
                const selectedStatusLower = selectedStatus.toLowerCase();

                // Handle different status formats from backend
                if (selectedStatusLower === 'available') {
                    return itemStatus === 'available';
                } else if (selectedStatusLower === 'in use') {
                    return itemStatus === 'in_use' || itemStatus === 'in use';
                } else if (selectedStatusLower === 'under maintenance') {
                    return itemStatus === 'under_maintenance' || itemStatus === 'under maintenance';
                }
                return false;
            });
        }

        setFilteredEquipment(filtered);
    }, [equipment, searchTerm, selectedCategory, selectedStatus]);

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'available':
                return 'bg-green-500 text-white';
            case 'in_use':
            case 'in use':
                return 'bg-purple-600 text-white';
            case 'under_maintenance':
            case 'under maintenance':
                return 'bg-orange-500 text-white';
            default:
                return 'bg-gray-500 text-white';
        }
    };

    const getStatusDisplay = (status) => {
        switch (status?.toLowerCase()) {
            case 'in_use':
                return 'In Use';
            case 'under_maintenance':
                return 'Under Maintenance';
            default:
                return status || 'Unknown';
        }
    };

    const getCategoryIcon = (category) => {
        switch (category?.toLowerCase()) {
            case 'cardio':
                return 'fas fa-heartbeat';
            case 'strength':
                return 'fas fa-dumbbell';
            case 'functional':
                return 'fas fa-running';
            case 'accessories':
                return 'fas fa-dumbbell';
            default:
                return 'fas fa-cog';
        }
    };

    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return null;

        // If it's already a full URL, return as is
        if (imageUrl.startsWith('http')) {
            return imageUrl;
        }

    // If it's a relative path, construct the full URL
    return fullUrl(imageUrl);
    };

    // Get unique categories from equipment data
    const categories = ['All Categories', ...new Set(equipment.map(item => item.category).filter(Boolean))];
    const statuses = ['All Status', 'Available', 'In Use', 'Under Maintenance'];

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin text-[#c53445]" />
                    <span className="text-lg text-gray-600">Loading equipment...</span>
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
                        onClick={fetchEquipment}
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

            {/* Main Content */}
            <div className="w-full mx-auto pb-12">
                {/* Title and Description - Full Width */}
                <div className="text-center mb-12 bg-[#fdf2f8] pt-12 pb-[6rem] w-full">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            Gym Equipment
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Explore our state-of-the-art gym equipment, optimized for your fitness journey. Check real-time status and find what you need.
                        </p>
                    </div>
                </div>

                {/* Content Container */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Search and Filter Bar */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Search Input */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="text"
                                    placeholder="Search equipment..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                />
                            </div>

                            {/* Category Filter */}
                            <div className="relative">
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-[#c53445] focus:border-transparent pr-8"
                                >
                                    {categories.map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                            </div>

                            {/* Status Filter */}
                            <div className="relative">
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-[#c53445] focus:border-transparent pr-8"
                                >
                                    {statuses.map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Results Count */}
                    <div className="mb-6">
                        <p className="text-gray-600">
                            Showing {filteredEquipment.length} of {equipment.length} equipment
                        </p>
                    </div>

                    {/* Equipment Grid */}
                    {filteredEquipment.length === 0 ? (
                        <div className="text-center py-12">
                            <i className="fas fa-search text-6xl text-gray-300 mb-4"></i>
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">No equipment found</h3>
                            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {filteredEquipment.map((item) => (
                                <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                    {/* Equipment Image */}
                                    <div className="aspect-square bg-gray-200 flex items-center justify-center overflow-hidden">
                                        {item.imageUrl ? (
                                            <img
                                                src={getImageUrl(item.imageUrl)}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className={`w-full h-full flex items-center justify-center ${item.imageUrl ? 'hidden' : ''}`}
                                            style={{ display: item.imageUrl ? 'none' : 'flex' }}
                                        >
                                            <i className={`${getCategoryIcon(item.category)} text-4xl text-gray-400`}></i>
                                        </div>
                                    </div>

                                    {/* Equipment Info */}
                                    <div className="p-4">
                                        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
                                            {item.name}
                                        </h3>
                                        {item.description && (
                                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                                {item.description}
                                            </p>
                                        )}
                                        <p className="text-gray-600 text-sm mb-3">
                                            <i className={`${getCategoryIcon(item.category)} mr-2`}></i>
                                            {item.category || 'Uncategorized'}
                                        </p>

                                        {/* Status */}
                                        <div className="flex flex-wrap gap-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                                {getStatusDisplay(item.status)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

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
        </div>
    );
};

export default Equipment;
