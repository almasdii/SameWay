import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { tripsAPI, bookingsAPI, routePointsAPI, paymentsAPI } from '../../services/api';

const PAYMENT_STATUS = {
  pending:   { label: 'Payment Pending',   cls: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Payment Confirmed', cls: 'bg-green-100 text-green-800' },
  failed:    { label: 'Payment Failed',    cls: 'bg-red-100 text-red-800' },
};

const BookingModal = ({ trip, onClose, onConfirm }) => {
  const [routePoints, setRoutePoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    routePointsAPI.getByTripId(trip.id)
      .then(pts => setRoutePoints(pts.sort((a, b) => a.order - b.order)))
      .catch(() => setError('Could not load route points.'))
      .finally(() => setLoading(false));
  }, [trip.id]);

  const pickup = routePoints.find(p => p.type === 'pickup') || routePoints[0];
  const dropoff = routePoints.find(p => p.type === 'dropoff') || routePoints[routePoints.length - 1];

  const handleConfirm = async () => {
    if (!pickup || !dropoff) { setError('Route points not found for this trip.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await onConfirm({ trip_id: trip.id, pickup_route_id: pickup.id, dropoff_route_id: dropoff.id });
      onClose();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail) || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Confirm Booking</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-1">
          <p className="font-semibold text-gray-900">{trip.origin} → {trip.destination}</p>
          <p className="text-sm text-gray-600">Departure: {new Date(trip.start_time).toLocaleString()}</p>
          <p className="text-sm text-gray-600">Price per seat: <span className="font-medium">${trip.price_per_seat}</span></p>
          <p className="text-sm text-gray-600">Seats available: {trip.available_seats}</p>
        </div>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : (
          <>
            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded mb-3">{error}</p>}
            {pickup && dropoff ? (
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-3 bg-green-50 rounded-lg p-3">
                  <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">P</span>
                  <div>
                    <p className="text-xs text-gray-500">Pickup</p>
                    <p className="text-sm font-medium text-gray-900">{pickup.location}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 bg-red-50 rounded-lg p-3">
                  <span className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">D</span>
                  <div>
                    <p className="text-xs text-gray-500">Dropoff</p>
                    <p className="text-sm font-medium text-gray-900">{dropoff.location}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded mb-4">No route points found for this trip.</p>
            )}
          </>
        )}
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleConfirm} disabled={submitting || loading || !pickup || !dropoff}
            className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
            {submitting ? 'Booking...' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  );
};

const PaymentModal = ({ booking, onClose, onPaid }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    tripsAPI.getById(booking.trip_id)
      .then(trip => setAmount(String(trip.price_per_seat)))
      .catch(() => setError('Could not load trip price.'))
      .finally(() => setLoading(false));
  }, [booking.trip_id]);

  const handlePay = async () => {
    setSubmitting(true);
    setError('');
    try {
      await paymentsAPI.create({ booking_id: booking.id, amount: parseFloat(amount) });
      onPaid();
      onClose();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail) || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Pay for Booking #{booking.id}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
              <input type="number" min="0.01" step="0.01"
                value={amount} onChange={e => setAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handlePay} disabled={submitting || !amount}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                {submitting ? 'Processing...' : `Pay $${amount}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PassengerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('trips');
  const [availableTrips, setAvailableTrips] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [bookingPayments, setBookingPayments] = useState({});
  const [bookingTrips, setBookingTrips] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingModal, setBookingModal] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState({ from: '', to: '' });
  const [searching, setSearching] = useState(false);

  useEffect(() => { loadData(); }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'trips') {
        const trips = await tripsAPI.getAvailable();
        setAvailableTrips(trips);
      } else if (activeTab === 'bookings') {
        const bookings = await bookingsAPI.getMyBookings();
        setMyBookings(bookings);
        const paymentMap = {};
        const tripMap = {};
        await Promise.all(bookings.map(async b => {
          try {
            const payments = await paymentsAPI.getByBookingId(b.id);
            paymentMap[b.id] = payments.length > 0 ? payments[payments.length - 1] : null;
          } catch {
            paymentMap[b.id] = null;
          }
          try {
            tripMap[b.trip_id] = await tripsAPI.getById(b.trip_id);
          } catch {
            tripMap[b.trip_id] = null;
          }
        }));
        setBookingPayments(paymentMap);
        setBookingTrips(tripMap);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.from || !searchQuery.to) return;
    setSearching(true);
    setError(null);
    try {
      const trips = await tripsAPI.search({ from: searchQuery.from, to: searchQuery.to });
      setAvailableTrips(trips);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleClearSearch = async () => {
    setSearchQuery({ from: '', to: '' });
    const trips = await tripsAPI.getAvailable().catch(() => []);
    setAvailableTrips(trips);
  };

  const handleConfirmBooking = async (bookingData) => {
    await bookingsAPI.create(bookingData);
    loadData();
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await bookingsAPI.cancel(bookingId);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || err.message);
    }
  };

  const tabs = [
    { key: 'trips', label: 'Available Trips' },
    { key: 'bookings', label: 'My Bookings' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button onClick={loadData} className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {bookingModal && (
        <BookingModal trip={bookingModal} onClose={() => setBookingModal(null)} onConfirm={handleConfirmBooking} />
      )}
      {paymentModal && (
        <PaymentModal booking={paymentModal} onClose={() => setPaymentModal(null)} onPaid={loadData} />
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-900">Welcome, {user?.username}!</h2>
        <p className="text-gray-600 mt-1">Find and book your next ride</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === t.key ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">

          {/* AVAILABLE TRIPS */}
          {activeTab === 'trips' && (
            <div className="space-y-4">
              <form onSubmit={handleSearch} className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">From</label>
                  <input type="text" placeholder="Almaty" value={searchQuery.from}
                    onChange={e => setSearchQuery({ ...searchQuery, from: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">To</label>
                  <input type="text" placeholder="Astana" value={searchQuery.to}
                    onChange={e => setSearchQuery({ ...searchQuery, to: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>
                <button type="submit" disabled={searching}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm disabled:opacity-50">
                  {searching ? '...' : 'Search'}
                </button>
                <button type="button" onClick={handleClearSearch}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                  All
                </button>
              </form>

              {availableTrips.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><p>No available trips found.</p></div>
              ) : (
                <div className="grid gap-4">
                  {availableTrips.map(trip => (
                    <div key={trip.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-lg">{trip.origin} → {trip.destination}</h4>
                          <p className="text-sm text-gray-600 mt-1">Departure: {new Date(trip.start_time).toLocaleString()}</p>
                          <p className="text-sm text-gray-600">Available seats: <span className="font-medium">{trip.available_seats}</span></p>
                          <p className="text-sm text-gray-600">Price: <span className="font-semibold text-purple-700">${trip.price_per_seat}</span></p>
                        </div>
                        <button onClick={() => setBookingModal(trip)} disabled={trip.available_seats === 0}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed ml-4">
                          {trip.available_seats === 0 ? 'Full' : 'Book Now'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MY BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">My Bookings</h3>
              {myBookings.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><p>You have no bookings yet.</p></div>
              ) : (
                <div className="grid gap-4">
                  {myBookings.map(booking => {
                    const payment = bookingPayments[booking.id];
                    const trip = bookingTrips[booking.trip_id];
                    const ps = payment ? PAYMENT_STATUS[payment.status] : null;
                    const canPay = booking.status === 'confirmed' && (!payment || payment.status === 'failed');

                    return (
                      <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900">Booking #{booking.id}</h4>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-600'
                              }`}>{booking.status}</span>
                              {ps && (
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${ps.cls}`}>{ps.label}</span>
                              )}
                            </div>

                            {trip ? (
                              <div className="space-y-1 mt-1">
                                <p className="text-base font-medium text-gray-800">{trip.origin} → {trip.destination}</p>
                                <p className="text-sm text-gray-600">Departure: {new Date(trip.start_time).toLocaleString()}</p>
                                <p className="text-sm text-gray-600">Price: <span className="font-semibold text-purple-700">${trip.price_per_seat}</span> per seat</p>
                                {trip.driver_username && (
                                  <p className="text-sm text-gray-600">Driver: <span className="font-medium">{trip.driver_username}</span>
                                    {trip.driver_phone && <span className="text-gray-500"> · {trip.driver_phone}</span>}
                                  </p>
                                )}
                                {trip.car_model && (
                                  <p className="text-sm text-gray-600">Car: <span className="font-medium">{trip.car_model}</span>
                                    {trip.car_plate && <span className="text-gray-500"> · {trip.car_plate}</span>}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 mt-1">Trip ID: {booking.trip_id}</p>
                            )}

                            {payment && (
                              <p className="text-xs text-gray-500 mt-2">Payment: ${payment.amount}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">Booked: {new Date(booking.created_at).toLocaleString()}</p>
                          </div>
                          <div className="flex flex-col space-y-2 ml-4">
                            {canPay && (
                              <button onClick={() => setPaymentModal(booking)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                                Pay
                              </button>
                            )}
                            {booking.status !== 'cancelled' && (
                              <button onClick={() => handleCancelBooking(booking.id)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
