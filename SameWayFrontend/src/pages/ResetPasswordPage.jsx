import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ new_password: '', confirm: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm) {
      setMsg('Passwords do not match.');
      return;
    }
    if (form.new_password.length < 8) {
      setMsg('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      await authAPI.confirmPasswordReset(token, form.new_password, form.confirm);
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setMsg(err.response?.data?.detail || err.message || 'Invalid or expired link.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Set New Password</h1>
        <p className="text-gray-500 text-sm mb-6">Enter your new password below.</p>

        {done ? (
          <div className="text-center py-4">
            <p className="text-green-700 bg-green-50 p-3 rounded-lg">Password reset successfully! Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {msg && (
              <p className={`text-sm p-2 rounded ${msg.includes('successfully') ? 'text-green-700 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                {msg}
              </p>
            )}
            <div>
              <label className="block text-xs text-gray-500 mb-1">New Password (min 8 characters)</label>
              <input type="password" value={form.new_password}
                onChange={e => setForm({ ...form, new_password: e.target.value })}
                className={inputCls} required minLength={8} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Confirm Password</label>
              <input type="password" value={form.confirm}
                onChange={e => setForm({ ...form, confirm: e.target.value })}
                className={inputCls} required minLength={8} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <button type="button" onClick={() => navigate('/login')}
              className="w-full text-sm text-gray-500 hover:text-gray-700">
              Back to Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
