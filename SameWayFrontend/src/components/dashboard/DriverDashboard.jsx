import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api , { usersAPI, carsAPI, tripsAPI, bookingsAPI } from '../../services/api';

const DriverDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState({
    dashboardData: null,
    myCars: [],
    myTrips: [],
    tripBookings: {},
    loading: true,
    error: null,
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      if (activeTab === 'overview') {
        const dashboardData = await usersAPI.getDriverDashboard();
        setData(prev => ({ ...prev, dashboardData, loading: false }));
      }
      else if (activeTab === 'cars') {
        try {

          const cars = await carsAPI.getAll();


          const carsList = Array.isArray(cars) ? cars : (cars ? [cars] : []);
          setData(prev => ({ ...prev, myCars: carsList, loading: false }));
        } catch (carError) {

          if (carError.response?.status === 404) {
            setData(prev => ({ ...prev, myCars: [], loading: false }));
          } else {
            throw carError;
          }
        }
      }
      else if (activeTab === 'trips') {
        try {

          const allAvailableTrips = await tripsAPI.getAvailable();
          const myTrips = allAvailableTrips.filter(t => t.driver_id === user.uid);

          setData(prev => ({ ...prev, myTrips: myTrips, loading: false }));

        } catch (tripError) {

          if (tripError.response?.status === 404 || tripError.response?.status === 422) {
            setData(prev => ({ ...prev, myTrips: [], loading: false }));
          } else {
            throw tripError;
          }
        }
      }
    } catch (error) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load data'
      }));
    }
  };

  const loadTripBookings = async (tripId) => {
    try {
      const bookings = await bookingsAPI.getTripBookings(tripId);
      setData(prev => ({
        ...prev,
        tripBookings: { ...prev.tripBookings, [tripId]: bookings }
      }));
    } catch (error) {
      console.error('Failed to load trip bookings:', error);
    }
  };

  const handleCreateCar = async (carData) => {
    try {
      await carsAPI.create(carData);
      loadData();
      alert('Car created successfully!');
    } catch (error) {
      alert('Failed to create car: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleCreateTrip = async (tripData) => {
  try {
    setData(prev => ({ ...prev, loading: true }));

   
    const newTrip = await tripsAPI.create(tripData);
    const tripId = newTrip.id;

    
    await api.post(`/routepoints/trips/${tripId}`, {
      location: tripData.origin,
      time: tripData.start_time,
      order: 1,
      type: 'pickup' 
    });

  
    await api.post(`/routepoints/trips/${tripId}`, {
      location: tripData.destination,
      time: tripData.start_time, 
      order: 2,
      type: 'dropoff'
    });

    alert('Trip and Route Points created successfully!');
    
    
    await loadData(); 
    
  } catch (error) {
    console.error("Full error:", error);
    const errorMessage = error.response?.data?.detail 
      ? JSON.stringify(error.response.data.detail) 
      : error.message;
    alert('Failed to create trip sequence: ' + errorMessage);
  } finally {
    setData(prev => ({ ...prev, loading: false }));
  }
};

  // const handleCreateTrip = async (tripData) => {
  //   try {
  //     await tripsAPI.create(tripData);
  //     loadData();
  //     alert('Trip created successfully!');
  //   } catch (error) {
  //     alert('Failed to create trip: ' + (error.response?.data?.detail || error.message));
  //   }
  // };

  const handleStartTrip = async (tripId) => {
    try {
      await tripsAPI.start(tripId);
      loadData();
      alert('Trip started successfully!');
    } catch (error) {
      alert('Failed to start trip: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleCompleteTrip = async (tripId) => {
    try {
      await tripsAPI.complete(tripId);
      loadData();
      alert('Trip completed successfully!');
    } catch (error) {
      alert('Failed to complete trip: ' + (error.response?.data?.detail || error.message));
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
          Driver Dashboard - {user?.username}
        </h2>
        <p className="text-gray-600 mt-1">Manage your cars and trips</p>
      </div>


      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('cars')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'cars'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              My Cars
            </button>
            <button
              onClick={() => setActiveTab('trips')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'trips'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              My Trips
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && data.dashboardData && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Dashboard Overview</h3>


              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-blue-800 font-semibold">Active Cars</h4>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    {data.dashboardData.active_cars || 0}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-green-800 font-semibold">Active Trips</h4>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {data.dashboardData.active_trips || 0}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="text-purple-800 font-semibold">Total Earnings</h4>
                  <p className="text-2xl font-bold text-purple-600 mt-2">
                    ${data.dashboardData.total_earnings || 0}
                  </p>
                </div>
              </div>


              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Recent Activity</h4>
                <div className="space-y-2">
                  {data.dashboardData.recent_activity?.length > 0 ? (
                    data.dashboardData.recent_activity.map((activity, index) => (
                      <div key={index} className="bg-gray-50 rounded p-3">
                        <p className="text-sm text-gray-600">{activity}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cars' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">My Cars</h3>
                <button
                  onClick={() => {
                    const carData = {
                      model: prompt('Car model:'),
                      plate_number: prompt('Plate number:'),
                      total_seats: parseInt(prompt('Total seats (1-8):')),
                    };
                    if (carData.model && carData.plate_number && carData.total_seats) {
                      handleCreateCar(carData);
                    }
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Add Car
                </button>
              </div>

              {data.myCars.length === 0 ? (
                <p className="text-gray-500">You haven't added any cars yet.</p>
              ) : (
                <div className="grid gap-4">
                  {data.myCars.map((car) => (
                    <div key={car.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{car.model}</h4>
                          <p className="text-sm text-gray-600">Plate: {car.plate_number}</p>
                          <p className="text-sm text-gray-600">Seats: {car.total_seats}</p>
                          <p className="text-sm text-gray-600">
                            Status: <span className={`px-2 py-1 rounded text-xs ${car.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                              {car.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'trips' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">My Trips</h3>
                <button
                  onClick={() => {
                    const tripData = {
                      origin: prompt('Origin:'),
                      destination: prompt('Destination:'),
                      price_per_seat: parseFloat(prompt('Price per seat:')),
                      start_time: prompt('Start time (YYYY-MM-DD HH:MM):'),
                      car_id: parseInt(prompt('Car ID:')),
                      available_seats: parseInt(prompt('Available seats:')),
                    };
                    if (tripData.origin && tripData.destination && tripData.car_id) {
                      handleCreateTrip(tripData);
                    }
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Create Trip
                </button>
              </div>

              {data.myTrips.length === 0 ? (
                <p className="text-gray-500">You haven't created any trips yet.</p>
              ) : (
                <div className="grid gap-4">
                  {data.myTrips.map((trip) => (
                    <div key={trip.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {trip.origin} → {trip.destination}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Price per seat: ${trip.price_per_seat}
                          </p>
                          <p className="text-sm text-gray-600">
                            Available seats: {trip.available_seats}
                          </p>
                          <p className="text-sm text-gray-600">
                            Departure: {new Date(trip.start_time).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            Status: <span className={`px-2 py-1 rounded text-xs ${trip.status === 'active' ? 'bg-green-100 text-green-800' :
                              trip.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                trip.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                              }`}>
                              {trip.status}
                            </span>
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          {trip.status === 'pending' && (
                            <button
                              onClick={() => handleStartTrip(trip.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                            >
                              Start
                            </button>
                          )}
                          {trip.status === 'active' && (
                            <button
                              onClick={() => handleCompleteTrip(trip.id)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            >
                              Complete
                            </button>
                          )}
                          <button
                            onClick={() => loadTripBookings(trip.id)}
                            className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                          >
                            View Bookings
                          </button>
                        </div>
                      </div>

                    
                      {data.tripBookings[trip.id] && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h5 className="font-medium text-gray-900 mb-2">Bookings ({data.tripBookings[trip.id].length})</h5>
                          <div className="space-y-2">
                            {data.tripBookings[trip.id].map((booking) => (
                              <div key={booking.id} className="bg-gray-50 rounded p-2">
                                <p className="text-sm text-gray-600">
                                  Passenger ID: {booking.passenger_id}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Status: <span className={`px-2 py-1 rounded text-xs ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                    {booking.status}
                                  </span>
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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

export default DriverDashboard;
