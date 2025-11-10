import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, MessageCircle, Calendar, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { coachApi, bookingApi, chatApi } from '../../services/api';
import { toast } from 'react-toastify';
import Header from '../../components/Layout/Header';
import { profilePictureUrl } from '../../config/paths';

const TrainerProfile = () => {
    const { trainerId } = useParams();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [coach, setCoach] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [myReview, setMyReview] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showChatModal, setShowChatModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    // Form states
    const [bookingForm, setBookingForm] = useState({
        requestedDateTime: '',
        sessionType: 'Personal Training',
        durationMinutes: 60,
        notes: ''
    });

    const [chatForm, setChatForm] = useState({
        message: ''
    });

    const [reviewForm, setReviewForm] = useState({
        rating: 5,
        comment: ''
    });

    useEffect(() => {
        fetchCoachData();
        fetchReviews();
    }, [trainerId, user]); // Use user instead of isAuthenticated to avoid function reference issues

    const fetchCoachData = async () => {
        try {
            setLoading(true);
            const response = await coachApi.getCoachById(trainerId);
            setCoach(response.data);

            // Fetch user's review for this coach if authenticated
            if (isAuthenticated() && user?.role === 'client') {
                try {
                    const reviewResponse = await coachApi.getMyReviewForCoach(trainerId);
                    setMyReview(reviewResponse.data);
                } catch (error) {
                    // No review exists yet
                    setMyReview(null);
                }
            }
        } catch (error) {
            console.error('Error fetching coach data:', error);
            toast.error('Failed to load trainer profile');
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async () => {
        try {
            console.log('Fetching reviews for coach:', trainerId);
            const response = await coachApi.getCoachReviews(trainerId);
            console.log('Reviews response:', response);
            setReviews(response.data || []);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            console.error('Error details:', error.response?.data);
            console.error('Error status:', error.response?.status);
            // Don't show error toast for reviews as they should be public
            setReviews([]);
        }
    };

    const handleBookingClick = () => {
        if (!isAuthenticated() || user?.role !== 'client') {
            setShowLoginModal(true);
            return;
        }
        setShowBookingModal(true);
    };

    const handleChatClick = () => {
        if (!isAuthenticated() || user?.role !== 'client') {
            setShowLoginModal(true);
            return;
        }
        setShowChatModal(true);
    };

    const handleReviewClick = () => {
        if (!isAuthenticated() || user?.role !== 'client') {
            setShowLoginModal(true);
            return;
        }

        // If updating existing review, populate form with current data
        if (myReview) {
            setReviewForm({
                rating: myReview.rating,
                comment: myReview.comment
            });
        } else {
            // Reset form for new review
            setReviewForm({
                rating: 5,
                comment: ''
            });
        }

        setShowReviewModal(true);
    };

    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        try {
            await bookingApi.requestBooking({
                coachId: parseInt(trainerId),
                requestedDateTime: bookingForm.requestedDateTime, // Backend expects requestedDateTime
                sessionType: bookingForm.sessionType,
                durationMinutes: bookingForm.durationMinutes,
                notes: bookingForm.notes
            });
            toast.success('Booking request sent successfully!');
            setShowBookingModal(false);
            setBookingForm({
                requestedDateTime: '',
                sessionType: 'Personal Training',
                durationMinutes: 60,
                notes: ''
            });
        } catch (error) {
            console.error('Error submitting booking:', error);
            toast.error(error.response?.data?.error || 'Failed to send booking request');
        }
    };

    const handleChatSubmit = async (e) => {
        e.preventDefault();
        try {
            await chatApi.sendMessage({
                coachId: parseInt(trainerId),
                content: chatForm.message
            });
            toast.success('Message sent successfully!');
            setShowChatModal(false);
            setChatForm({ message: '' });
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        try {
            if (myReview) {
                await coachApi.updateReview(myReview.id, {
                    coachId: parseInt(trainerId),
                    rating: reviewForm.rating,
                    comment: reviewForm.comment
                });
                toast.success('Review updated successfully!');
            } else {
                await coachApi.createReview({
                    coachId: parseInt(trainerId),
                    rating: reviewForm.rating,
                    comment: reviewForm.comment
                });
                toast.success('Review added successfully!');
            }
            setShowReviewModal(false);
            setReviewForm({ rating: 5, comment: '' });
            fetchReviews();
            fetchCoachData(); // Refresh coach data to update average rating
        } catch (error) {
            console.error('Error submitting review:', error);
            toast.error('Failed to submit review');
        }
    };

    const renderStars = (rating) => {
        const numRating = parseFloat(rating) || 0;
        return [...Array(5)].map((_, i) => (
            <Star
                key={i}
                className={`h-5 w-5 ${i < Math.floor(numRating) ? 'text-yellow-400 fill-current' : i < numRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            />
        ));
    };

    const renderReviewStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <Star
                key={i}
                className={`h-6 w-6 cursor-pointer ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                onClick={() => setReviewForm({ ...reviewForm, rating: i + 1 })}
            />
        ));
    };

    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return profilePictureUrl(url);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c53445] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading trainer profile...</p>
                </div>
            </div>
        );
    }

    if (!coach) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Trainer Not Found</h1>
                    <Link to="/trainers" className="text-[#c53445] hover:text-[#b02e3d]">
                        Back to Trainers
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <Header />

            {/* Hero Section */}
            <section className="py-16 bg-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row items-start gap-12">
                        {/* Trainer Image */}
                        <div className="w-full lg:w-1/3">
                            <div className="w-full aspect-square bg-gray-300 rounded-2xl overflow-hidden">
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
                                <div
                                    className="hidden w-full h-full items-center justify-center text-gray-600 text-6xl font-bold"
                                    style={{ display: coach.profilePictureUrl ? 'none' : 'flex' }}
                                >
                                    {coach.firstName?.[0]}{coach.lastName?.[0]}
                                </div>
                            </div>
                        </div>

                        {/* Trainer Info */}
                        <div className="w-full flex flex-col  lg:w-2/3 space-y-10 border rounded-lg translate-y-5 py-10 px-5">
                            {/* Name and Rating */}
                            <div className='translate-y-[4.5rem]' >
                                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                                    Coach {coach.firstName} {coach.lastName}
                                </h1>
                                <div className="flex items-center space-x-4 mb-4">
                                    <div className="flex items-center space-x-1">
                                        {renderStars(coach.averageRating)}
                                        <span className="ml-2 text-lg text-gray-600">
                                            ({coach.averageRating?.toFixed(1) || '0.0'})
                                        </span>
                                    </div>
                                    <span className="text-gray-500">•</span>
                                    <span className="text-gray-600">{reviews.length} reviews</span>
                                </div>
                            </div>

                            {/* Tagline */}
                            <p className="text-xl text-gray-700 leading-relaxed">
                            </p>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-end">
                                <button
                                    onClick={handleBookingClick}
                                    className="flex items-center text-sm justify-center space-x-2 bg-[#c53445] text-white px-8 py-3 rounded-full font-medium hover:bg-[#b02e3d] transition-colors"
                                >
                                    <Calendar className="h-5 w-5" />
                                    <span>Book Session</span>
                                </button>
                                <button
                                    onClick={handleChatClick}
                                    className="flex items-center justify-center space-x-2 bg-gray-500 text-sm text-white px-8 py-3 rounded-full font-medium hover:bg-gray-600 transition-colors"
                                >
                                    <MessageCircle className="h-5 w-5" />
                                    <span>Chat</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section className="pt-6">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="space-y-10">
                        {/* About */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                About Coach {coach.firstName} {coach.lastName}
                            </h2>
                            <p className="text-gray-700 leading-relaxed">
                                {coach.bio || `With over 10 years of experience in fitness and wellness, Coach ${coach.firstName} specializes in functional training, strength building, and endurance coaching. Taking a holistic approach to fitness, ${coach.firstName} creates customized workout plans tailored to individual goals and needs. Whether you're a beginner or an advanced athlete, ${coach.firstName} is dedicated to helping you achieve your fitness goals and maintain a healthy lifestyle.`}
                            </p>
                        </div>

                        {/* Specialties */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Specialties</h2>
                            <div className="flex flex-wrap gap-3">
                                {coach.specialties ? (
                                    coach.specialties.split(',').map((specialty, index) => (
                                        <span
                                            key={index}
                                            className="px-8 py-2 bg-gray-100 text-gray-800 rounded-full  text-sm font-medium border"
                                        >
                                            {specialty.trim()}
                                        </span>
                                    ))
                                ) : (
                                    <span className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm font-medium">
                                        Personal Training
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Certifications Section */}
            <section className="py-16 bg-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Certifications</h2>
                    <div className="space-y-4">
                        {coach.certifications ? (
                            coach.certifications.split(',').map((cert, index) => (
                                <div key={index} className="flex items-center space-x-3 pl-10  flex flex-row items-center">
                                    <div className="w-4 h-1 bg-[#c53445] rounded-full"></div>
                                    <span className="text-gray-700 -translate-y-[.15rem]">{cert.trim()}</span>
                                </div>
                            ))
                        ) : (
                            <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-[#c53445] rounded-full"></div>
                                <span className="text-gray-700">Certified Personal Trainer</span>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Reviews Section */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Client Reviews</h2>
                        <button
                            onClick={handleReviewClick}
                            className="flex items-center space-x-2 bg-[#c53445] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#b02e3d] transition-colors"
                        >
                            <Star className="h-4 w-4" />
                            <span>{myReview ? 'Update Review' : 'Add Review'}</span>
                        </button>
                    </div>

                    {reviews.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {reviews.map((review) => (
                                <div key={review.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                                    {/* Reviewer Profile and Info */}
                                    <div className="flex items-start space-x-4 mb-4">
                                        <div className="w-12 h-12 bg-gray-300 rounded-full overflow-hidden flex-shrink-0">
                                            {review.reviewer?.profilePictureUrl ? (
                                                <img
                                                    src={getImageUrl(review.reviewer.profilePictureUrl)}
                                                    alt={`${review.reviewer.firstName} ${review.reviewer.lastName}`}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <div
                                                className="hidden w-full h-full items-center justify-center text-gray-600 text-sm font-bold"
                                                style={{ display: review.reviewer?.profilePictureUrl ? 'none' : 'flex' }}
                                            >
                                                {review.reviewer?.firstName?.[0]}{review.reviewer?.lastName?.[0]}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-gray-900 text-sm">
                                                {review.reviewer?.firstName} {review.reviewer?.lastName}
                                            </h4>
                                            <p className="text-gray-500 text-xs">
                                                {formatDate(review.createdAt)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Star Rating */}
                                    <div className="flex items-center space-x-1 mb-3">
                                        {renderStars(review.rating)}
                                    </div>

                                    {/* Review Text */}
                                    <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">No reviews yet. Be the first to review this trainer!</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Login Modal */}
            {showLoginModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Login Required</h3>
                        <p className="text-gray-600 mb-6">
                            {!isAuthenticated()
                                ? "You need to be logged in as a client to perform this action."
                                : "You need to be logged in as a client to perform this action. Please log in with a client account."
                            }
                        </p>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => {
                                    setShowLoginModal(false);
                                    navigate('/login');
                                }}
                                className="flex-1 bg-[#c53445] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#b02e3d] transition-colors"
                            >
                                {!isAuthenticated() ? "Login" : "Switch to Client Account"}
                            </button>
                            <button
                                onClick={() => setShowLoginModal(false)}
                                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Modal */}
            {showBookingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Book a Session</h3>
                        <form onSubmit={handleBookingSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date & Time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={bookingForm.requestedDateTime}
                                    onChange={(e) => setBookingForm({ ...bookingForm, requestedDateTime: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Session Type
                                </label>
                                <select
                                    value={bookingForm.sessionType}
                                    onChange={(e) => setBookingForm({ ...bookingForm, sessionType: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                >
                                    <option>Personal Training</option>
                                    <option>Group Class</option>
                                    <option>Nutrition Consultation</option>
                                    <option>Fitness Assessment</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Duration (minutes)
                                </label>
                                <select
                                    value={bookingForm.durationMinutes}
                                    onChange={(e) => setBookingForm({ ...bookingForm, durationMinutes: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                >
                                    <option value={30}>30 minutes</option>
                                    <option value={60}>60 minutes</option>
                                    <option value={90}>90 minutes</option>
                                    <option value={120}>120 minutes</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={bookingForm.notes}
                                    onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                    placeholder="Any specific goals or requirements..."
                                />
                            </div>
                            <div className="flex space-x-4 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-[#c53445] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#b02e3d] transition-colors"
                                >
                                    Book Session
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowBookingModal(false)}
                                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Chat Modal */}
            {showChatModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Send Message</h3>
                        <form onSubmit={handleChatSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Message
                                </label>
                                <textarea
                                    value={chatForm.message}
                                    onChange={(e) => setChatForm({ message: e.target.value })}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                    placeholder="Type your message here..."
                                    required
                                />
                            </div>
                            <div className="flex space-x-4 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-[#c53445] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#b02e3d] transition-colors"
                                >
                                    Send Message
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowChatModal(false)}
                                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Review Modal */}
            {showReviewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            {myReview ? 'Update Review' : 'Add Review'}
                        </h3>
                        <form onSubmit={handleReviewSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rating
                                </label>
                                <div className="flex space-x-1">
                                    {renderReviewStars(reviewForm.rating)}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Comment
                                </label>
                                <textarea
                                    value={reviewForm.comment}
                                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                                    placeholder="Share your experience with this trainer..."
                                    required
                                />
                            </div>
                            <div className="flex space-x-4 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-[#c53445] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#b02e3d] transition-colors"
                                >
                                    {myReview ? 'Update Review' : 'Submit Review'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowReviewModal(false)}
                                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrainerProfile;
