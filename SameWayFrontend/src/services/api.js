import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);
          
          error.config.headers.Authorization = `Bearer ${access_token}`;
          return api.request(error.config);
        } catch (refreshError) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  },

  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  },
};

export const usersAPI = {
  getMe: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  updateMe: async (userData) => {
    const response = await api.patch('/users/me', userData);
    return response.data;
  },

  deleteMe: async () => {
    const response = await api.delete('/users/me');
    return response.data;
  },

  getDriverDashboard: async () => {
    const response = await api.get('/users/me/driver-dashboard');
    return response.data;
  },

  searchUsers: async (query) => {
    const response = await api.get('/users/search', { params: { q: query } });
    return response.data;
  },

  getUserStats: async () => {
    const response = await api.get('/users/stats');
    return response.data;
  },

  getUserByEmail: async (email) => {
    const response = await api.get(`/users/${email}`);
    return response.data;
  },

  updateUserByEmail: async (email, userData) => {
    const response = await api.patch(`/users/${email}`, userData);
    return response.data;
  },

  deleteUserByEmail: async (email) => {
    const response = await api.delete(`/users/${email}`);
    return response.data;
  },
};

export const carsAPI = {
  getAll: async () => {
    const response = await api.get('/cars');
    return response.data;
  },

  create: async (carData) => {
    const response = await api.post('/cars', carData);
    return response.data;
  },

  getActive: async () => {
    const response = await api.get('/cars/me/active');
    return response.data;
  },

  getById: async (carId) => {
    const response = await api.get(`/cars/${carId}`);
    return response.data;
  },

  update: async (carId, carData) => {
    const response = await api.patch(`/cars/${carId}`, carData);
    return response.data;
  },

  delete: async (carId) => {
    const response = await api.delete(`/cars/${carId}`);
    return response.data;
  },
};

export const tripsAPI = {
  create: async (tripData) => {
    const response = await api.post('/trips', tripData);
    return response.data;
  },

  getAvailable: async () => {
    const response = await api.get('/trips/available');
    return response.data;
  },

  search: async (params) => {
    const response = await api.get('/trips/search', { params });
    return response.data;
  },

  getById: async (tripId) => {
    const response = await api.get(`/trips/${tripId}`);
    return response.data;
  },

  update: async (tripId, tripData) => {
    const response = await api.patch(`/trips/${tripId}`, tripData);
    return response.data;
  },

  delete: async (tripId) => {
    const response = await api.delete(`/trips/${tripId}`);
    return response.data;
  },

  start: async (tripId) => {
    const response = await api.post(`/trips/${tripId}/start`);
    return response.data;
  },

  complete: async (tripId) => {
    const response = await api.post(`/trips/${tripId}/complete`);
    return response.data;
  },
};

export const routePointsAPI = {
  create: async (tripId, routePointData) => {
    const response = await api.post(`/routepoints/trips/${tripId}`, routePointData);
    return response.data;
  },

  getByTripId: async (tripId) => {
    const response = await api.get(`/routepoints/trips/${tripId}`);
    return response.data;
  },

  update: async (rpId, routePointData) => {
    const response = await api.patch(`/routepoints/${rpId}`, routePointData);
    return response.data;
  },

  delete: async (rpId) => {
    const response = await api.delete(`/routepoints/${rpId}`);
    return response.data;
  },
};

export const bookingsAPI = {
  create: async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },

  getMyBookings: async () => {
    const response = await api.get('/bookings/me');
    return response.data;
  },

  getTripBookings: async (tripId) => {
    const response = await api.get(`/bookings/trips/${tripId}`);
    return response.data;
  },

  cancel: async (bookingId) => {
    const response = await api.post(`/bookings/${bookingId}/cancel`);
    return response.data;
  },
};

export const paymentsAPI = {
  create: async (paymentData) => {
    const response = await api.post('/payments', paymentData);
    return response.data;
  },

  confirm: async (paymentId) => {
    const response = await api.post(`/payments/${paymentId}/confirm`);
    return response.data;
  },

  fail: async (paymentId) => {
    const response = await api.post(`/payments/${paymentId}/fail`);
    return response.data;
  },

  getById: async (paymentId) => {
    const response = await api.get(`/payments/${paymentId}`);
    return response.data;
  },

  getByBookingId: async (bookingId) => {
    const response = await api.get(`/payments/booking/${bookingId}`);
    return response.data;
  },
};

export const reviewsAPI = {
  create: async (reviewData) => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  getByUserId: async (userId) => {
    const response = await api.get(`/reviews/users/${userId}`);
    return response.data;
  },

  update: async (reviewId, reviewData) => {
    const response = await api.patch(`/reviews/${reviewId}`, reviewData);
    return response.data;
  },

  delete: async (reviewId) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  },
};

export const supportAPI = {
  submitRequest: async (requestData) => {
    const response = await api.post('/support/requests', requestData);
    return response.data;
  },
};

export const healthAPI = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;
