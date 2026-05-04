import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import styles from "./AuthPage.module.css";

export default function AuthPage() {
  const [isActive, setIsActive] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    username: '', surname: '', email: '', password: '', phone: '', role: 'passenger',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [forgotView, setForgotView] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const { login, register, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleLoginChange = (e) => {
    clearError();
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleRegisterChange = (e) => {
    clearError();
    setRegisterSuccess('');
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await login(loginData.email, loginData.password);
      if (result.success) {
        navigate('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setRegisterSuccess('');
    try {
      const result = await register(registerData);
      if (result.success) {
        setRegisterSuccess('Account created! Check your email to verify, then sign in.');
        setRegisterData({ username: '', surname: '', email: '', password: '', phone: '', role: 'passenger' });
        setTimeout(() => setIsActive(false), 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMsg('');
    try {
      await authAPI.requestPasswordReset(forgotEmail);
      setForgotMsg('Check your email for a password reset link.');
    } catch (err) {
      setForgotMsg(err.response?.data?.detail || err.message || 'Something went wrong.');
    } finally {
      setForgotLoading(false);
    }
  };

  const fillTestLogin = (email, password) => {
    clearError();
    setLoginData({ email, password });
  };

  return (
    <div className={`${styles.container} ${isActive ? styles.active : ""}`}>

      {/* Register form */}
      <div className={`${styles["form-container"]} ${styles["sign-up"]}`}>
        <form onSubmit={handleRegister}>
          <h1>Create Account</h1>
          <span>Use your email for registration</span>

          {error && (
            <div className="w-full px-3 py-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
          {registerSuccess && (
            <div className="w-full px-3 py-2 bg-green-100 border border-green-300 rounded text-green-700 text-sm">
              {registerSuccess}
            </div>
          )}

          <input type="text" name="username" placeholder="First Name" value={registerData.username}
            onChange={handleRegisterChange} required minLength="2" />
          <input type="text" name="surname" placeholder="Last Name" value={registerData.surname}
            onChange={handleRegisterChange} required minLength="2" />
          <input type="email" name="email" placeholder="Email" value={registerData.email}
            onChange={handleRegisterChange} required />
          <input type="password" name="password" placeholder="Password (min 8 chars)" value={registerData.password}
            onChange={handleRegisterChange} required minLength="8" />
          <input type="tel" name="phone" placeholder="Phone (+7...)" value={registerData.phone}
            onChange={handleRegisterChange} required minLength="5" />
          <select name="role" value={registerData.role} onChange={handleRegisterChange}
            className="block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none appearance-none cursor-pointer">
            <option value="passenger">Passenger</option>
            <option value="driver">Driver</option>
          </select>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
      </div>

      {/* Login form */}
      <div className={`${styles["form-container"]} ${styles["sign-in"]}`}>
        {forgotView ? (
          <form onSubmit={handleForgotPassword}>
            <h1>Reset Password</h1>
            <span>Enter your email to receive a reset link</span>
            {forgotMsg && (
              <div className={`w-full px-3 py-2 border rounded text-sm ${forgotMsg.includes('Check') ? 'bg-green-50 border-green-300 text-green-700' : 'bg-red-100 border-red-300 text-red-700'}`}>
                {forgotMsg}
              </div>
            )}
            <input type="email" placeholder="Email" value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)} required />
            <button type="submit" disabled={forgotLoading}>
              {forgotLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <button type="button" onClick={() => { setForgotView(false); setForgotMsg(''); }}
              className="text-sm text-purple-600 hover:underline mt-2 bg-transparent border-none cursor-pointer">
              Back to Sign In
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <h1>Sign In</h1>
            <span>Use your email and password</span>

            {error && (
              <div className="w-full px-3 py-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            <input type="email" name="email" placeholder="Email" value={loginData.email}
              onChange={handleLoginChange} required />
            <input type="password" name="password" placeholder="Password" value={loginData.password}
              onChange={handleLoginChange} required />

            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>

            <button type="button" onClick={() => { clearError(); setForgotView(true); }}
              className="text-sm text-purple-600 hover:underline mt-1 bg-transparent border-none cursor-pointer">
              Forgot password?
            </button>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Quick test login:</p>
              <div className="space-y-1">
                <button type="button" onClick={() => fillTestLogin('almaskak3@gmail.com', 'almas0224')}
                  className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-xs">
                  Passenger Test Account
                </button>
                <button type="button" onClick={() => fillTestLogin('almasikou@gmail.com', 'almas0224')}
                  className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-xs">
                  Driver Test Account
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Toggle panel */}
      <div className={styles["toggle-container"]}>
        <div className={styles.toggle}>
          <div className={`${styles["toggle-panel"]} ${styles["toggle-left"]}`}>
            <h1>Welcome Back!</h1>
            <p>Enter your personal details to use all features</p>
            <button className={styles.hidden} onClick={() => setIsActive(false)}>Sign In</button>
          </div>
          <div className={`${styles["toggle-panel"]} ${styles["toggle-right"]}`}>
            <h1>Hello, Friend!</h1>
            <p>Register with your personal details</p>
            <button className={styles.hidden} onClick={() => setIsActive(true)}>Sign Up</button>
          </div>
        </div>
      </div>

    </div>
  );
}
