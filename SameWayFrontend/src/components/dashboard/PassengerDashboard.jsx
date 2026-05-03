import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { tripsAPI, bookingsAPI } from '../../services/api';

const PassengerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('trips');
  const [data, setData] = useState({
    availableTrips: [],
    myBookings: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));
      
      if (activeTab === 'trips') {
        const trips = await tripsAPI.getAvailable();
        setData(prev => ({ ...prev, availableTrips: trips, loading: false }));
      } else if (activeTab === 'bookings') {
        const bookings = await bookingsAPI.getMyBookings();
        setData(prev => ({ ...prev, myBookings: bookings, loading: false }));
      }
    } catch (error) {
      setData(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Failed to load data' 
      }));
    }
  };

  const handleBooking = async (tripId) => {
  try {
    const pickupId = prompt('Enter Pickup Route ID:');
    const dropoffId = prompt('Enter Dropoff Route ID:');

    if (!pickupId || !dropoffId) return;

    await bookingsAPI.create({
      trip_id: tripId,
      pickup_route_id: parseInt(pickupId),
      dropoff_route_id: parseInt(dropoffId),
    });
    
    alert('Booking created successfully!');
    loadData();
  } catch (error) {
    alert('Failed to create booking: ' + (error.response?.data?.detail?.[0]?.msg || error.message));
  }
};

  const handleCancelBooking = async (bookingId) => {
    try {
      await bookingsAPI.cancel(bookingId);
      loadData();
      alert('Booking cancelled successfully!');
    } catch (error) {
      alert('Failed to cancel booking: ' + (error.response?.data?.detail || error.message));
    }
  };

  if (data.loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{data.error}</p>
        <button 
          onClick={loadData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.username}!
        </h2>
        <p className="text-gray-600 mt-1">Manage your trips and bookings</p>
      </div>

      
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('trips')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'trips'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Available Trips
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'bookings'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My Bookings
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'trips' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Available Trips</h3>
              {data.availableTrips.length === 0 ? (
                <p className="text-gray-500">No available trips at the moment.</p>
              ) : (
                <div className="grid gap-4">
                  {data.availableTrips.map((trip) => (
                    <div key={trip.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {trip.origin} → {trip.destination}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Driver: {trip.driver_username}
                          </p>
                          <p className="text-sm text-gray-600">
                            Available seats: {trip.available_seats}
                          </p>
                          <p className="text-sm text-gray-600">
                            Price per seat: ${trip.price_per_seat}
                          </p>
                          <p className="text-sm text-gray-600">
                            Departure: {new Date(trip.start_time).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleBooking(trip.id, trip.pickup_route_id, trip.dropoff_route_id)}
                          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">My Bookings</h3>
              {data.myBookings.length === 0 ? (
                <p className="text-gray-500">You haven't made any bookings yet.</p>
              ) : (
                <div className="grid gap-4">
                  {data.myBookings.map((booking) => (
                    <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            Trip {booking.trip_id}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Status: <span className={`px-2 py-1 rounded text-xs ${
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {booking.status}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Booked on: {new Date(booking.created_at).toLocaleString()}
                          </p>
                        </div>
                        {booking.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PassengerDashboard;
