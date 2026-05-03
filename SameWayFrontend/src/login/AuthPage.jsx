import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import styles from "./AuthPage.module.css"; 

export default function AuthPage() {
  const [isActive, setIsActive] = useState(false);
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });
  const [registerData, setRegisterData] = useState({
    username: '',
    surname: '',
    email: '',
    password: '',
    phone: '',
    role: 'passenger',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegisterChange = (e) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value,
    });
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
    try {
      const result = await register(registerData);
      if (result.success) {
        navigate('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fillTestLogin = (email, password) => {
    setLoginData({ email, password });
  };

  return (
    <div className={`${styles.container} ${isActive ? styles.active : ""}`}>
      
      <div className={`${styles["form-container"]} ${styles["sign-up"]}`}>
        <form onSubmit={handleRegister}>
          <h1>Create Account</h1>

    
          <span>Use your email for registration</span>
          <input
            type="text"
            name="username"
            placeholder="Name"
            value={registerData.username}
            onChange={handleRegisterChange}
            required
            minLength="3"
          />
          <input
            type="text"
            name="surname"
            placeholder="Surname"
            value={registerData.surname}
            onChange={handleRegisterChange}
            required
            minLength="3"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={registerData.email}
            onChange={handleRegisterChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={registerData.password}
            onChange={handleRegisterChange}
            required
            minLength="3"
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone"
            value={registerData.phone}
            onChange={handleRegisterChange}
            required
            minLength="5"
          />
          <select
            name="role"
            value={registerData.role}
            onChange={handleRegisterChange}
            className="block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none appearance-none cursor-pointer"
          >
            <option value="passenger">Passenger</option>
            <option value="driver">Driver</option>
          </select>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
      </div>

      <div className={`${styles["form-container"]} ${styles["sign-in"]}`}>
        <form onSubmit={handleLogin}>
          <h1>Sign In</h1>

          <span>Use your email password</span>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={loginData.email}
            onChange={handleLoginChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={loginData.password}
            onChange={handleLoginChange}
            required
          />
          <a href="#">Forget Your Password?</a>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>

 
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Test Users:</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fillTestLogin('almaskak3@gmail.com', 'almas0224')}
                className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-xs"
              >
                Use Passenger Test Account
              </button>
              <button
                type="button"
                onClick={() => fillTestLogin('almasikou@gmail.com', 'almas0224')}
                className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-xs"
              >
                Use Driver Test Account
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className={styles["toggle-container"]}>
        <div className={styles.toggle}>

          <div className={`${styles["toggle-panel"]} ${styles["toggle-left"]}`}>
            <h1>Welcome Back!</h1>
            <p>Enter your personal details to use all features</p>
            <button className={styles.hidden} onClick={() => setIsActive(false)}>
              Sign In
            </button>
          </div>

          <div className={`${styles["toggle-panel"]} ${styles["toggle-right"]}`}>
            <h1>Hello, Friend!</h1>
            <p>Register with your personal details</p>
            <button className={styles.hidden} onClick={() => setIsActive(true)}>
              Sign Up
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}