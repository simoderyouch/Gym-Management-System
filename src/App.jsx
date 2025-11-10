import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';


// Import components
import Home from './pages/Home';
import Trainers from './pages/Trainers';
import TrainerProfile from './pages/Trainers/TrainerProfile';
import Login from './pages/Auth/Login';
import ResetPassword from './pages/Auth/ResetPassword';
import Signup from './pages/Auth/Signup';
import Products from './pages/Shop/Products';
import ProductDetail from './pages/Shop/ProductDetail';
import Equipment from './pages/Equipment/Equipment';

// Import Dashboard components
import ClientDashboard from './pages/Dashboard/ClientDashboard';
import ClientProfile from './pages/Dashboard/ClientProfile';
import ClientBookings from './pages/Dashboard/ClientBookings';
import ClientNotifications from './pages/Dashboard/ClientNotifications';
import ClientChat from './pages/Dashboard/ClientChat';
import CoachDashboard from './pages/Dashboard/CoachDashboard';
import CoachMainDashboard from './pages/Dashboard/CoachMainDashboard';
import CoachClients from './pages/Dashboard/CoachClients';
import CoachBookings from './pages/Dashboard/CoachBookings';
import CoachChat from './pages/Dashboard/CoachChat';
import CoachProfile from './pages/Dashboard/CoachProfile';
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import AdminMainDashboard from './pages/Dashboard/AdminMainDashboard';
import AdminManageClients from './pages/Dashboard/AdminManageClients';
import AdminManageCoaches from './pages/Dashboard/AdminManageCoaches';
import AdminAnnouncements from './pages/Dashboard/AdminAnnouncements';
import AdminEquipment from './pages/Dashboard/AdminEquipment';
import AdminShopProducts from './pages/Dashboard/AdminShopProducts';
import AdminBookingsOverview from './pages/Dashboard/AdminBookingsOverview';
import AdminReports from './pages/Dashboard/AdminReports';
import AdminSettings from './pages/Dashboard/AdminSettings';
import AdminCheckInClients from './pages/Dashboard/AdminCheckInClients';
import AdminNotifications from './pages/Dashboard/AdminNotifications';
import AdminGymManagement from './pages/Dashboard/AdminGymManagement';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <Router>
            <div className="min-h-screen bg-white">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />

                {/* Add more routes here as we build them */}
                <Route path="/equipment" element={<Equipment />} />
                <Route path="/shop" element={<Products />} />
                <Route path="/products/:productId" element={<ProductDetail />} />
                <Route path="/trainers" element={<Trainers />} />
                <Route path="/login" element={<Login />} />
                <Route path="/resetpass" element={<ResetPassword />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/register" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">Register Page - Coming Soon</h1></div>} />
                <Route path="/trainers/:trainerId" element={<TrainerProfile />} />


                {/* Client Dashboard Routes - Protected */}
                <Route path="/dashboard" element={
                  <ProtectedRoute requiredRole="client">
                    <ClientDashboard />
                  </ProtectedRoute>
                }>
                  <Route index element={<ClientProfile />} />
                  <Route path="profile" element={<ClientProfile />} />
                  <Route path="bookings" element={<ClientBookings />} />
                  <Route path="notifications" element={<ClientNotifications />} />
                  <Route path="chat" element={<ClientChat />} />
                </Route>

                {/* Coach Dashboard Routes - Protected */}
                <Route path="/coach-dashboard" element={
                  <ProtectedRoute requiredRole="coach">
                    <CoachDashboard />
                  </ProtectedRoute>
                }>
                  <Route index element={<CoachMainDashboard />} />
                  <Route path="clients" element={<CoachClients />} />
                  <Route path="bookings" element={<CoachBookings />} />
                  <Route path="chat" element={<CoachChat />} />
                  <Route path="profile" element={<CoachProfile />} />
                </Route>

                {/* Admin Dashboard Routes - Protected */}
                <Route path="/admin-dashboard" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }>
                  <Route index element={<AdminMainDashboard />} />
                  <Route path="manage-clients" element={<AdminManageClients />} />
                  <Route path="manage-coaches" element={<AdminManageCoaches />} />
                  <Route path="announcements" element={<AdminAnnouncements />} />
                  <Route path="equipment" element={<AdminEquipment />} />
                  <Route path="manage-gyms" element={<AdminGymManagement />} />
                  <Route path="shop-products" element={<AdminShopProducts />} />
                  <Route path="bookings" element={<AdminBookingsOverview />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="checkin-clients" element={<AdminCheckInClients />} />
                  <Route path="notifications" element={<AdminNotifications />} />
                </Route>

                {/* Unauthorized page */}
                <Route path="/unauthorized" element={
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
                      <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
                      <Link to="/login" className="text-[#c53445] hover:text-[#b02e3d]">Go to Login</Link>
                    </div>
                  </div>
                } />
              </Routes>

              {/* Toast notifications */}
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
              />
            </div>
          </Router>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
