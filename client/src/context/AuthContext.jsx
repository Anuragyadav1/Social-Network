import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      loadUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async (token) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.get(
        "http://localhost:5000/api/users/profile",
        config
      );
      setUser(response.data.user);
      setLoading(false);
    } catch (err) {
      localStorage.removeItem("token");
      setError("Authentication failed");
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email,
          password,
        }
      );

      localStorage.setItem("token", response.data.token);
      setUser(response.data.user);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        userData
      );

      localStorage.setItem("token", response.data.token);
      setUser(response.data.user);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
