import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usersAPI, carsAPI, tripsAPI, bookingsAPI, routePointsAPI, paymentsAPI, supportAPI } from '../../services/api';

const STATUS_LABELS = {
  planned: { label: 'Planned', cls: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'In Progress', cls: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Completed', cls: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-800' },
};

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
      </div>
      {children}
    </div>
  </div>
);

const AddCarModal = ({ onClose, onSave }) => {
  const [form, setForm] = useState({ model: '', plate_number: '', total_seats: 4 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSave({ ...form, total_seats: parseInt(form.total_seats) });
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Add New Car" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Car Model</label>
          <input type="text" required placeholder="e.g. Toyota Camry"
            value={form.model} onChange={e => setForm({ ...form, model: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Plate Number</label>
          <input type="text" required placeholder="e.g. 777ABC01"
            value={form.plate_number} onChange={e => setForm({ ...form, plate_number: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Total Seats (1–8)</label>
          <input type="number" required min={1} max={8}
            value={form.total_seats} onChange={e => setForm({ ...form, total_seats: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
            {loading ? 'Saving...' : 'Add Car'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const CreateTripModal = ({ cars, onClose, onSave }) => {
  const activeCar = cars.find(c => c.is_active);
  const [form, setForm] = useState({
    origin: '',
    destination: '',
    price_per_seat: '',
    start_time: '',
    car_id: activeCar?.id || '',
    available_seats: activeCar?.total_seats || 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.car_id) { setError('You need an active car first.'); return; }
    setLoading(true);
    setError('');
    try {
      await onSave({
        origin: form.origin,
        destination: form.destination,
        price_per_seat: parseFloat(form.price_per_seat),
        start_time: new Date(form.start_time).toISOString(),
        car_id: parseInt(form.car_id),
        available_seats: parseInt(form.available_seats),
      });
      onClose();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Create New Trip" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
        {!activeCar && (
          <p className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
            You need to add an active car before creating a trip.
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input type="text" required placeholder="Almaty"
              value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input type="text" required placeholder="Astana"
              value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price per Seat ($)</label>
            <input type="number" required min={0} step="0.01" placeholder="1500"
              value={form.price_per_seat} onChange={e => setForm({ ...form, price_per_seat: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Available Seats</label>
            <input type="number" required min={1} max={activeCar?.total_seats || 8}
              value={form.available_seats} onChange={e => setForm({ ...form, available_seats: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Departure Time</label>
          <input type="datetime-local" required
            value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Car</label>
          <select value={form.car_id} onChange={e => setForm({ ...form, car_id: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none">
            {cars.filter(c => c.is_active).map(car => (
              <option key={car.id} value={car.id}>{car.model} — {car.plate_number}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={loading || !activeCar}
            className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Trip'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const SUPPORT_CATEGORIES = ['bug', 'feature_request', 'complaint', 'other'];

const AccountTab = ({ user }) => {
  const [profileForm, setProfileForm] = useState({ username: user?.username || '', surname: user?.surname || '', phone: user?.phone || '' });
  const [passwordForm, setPasswordForm] = useState({ new_password: '', confirm: '' });
  const [supportForm, setSupportForm] = useState({ subject: '', message: '', category: 'other' });
  const [profileMsg, setProfileMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [supportMsg, setSupportMsg] = useState('');
  const [saving, setSaving] = useState('');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving('profile');
    setProfileMsg('');
    try {
      await usersAPI.updateMe({ username: profileForm.username, surname: profileForm.surname, phone: profileForm.phone });
      setProfileMsg('Profile updated successfully.');
    } catch (err) {
      setProfileMsg(err.response?.data?.detail || err.message);
    } finally {
      setSaving('');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm) {
      setPasswordMsg('Passwords do not match.');
      return;
    }
    setSaving('password');
    setPasswordMsg('');
    try {
      await usersAPI.updateMe({ password: passwordForm.new_password });
      setPasswordMsg('Password changed successfully.');
      setPasswordForm({ new_password: '', confirm: '' });
    } catch (err) {
      setPasswordMsg(err.response?.data?.detail || err.message);
    } finally {
      setSaving('');
    }
  };

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    setSaving('support');
    setSupportMsg('');
    try {
      await supportAPI.submitRequest({ email: user?.email || '', subject: supportForm.subject, message: supportForm.message, category: supportForm.category });
      setSupportMsg('Your request has been submitted. We will contact you shortly.');
      setSupportForm({ subject: '', message: '', category: 'other' });
    } catch (err) {
      setSupportMsg(err.response?.data?.detail || err.message);
    } finally {
      setSaving('');
    }
  };

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none';
  const msgCls = (msg) => msg.includes('success') || msg.includes('submitted') ? 'text-sm text-green-700 bg-green-50 p-2 rounded' : 'text-sm text-red-600 bg-red-50 p-2 rounded';

  return (
    <div className="space-y-8 max-w-lg">

      {/* Profile info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-500">Logged in as</p>
        <p className="font-semibold text-gray-900">{user?.username} {user?.surname}</p>
        <p className="text-sm text-gray-600">{user?.email} · {user?.phone}</p>
      </div>

      {/* Edit profile */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-3">Edit Profile</h3>
        <form onSubmit={handleSaveProfile} className="space-y-3">
          {profileMsg && <p className={msgCls(profileMsg)}>{profileMsg}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">First Name</label>
              <input type="text" value={profileForm.username} onChange={e => setProfileForm({ ...profileForm, username: e.target.value })} className={inputCls} required minLength={3} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Last Name</label>
              <input type="text" value={profileForm.surname} onChange={e => setProfileForm({ ...profileForm, surname: e.target.value })} className={inputCls} required minLength={3} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Phone</label>
            <input type="tel" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} className={inputCls} required />
          </div>
          <button type="submit" disabled={saving === 'profile'}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm disabled:opacity-50">
            {saving === 'profile' ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-3">Change Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-3">
          {passwordMsg && <p className={msgCls(passwordMsg)}>{passwordMsg}</p>}
          <div>
            <label className="block text-xs text-gray-500 mb-1">New Password</label>
            <input type="password" value={passwordForm.new_password} onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })} className={inputCls} required minLength={3} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Confirm Password</label>
            <input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })} className={inputCls} required minLength={3} />
          </div>
          <button type="submit" disabled={saving === 'password'}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm disabled:opacity-50">
            {saving === 'password' ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Support */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-3">Support</h3>
        <form onSubmit={handleSupportSubmit} className="space-y-3">
          {supportMsg && <p className={msgCls(supportMsg)}>{supportMsg}</p>}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Category</label>
            <select value={supportForm.category} onChange={e => setSupportForm({ ...supportForm, category: e.target.value })} className={inputCls}>
              {SUPPORT_CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Subject</label>
            <input type="text" value={supportForm.subject} onChange={e => setSupportForm({ ...supportForm, subject: e.target.value })} className={inputCls} required minLength={5} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Message</label>
            <textarea rows={4} value={supportForm.message} onChange={e => setSupportForm({ ...supportForm, message: e.target.value })} className={inputCls} required minLength={10} />
          </div>
          <button type="submit" disabled={saving === 'support'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50">
            {saving === 'support' ? 'Sending...' : 'Send Request'}
          </button>
        </form>
      </div>

    </div>
  );
};

const DriverDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [modal, setModal] = useState(null); // 'car' | 'trip' | null
  const [dashboardData, setDashboardData] = useState(null);
  const [myCars, setMyCars] = useState([]);
  const [myTrips, setMyTrips] = useState([]);
  const [tripBookings, setTripBookings] = useState({});
  const [bookingPayments, setBookingPayments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { loadData(); }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'overview') {
        const data = await usersAPI.getDriverDashboard();
        setDashboardData(data);
      } else if (activeTab === 'cars') {
        const cars = await carsAPI.getAll().catch(err => {
          if (err.response?.status === 404) return [];
          throw err;
        });
        setMyCars(Array.isArray(cars) ? cars : []);
      } else if (activeTab === 'trips') {
        const trips = await tripsAPI.getMine().catch(err => {
          if (err.response?.status === 404) return [];
          throw err;
        });
        setMyTrips(Array.isArray(trips) ? trips : []);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadTripBookings = async (tripId) => {
    try {
      const bookings = await bookingsAPI.getTripBookings(tripId);
      setTripBookings(prev => ({ ...prev, [tripId]: bookings }));
      const paymentMap = {};
      await Promise.all(bookings.map(async b => {
        try {
          const payments = await paymentsAPI.getByBookingId(b.id);
          paymentMap[b.id] = payments.length > 0 ? payments[payments.length - 1] : null;
        } catch {
          paymentMap[b.id] = null;
        }
      }));
      setBookingPayments(prev => ({ ...prev, ...paymentMap }));
    } catch {
      setTripBookings(prev => ({ ...prev, [tripId]: [] }));
    }
  };

  const handleConfirmPayment = async (paymentId, tripId) => {
    try {
      await paymentsAPI.confirm(paymentId);
      loadTripBookings(tripId);
    } catch (err) {
      alert(err.response?.data?.detail || err.message);
    }
  };

  const handleFailPayment = async (paymentId, tripId) => {
    try {
      await paymentsAPI.fail(paymentId);
      loadTripBookings(tripId);
    } catch (err) {
      alert(err.response?.data?.detail || err.message);
    }
  };

  const handleToggleCarActive = async (car) => {
    try {
      await carsAPI.update(car.id, { is_active: !car.is_active });
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || err.message);
    }
  };

  const handleDeleteCar = async (carId) => {
    if (!window.confirm('Delete this car? This cannot be undone.')) return;
    try {
      await carsAPI.delete(carId);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || err.message);
    }
  };

  const handleCreateCar = async (carData) => {
    await carsAPI.create(carData);
    loadData();
  };

  const handleCreateTrip = async (tripData) => {
    const newTrip = await tripsAPI.create(tripData);
    // Auto-create pickup and dropoff route points
    const t = new Date(tripData.start_time).toISOString();
    await routePointsAPI.create(newTrip.id, { location: tripData.origin, time: t, order: 1, type: 'pickup' });
    await routePointsAPI.create(newTrip.id, { location: tripData.destination, time: t, order: 2, type: 'dropoff' });
    loadData();
  };

  const handleStartTrip = async (tripId) => {
    try {
      await tripsAPI.start(tripId);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || err.message);
    }
  };

  const handleCompleteTrip = async (tripId) => {
    try {
      await tripsAPI.complete(tripId);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || err.message);
    }
  };

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'cars', label: 'My Cars' },
    { key: 'trips', label: 'My Trips' },
    { key: 'account', label: 'Account' },
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
        <button onClick={loadData} className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {modal === 'car' && (
        <AddCarModal onClose={() => setModal(null)} onSave={handleCreateCar} />
      )}
      {modal === 'trip' && (
        <CreateTripModal cars={myCars} onClose={() => setModal(null)} onSave={handleCreateTrip} />
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-900">Driver Dashboard — {user?.username}</h2>
        <p className="text-gray-600 mt-1">Manage your cars and trips</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === t.key
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">

          {/* OVERVIEW */}
          {activeTab === 'overview' && dashboardData && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Earnings Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-blue-800 font-semibold text-sm">Planned Trips</h4>
                  <p className="text-3xl font-bold text-blue-600 mt-1">
                    {dashboardData.trips_by_status?.planned || 0}
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="text-yellow-800 font-semibold text-sm">Pending Earnings</h4>
                  <p className="text-3xl font-bold text-yellow-600 mt-1">
                    ${dashboardData.pending_earnings?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-green-800 font-semibold text-sm">Total Earned</h4>
                  <p className="text-3xl font-bold text-green-600 mt-1">
                    ${dashboardData.total_earnings?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
              {dashboardData.trips_by_status && Object.keys(dashboardData.trips_by_status).length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Trips by Status</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(dashboardData.trips_by_status).map(([status, count]) => {
                      const s = STATUS_LABELS[status] || { label: status, cls: 'bg-gray-100 text-gray-800' };
                      return (
                        <div key={status} className={`rounded-lg p-3 ${s.cls}`}>
                          <p className="text-xs font-medium">{s.label}</p>
                          <p className="text-2xl font-bold mt-1">{count}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CARS */}
          {activeTab === 'cars' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">My Cars</h3>
                <button onClick={() => setModal('car')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                  + Add Car
                </button>
              </div>
              {myCars.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p>No cars yet. Add your first car to start creating trips.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {myCars.map(car => (
                    <div key={car.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-gray-900">{car.model}</h4>
                        <p className="text-sm text-gray-600">Plate: {car.plate_number}</p>
                        <p className="text-sm text-gray-600">Seats: {car.total_seats}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          car.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {car.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleToggleCarActive(car)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                            car.is_active
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}>
                          {car.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => handleDeleteCar(car.id)}
                          className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TRIPS */}
          {activeTab === 'trips' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">My Trips</h3>
                <button
                  onClick={async () => {
                    if (myCars.length === 0) {
                      const cars = await carsAPI.getAll().catch(() => []);
                      setMyCars(Array.isArray(cars) ? cars : []);
                    }
                    setModal('trip');
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                  + Create Trip
                </button>
              </div>
              {myTrips.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p>No trips yet. Create your first trip!</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {myTrips.map(trip => {
                    const s = STATUS_LABELS[trip.status] || { label: trip.status, cls: 'bg-gray-100 text-gray-800' };
                    return (
                      <div key={trip.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-lg">
                              {trip.origin} → {trip.destination}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Departure: {new Date(trip.start_time).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              Price: ${trip.price_per_seat} &nbsp;|&nbsp; Seats left: {trip.available_seats}
                            </p>
                            <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${s.cls}`}>
                              {s.label}
                            </span>
                          </div>
                          <div className="flex flex-col space-y-2 ml-4">
                            {trip.status === 'planned' && (
                              <button onClick={() => handleStartTrip(trip.id)}
                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                                Start
                              </button>
                            )}
                            {trip.status === 'in_progress' && (
                              <button onClick={() => handleCompleteTrip(trip.id)}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                                Complete
                              </button>
                            )}
                            <button onClick={() => loadTripBookings(trip.id)}
                              className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                              Bookings
                            </button>
                          </div>
                        </div>

                        {tripBookings[trip.id] !== undefined && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h5 className="font-medium text-gray-900 mb-2">
                              Bookings ({tripBookings[trip.id].length})
                            </h5>
                            {tripBookings[trip.id].length === 0 ? (
                              <p className="text-sm text-gray-500">No bookings yet.</p>
                            ) : (
                              <div className="space-y-2">
                                {tripBookings[trip.id].map(b => (
                                  <div key={b.id} className="bg-gray-50 rounded p-3 text-sm">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="text-gray-700 font-medium">Booking #{b.id}</p>
                                        <p className="text-gray-500">Passenger: {b.passenger_username || b.passenger_id}</p>
                                        {b.passenger_phone && <p className="text-gray-500">Phone: {b.passenger_phone}</p>}
                                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${
                                          b.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                          b.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-gray-100 text-gray-600'
                                        }`}>{b.status}</span>
                                        {bookingPayments[b.id] && (
                                          <span className={`inline-block mt-1 ml-2 px-2 py-0.5 rounded text-xs ${
                                            bookingPayments[b.id].status === 'completed' ? 'bg-green-100 text-green-800' :
                                            bookingPayments[b.id].status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                          }`}>
                                            Payment: {bookingPayments[b.id].status} (${bookingPayments[b.id].amount})
                                          </span>
                                        )}
                                      </div>
                                      {bookingPayments[b.id]?.status === 'pending' && (
                                        <div className="flex flex-col space-y-1 ml-3">
                                          <button onClick={() => handleConfirmPayment(bookingPayments[b.id].id, trip.id)}
                                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">
                                            Confirm
                                          </button>
                                          <button onClick={() => handleFailPayment(bookingPayments[b.id].id, trip.id)}
                                            className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">
                                            Fail
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ACCOUNT */}
          {activeTab === 'account' && (
            <AccountTab user={user} />
          )}

        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
