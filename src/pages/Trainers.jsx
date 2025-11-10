import { Link } from 'react-router-dom';
import { Star, Search, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { coachApi } from '../services/api';
import { toast } from 'react-toastify';
import Header from '../components/Layout/Header';
import { profilePictureUrl } from '../config/paths';

const Trainers = () => {
    const [coaches, setCoaches] = useState([]);
    const [filteredCoaches, setFilteredCoaches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState('All Categories');
    const [selectedRating, setSelectedRating] = useState('Any Rating');
    const [selectedAvailability, setSelectedAvailability] = useState('Any Availability');

    useEffect(() => {
        fetchCoaches();
    }, []); // fetchCoaches is stable, no need to add to dependencies

    useEffect(() => {
        applyFilters();
    }, [coaches, searchTerm, selectedSpecialty, selectedRating, selectedAvailability]);

    const fetchCoaches = async () => {
        try {
            setLoading(true);
            console.log('Fetching coaches...');
            const response = await coachApi.getAvailableCoaches();
            console.log('Coaches response:', response);
            setCoaches(response.data || []);
        } catch (error) {
            console.error('Error fetching coaches:', error);
            console.error('Error details:', error.response?.data);
            console.error('Error status:', error.response?.status);
            toast.error('Failed to load coaches');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...coaches];

        // Search by name
        if (searchTerm.trim()) {
            filtered = filtered.filter(coach =>
                coach.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                coach.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by specialty
        if (selectedSpecialty !== 'All Categories') {
            filtered = filtered.filter(coach =>
                coach.specialties?.toLowerCase().includes(selectedSpecialty.toLowerCase())
            );
        }

        // Filter by rating
        if (selectedRating !== 'Any Rating') {
            const minRating = parseFloat(selectedRating.split('+')[0]);
            filtered = filtered.filter(coach =>
                coach.averageRating >= minRating
            );
        }

        // Filter by availability
        if (selectedAvailability !== 'Any Availability') {
            if (selectedAvailability === 'Available') {
                filtered = filtered.filter(coach => coach.acceptNewClients);
            } else if (selectedAvailability === 'Not Available') {
                filtered = filtered.filter(coach => !coach.acceptNewClients);
            }
        }

        setFilteredCoaches(filtered);
    };

    const renderStars = (rating) => {
        const numRating = parseFloat(rating) || 0;
        return [...Array(5)].map((_, i) => (
            <Star
                key={i}
                className={`h-4 w-4 ${i < Math.floor(numRating) ? 'text-yellow-400 fill-current' : i < numRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            />
        ));
    };

    const getImageUrl = (url) => profilePictureUrl(url);

    const getSpecialties = () => {
        const specialties = new Set();
        coaches.forEach(coach => {
            if (coach.specialties) {
                coach.specialties.split(',').forEach(specialty => {
                    specialties.add(specialty.trim());
                });
            }
        });
        return Array.from(specialties);
    };



    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c53445] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading trainers...</p>
                </div>
            </div>
        );
    }

    console.log('Trainers component rendering, coaches:', coaches.length);

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <Header />

            {/* Search and Filter Section */}
            <section className="py-8 bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Search by trainer name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="flex flex-col space-y-4">
                        {/* Specialty Filter */}
                        <div className="relative">
                            <select
                                value={selectedSpecialty}
                                onChange={(e) => setSelectedSpecialty(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                            >
                                <option>All Categories</option>
                                {getSpecialties().map(specialty => (
                                    <option key={specialty} value={specialty}>{specialty}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                        </div>

                        {/* Rating Filter */}
                        <div className="relative">
                            <select
                                value={selectedRating}
                                onChange={(e) => setSelectedRating(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                            >
                                <option>Any Rating</option>
                                <option>5.0+ Stars</option>
                                <option>4.5+ Stars</option>
                                <option>4.0+ Stars</option>
                                <option>3.5+ Stars</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                        </div>

                        {/* Availability Filter */}
                        <div className="relative">
                            <select
                                value={selectedAvailability}
                                onChange={(e) => setSelectedAvailability(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                            >
                                <option>Any Availability</option>
                                <option>Available</option>
                                <option>Not Available</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                        </div>

                        {/* Clear Filters Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedSpecialty('All Categories');
                                    setSelectedRating('Any Rating');
                                    setSelectedAvailability('Any Availability');
                                }}
                                className="text-sm border border-gray-300 rounded-3xl px-4 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trainers Grid */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-4xl font-bold text-gray-900 text-center mb-12">
                        Our Trainers
                    </h1>

                    {filteredCoaches.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">No trainers found matching your criteria.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {filteredCoaches.map((coach) => (
                                <div key={coach.id} className="bg-white h-[27rem] rounded-lg shadow-md px-0 pb-6 flex flex-col justify-between text-center hover:shadow-lg transition-shadow gap-y-0 ">
                                    {/* Coach Image */}
                                    <div className="w-full h-[55%] bg-gray-300 rounded-lg rounded-b-none mx-auto mb-4 flex items-center justify-center overflow-hidden">
                                        {coach.profilePictureUrl ? (
                                            <img
                                                src={getImageUrl(coach.profilePictureUrl)}
                                                alt={`${coach.firstName} ${coach.lastName}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <span
                                            className="text-gray-600 text-lg "
                                            style={{
                                                display: coach.profilePictureUrl ? 'none' : 'flex',
                                                textTransform: 'uppercase'
                                            }}
                                        >
                                            {coach.firstName?.[0]}{coach.lastName?.[0]}
                                        </span>
                                    </div>

                                    {/* Coach Name */}
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                        {coach.firstName} {coach.lastName}
                                    </h3>

                                    {/* Rating */}
                                    <div className="flex justify-center items-center mb-3">
                                        <div className="flex space-x-1">
                                            {renderStars(coach.averageRating)}
                                        </div>
                                        <span className="ml-2 text-lg text-gray-600">
                                            ({coach.averageRating?.toFixed(1) || '0.0'})
                                        </span>
                                    </div>

                                    {/* Specialties */}
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 ">
                                        {coach.specialties || 'No specialties listed'}
                                    </p>



                                    {/* View Profile Button */}
                                    <Link
                                        to={`/trainers/${coach.id}`}
                                        className="bg-[#c53445] w-[90%] m-auto my-0 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#b02e3d] transition-colors inline-block"
                                    >
                                        View Profile
                                    </Link>
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
        </div>
    );
};

export default Trainers;
