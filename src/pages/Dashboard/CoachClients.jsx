import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { profilePictureUrl } from '../../config/paths';
import { useAuth } from '../../context/AuthContext';
import { coachApi } from '../../services/api.js';
import { Loader2, Search, User, MessageCircle, Trash2, Calendar, Users, Filter } from 'lucide-react';

const CoachClients = () => {
    const { user } = useAuth();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('All');
    const [stats, setStats] = useState({
        activeClients: 0,
        totalClients: 0
    });

    // Load clients data
    const loadClients = async () => {
        try {
            setLoading(true);
            const response = await coachApi.getMyClients();
            const clientsData = response.data?.value || response.data || [];
            setClients(clientsData);
            // Load stats with the actual clients count
            await loadStats(clientsData.length);
        } catch (error) {
            console.error('Error loading clients:', error);
            toast.error(`Failed to load clients: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Load stats
    const loadStats = async (clientsCount = 0) => {
        try {
            const response = await coachApi.getActiveClientCount();
            setStats({
                activeClients: response.data?.activeClients || 0,
                totalClients: clientsCount
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    // Handle remove client
    const handleRemoveClient = async (clientId, clientName) => {
        if (!window.confirm(`Are you sure you want to remove ${clientName}? This will cancel all future sessions with this client.`)) {
            return;
        }

        try {
            setActionLoading(prev => ({ ...prev, [clientId]: true }));
            const response = await coachApi.removeClient(clientId);
            console.log('Remove client response:', response);
            toast.success(`Client ${clientName} removed successfully. ${response.data?.removedSessions || 0} sessions cancelled.`);
            loadClients(); // Refresh the list and stats
        } catch (error) {
            console.error('Error removing client:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Failed to remove client';
            toast.error(`Failed to remove client: ${errorMessage}`);
        } finally {
            setActionLoading(prev => ({ ...prev, [clientId]: false }));
        }
    };

    // Handle message client (navigate to chat)
    const handleMessageClient = (clientId, clientName) => {
        // Navigate to chat with this client
        window.location.href = `/dashboard/chat?clientId=${clientId}`;
    };

    // Filter clients based on search and filter criteria
    const getFilteredClients = () => {
        let filtered = clients;

        // Status filter
        if (selectedFilter !== 'All') {
            filtered = filtered.filter(client => {
                if (selectedFilter === 'Active') {
                    return client.membershipActive === true;
                } else if (selectedFilter === 'Inactive') {
                    return client.membershipActive === false;
                }
                return true;
            });
        }

        // Search filter
        if (searchTerm.trim()) {
            const query = searchTerm.toLowerCase();
            filtered = filtered.filter(client =>
                client.firstName?.toLowerCase().includes(query) ||
                client.lastName?.toLowerCase().includes(query) ||
                client.email?.toLowerCase().includes(query)
            );
        }

        return filtered.sort((a, b) => {
            // Sort by membership status first (active first), then by name
            if (a.membershipActive !== b.membershipActive) {
                return b.membershipActive ? 1 : -1;
            }
            return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        });
    };

    // Get status color
    const getStatusColor = (isActive) => {
        return isActive
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800';
    };

    // Get image URL helper
    const getImageUrl = (client) => {
        // Check multiple possible image fields
        const imageUrl = client.profilePictureUrl || client.profilePicture || client.imageUrl || client.image;
        if (!imageUrl) return null;
        if (imageUrl.startsWith('http')) return imageUrl;
        return encodeURI(profilePictureUrl(imageUrl));
    };

    // Load data on component mount
    useEffect(() => {
        if (user?.token) {
            loadClients();
        }
    }, [user]);

    const filteredClients = getFilteredClients();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Clients</h1>
                    <p className="text-gray-600 mt-2">Manage your client profiles and sessions.</p>
                </div>

                {/* Stats */}
                <div className="flex space-x-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex items-center">
                            <Users className="w-5 h-5 text-blue-500 mr-2" />
                            <div>
                                <p className="text-sm text-gray-600">Active Clients</p>
                                <p className="text-lg font-semibold">{stats.activeClients}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex items-center">
                            <User className="w-5 h-5 text-green-500 mr-2" />
                            <div>
                                <p className="text-sm text-gray-600">Total Clients</p>
                                <p className="text-lg font-semibold">{stats.totalClients}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Membership Status</label>
                        <select
                            value={selectedFilter}
                            onChange={(e) => setSelectedFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                        >
                            <option value="All">All Clients</option>
                            <option value="Active">Active Membership</option>
                            <option value="Inactive">Inactive Membership</option>
                        </select>
                    </div>

                    {/* Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search Clients</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c53445] focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Results Summary */}
                <div className="mt-4 text-sm text-gray-600">
                    Showing {filteredClients.length} of {clients.length} clients
                </div>
            </div>

            {/* Clients Table */}
            {!user ? (
                <div className="bg-white rounded-lg shadow-sm border p-12">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#c53445]" />
                        <p className="text-gray-600">Loading user authentication...</p>
                    </div>
                </div>
            ) : loading ? (
                <div className="bg-white rounded-lg shadow-sm border p-12">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#c53445]" />
                        <p className="text-gray-600">Loading clients...</p>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Profile
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Membership Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredClients.map((client) => (
                                    <tr key={client.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {getImageUrl(client) ? (
                                                    <img
                                                        src={getImageUrl(client)}
                                                        alt={`${client.firstName} ${client.lastName}`}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                <div className={`w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center ${getImageUrl(client) ? 'hidden' : ''}`}>
                                                    <User className="w-5 h-5 text-gray-600" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {client.firstName} {client.lastName}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{client.email}</div>
                                            {client.phoneNumber && (
                                                <div className="text-sm text-gray-500">{client.phoneNumber}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(client.membershipActive)}`}>
                                                {client.membershipActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-3">
                                                <button
                                                    onClick={() => handleMessageClient(client.id, `${client.firstName} ${client.lastName}`)}
                                                    disabled={actionLoading[client.id]}
                                                    className="text-[#c53445] hover:text-[#b02e3d] transition-colors disabled:opacity-50"
                                                    title="Send Message"
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveClient(client.id, `${client.firstName} ${client.lastName}`)}
                                                    disabled={actionLoading[client.id]}
                                                    className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                                                    title="Remove Client"
                                                >
                                                    {actionLoading[client.id] ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {user && !loading && filteredClients.length === 0 && (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
                    <p className="text-gray-500">
                        {searchTerm || selectedFilter !== 'All'
                            ? 'Try adjusting your search terms or filters.'
                            : 'You don\'t have any clients with upcoming sessions yet.'
                        }
                    </p>
                </div>
            )}
        </div>
    );
};

export default CoachClients;
