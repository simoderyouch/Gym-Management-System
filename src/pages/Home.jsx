import { Link } from 'react-router-dom';
import { Star, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { coachApi, announcementApi } from '../services/api';
import { profilePictureUrl } from '../config/paths';
import LocationMap from '../components/LocationMap';
import Header from '../components/Layout/Header';

const Home = () => {
    const [topCoaches, setTopCoaches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [announcements, setAnnouncements] = useState([]);
    const [announcementsLoading, setAnnouncementsLoading] = useState(true);
    const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
    const carouselRef = useRef(null);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        const fetchTopCoaches = async () => {
            try {
                setLoading(true);
                const response = await coachApi.getTopRatedCoaches(4);
                setTopCoaches(response.data || []);
            } catch (error) {
                console.error('Error fetching top coaches:', error);
                // Fallback to empty array if API fails
                setTopCoaches([]);
            } finally {
                setLoading(false);
            }
        };

        const fetchAnnouncements = async () => {
            try {
                setAnnouncementsLoading(true);
                console.log('Fetching announcements from /announcements/latest...');

                const response = await announcementApi.getLatestAnnouncements();
                console.log('Announcements response:', response);

                if (response && response.data && response.data.length > 0) {
                    setAnnouncements(response.data);
                    console.log('Announcements set:', response.data);
                } else {
                    console.log('No announcements data in response, using fallback');
                    // Fallback announcements for testing
                    setAnnouncements([
                        {
                            id: 1,
                            title: "New Group Classes Launching!",
                            content: "We're excited to announce our new group fitness classes starting next week. Join us for HIIT, Yoga, and Strength Training sessions.",
                            createdAt: new Date().toISOString()
                        },
                        {
                            id: 2,
                            title: "Gym Equipment Upgrade",
                            content: "We've just installed brand new cardio machines and weightlifting equipment. Come check out our upgraded facilities!",
                            createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
                        },
                        {
                            id: 3,
                            title: "Personal Training Special Offer",
                            content: "Get 20% off your first month of personal training sessions. Limited time offer - book now!",
                            createdAt: new Date(Date.now() - 172800000).toISOString() // 2 days ago
                        }
                    ]);
                }

            } catch (error) {
                console.error('Error fetching announcements:', error);
                console.error('Error response:', error.response);
                console.error('Error status:', error.response?.status);
                console.error('Error data:', error.response?.data);
                setAnnouncements([]);
            } finally {
                setAnnouncementsLoading(false);
            }
        };

        fetchTopCoaches();
        fetchAnnouncements();
    }, []);

    const nextAnnouncement = () => {
        setCurrentAnnouncementIndex((prev) =>
            prev === announcements.length - 1 ? 0 : prev + 1
        );
    };

    const prevAnnouncement = () => {
        setCurrentAnnouncementIndex((prev) =>
            prev === 0 ? announcements.length - 1 : prev - 1
        );
    };

    // Auto-scroll effect for the carousel using requestAnimationFrame for smoother animation
    useEffect(() => {
        if (announcements.length === 0 || isPaused) return;

        let animationId;
        let lastTime = 0;
        const targetFPS = 60;
        const frameInterval = 1000 / targetFPS;

        const animate = (currentTime) => {
            if (carouselRef.current && !isPaused) {
                if (currentTime - lastTime >= frameInterval) {
                    const scrollAmount = 1;
                    carouselRef.current.scrollLeft += scrollAmount;

                    // Check if we've scrolled to the end of the first set (1/3 of total width)
                    const firstSetWidth = carouselRef.current.scrollWidth / 3;
                    if (carouselRef.current.scrollLeft >= firstSetWidth) {
                        // Instantly jump back to the beginning without animation
                        carouselRef.current.style.scrollBehavior = 'auto';
                        carouselRef.current.scrollLeft = 0;
                        // Re-enable smooth scrolling after a brief moment
                        setTimeout(() => {
                            if (carouselRef.current) {
                                carouselRef.current.style.scrollBehavior = 'smooth';
                            }
                        }, 10);
                    }
                    lastTime = currentTime;
                }
            }
            animationId = requestAnimationFrame(animate);
        };

        animationId = requestAnimationFrame(animate);

        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }, [announcements, isPaused]);

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <Header />

            {/* Hero Section */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Left Content */}
                        <div>
                            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                                Unleash Your Potential at{' '}
                                <span className="text-[#c53445]">ASEDR</span>
                            </h1>
                            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                                Join a community dedicated to strength, wellness, and achieving your fitness goals with expert guidance and state-of-the-art facilities.
                            </p>
                            <Link
                                to="/register"
                                className="bg-[#c53445] text-white px-8 py-3 rounded-[4rem] text-sm font-semibold hover:bg-[#b02e3d] transition-colors inline-block"
                            >
                                Join Now
                            </Link>
                        </div>

                        {/* Right Image */}
                        <div className="relative">
                            <div className=" rounded-2xl p-6 aspect-[4/3] flex items-center justify-center overflow-hidden">
                                <img
                                    src="/src/assets/image.png"
                                    alt="Gym Image"
                                    className="w-full h-full object-cover rounded-xl"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Meet Our Top Trainers Section */}
            <section className="py-20 mx-3 rounded-2xl bg-gray-50 border-[.1rem] border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className=" mb-16">
                        <h2 className="text-4xl font-bold text-gray-700 mb-4">
                            Meet Our Top Trainers
                        </h2>
                    </div>

                    {/* Trainer Cards */}
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-[#c53445]" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-9 mb-12">
                            {topCoaches.map((coach) => (
                                <div key={coach.id} className="bg-white rounded-lg shadow-sm border-[.1rem] border-gray-200 p-6 text-center flex flex-col h-full">
                                    <div className="w-40 h-40 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                                        {coach.profilePictureUrl ? (
                                            <img
                                                src={profilePictureUrl(coach.profilePictureUrl)}
                                                alt={`${coach.firstName} ${coach.lastName}`}
                                                className="w-40 h-40 object-cover rounded-full"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div className={`w-full h-full flex items-center justify-center ${coach.profilePictureUrl ? 'hidden' : 'flex'}`}>
                                            <div className="w-12 h-12 bg-[#c53445] rounded-full flex items-center justify-center">
                                                <span className="text-white font-bold text-lg">
                                                    {coach.firstName ? coach.firstName.charAt(0).toUpperCase() : 'C'}
                                                    {coach.lastName ? coach.lastName.charAt(0).toUpperCase() : 'O'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                                        {coach.firstName} {coach.lastName}
                                    </h3>
                                    <div className="flex justify-center items-center mb-3">
                                        <div className="flex space-x-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`h-4 w-4 ${i < Math.floor(coach.averageRating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                                />
                                            ))}
                                        </div>
                                        <span className="ml-2 text-sm text-gray-600">
                                            ({coach.averageRating ? coach.averageRating.toFixed(1) : '0.0'})
                                        </span>
                                    </div>
                                    <p className="text-gray-600 text-sm mb-4 flex-grow line-clamp-4">
                                        {coach.bio || coach.specialties || 'Specialized fitness coach helping clients achieve their goals with personalized training programs.'}
                                    </p>
                                    <div className="mt-auto">
                                        <Link
                                            to={`/trainers/${coach.id}`}
                                            className="text-[#c53445] text-sm font-medium hover:text-[#b02e3d] border-[.08rem] hover:bg-[#c53445] hover:text-white border-[#c53445] rounded-lg px-6 py-2 inline-block transition-all duration-200"
                                        >
                                            View Profile
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Discover More Button */}
                    <div className="text-center">
                        <Link
                            to="/trainers"
                            className="bg-white border-[.08rem] border-[#c53445] text-[#c53445] px-8 py-3 rounded-[9rem] text-sm font-semibold hover:bg-[#c53445] transition-colors inline-block hover:bg-[#c53445] hover:text-white"
                        >
                            Discover More Trainers
                        </Link>
                    </div>
                </div>
            </section>

            {/* Latest Announcements Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Latest Announcements
                        </h2>

                    </div>

                    {announcementsLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-[#c53445]" />
                        </div>
                    ) : announcements.length > 0 ? (
                        <div className="relative overflow-hidden  ">
                            {/* Carousel Container */}
                            <div
                                ref={carouselRef}
                                className="flex gap-6 overflow-x-auto scrollbar-hide py-4 carousel-smooth"
                                style={{
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none'
                                }}
                                onMouseEnter={() => setIsPaused(true)}
                                onMouseLeave={() => setIsPaused(false)}
                            >
                                {/* Duplicate announcements for seamless loop - using 3 sets for smoother transition */}
                                {[...announcements, ...announcements, ...announcements].map((announcement, index) => (
                                    <div
                                        key={`${announcement.id}-${index}`}
                                        className="rounded-lg shadow-md p-6 flex flex-col h-full min-w-[350px] max-w-[350px] flex-shrink-0 border border-gray-100 carousel-card  bg-[#fdf2f8] bg-opacity-30 "
                                    >
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                                            {announcement.title || 'No Title'}
                                        </h3>
                                        <p className="text-[#c53445] text-sm font-medium mb-3">
                                            {announcement.createdAt
                                                ? new Date(announcement.createdAt).toLocaleDateString('en-US', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })
                                                : 'No Date'
                                            }
                                        </p>
                                        <p className="text-gray-700 text-sm leading-relaxed flex-grow line-clamp-4">
                                            {announcement.content || 'No content available.'}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Gradient overlays for smooth edges */}
                            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent pointer-events-none z-10"></div>
                            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none z-10"></div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">No announcements available at the moment.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Location Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Our Location
                        </h2>
                        <p className="text-gray-600 mb-8">
                            Ouled Zmam, Fkih Ben Saleh, Morocco
                        </p>
                        <LocationMap />
                        <div className="mt-6 text-sm text-gray-500">
                            <p>📍 Located in the beautiful village of Ouled Zmam, near Fkih Ben Saleh</p>
                            <p className="mt-2">🚗 Easy access from major roads • 🅿️ Free parking available</p>
                        </div>
                    </div>
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

export default Home;
