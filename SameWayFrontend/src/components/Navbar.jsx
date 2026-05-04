import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ROLE_LABELS = {
  driver: { label: 'Driver', cls: 'bg-blue-100 text-blue-800' },
  passenger: { label: 'Passenger', cls: 'bg-purple-100 text-purple-800' },
  admin: { label: 'Admin', cls: 'bg-red-100 text-red-800' },
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const role = ROLE_LABELS[user?.role] || { label: user?.role, cls: 'bg-gray-100 text-gray-800' };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <span className="text-xl font-bold text-purple-600">SameWay</span>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700 font-medium">{user?.username}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${role.cls}`}>
              {role.label}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
