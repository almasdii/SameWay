
import { useAuth } from '../contexts/AuthContext';
import PassengerDashboard from '../components/dashboard/PassengerDashboard';
import DriverDashboard from '../components/dashboard/DriverDashboard';
import Navbar from '../components/Navbar';

const Dashboard = () => {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h1>
                    <p className="text-gray-600">You need to be authenticated to access the dashboard.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {user?.role === 'driver' ? (
                    <DriverDashboard />
                ) : (
                    <PassengerDashboard />
                )}
            </div>
        </div>
    );
};

export default Dashboard;
