import React, { createContext, useContext, useState, useEffect } from "react";
import apiService from "../services/api";

const AuthContext = createContext();

const STORAGE_KEY = "phishshield_auth_user";
const LOCAL_USERS_KEY = "phishshield_registered_users";

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  // Sync state to localStorage whenever it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [currentUser]);

  // Helper to get local mock user registry for offline fallback
  const getLocalUsers = () => {
    try {
      const users = localStorage.getItem(LOCAL_USERS_KEY);
      return users ? JSON.parse(users) : {};
    } catch {
      return {};
    }
  };

  const saveLocalUser = (email, userObj) => {
    try {
      const users = getLocalUsers();
      users[email.toLowerCase()] = userObj;
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.error("Failed to save local user", e);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPass = password || "";

    try {
      // 1. Try Live FastAPI Backend
      const res = await apiService.login({ email: cleanEmail, password: cleanPass });
      if (res && res.user) {
        setCurrentUser(res.user);
        setLoading(false);
        return { success: true, user: res.user };
      }
    } catch (err) {
      // If backend responded with 400/401, check the detail error
      if (err.response && err.response.data && err.response.data.detail) {
        // Known credential failure from backend
        setLoading(false);
        throw new Error(err.response.data.detail);
      }
      // If network offline or backend sleeping, attempt resilient client fallback
      console.warn("Backend unavailable, attempting offline client auth fallback...");
    }

    // 2. Resilient Offline / Demo fallback
    // Check pre-configured demo analyst
    if (cleanEmail === "analyst@phishshield.com" && cleanPass === "analyst123") {
      const demoUser = {
        id: "usr_analyst_01",
        name: "Nensi Borad",
        email: "analyst@phishshield.com",
        role: "Lead SOC Analyst",
      };
      setCurrentUser(demoUser);
      setLoading(false);
      return { success: true, user: demoUser };
    }

    if (cleanEmail === "admin@phishshield.com" && cleanPass === "admin123") {
      const demoAdmin = {
        id: "usr_admin_01",
        name: "Security Admin",
        email: "admin@phishshield.com",
        role: "Threat Intelligence Lead",
      };
      setCurrentUser(demoAdmin);
      setLoading(false);
      return { success: true, user: demoAdmin };
    }

    // Check local storage registered users
    const localUsers = getLocalUsers();
    const localUser = localUsers[cleanEmail];
    if (localUser && localUser.password === cleanPass) {
      const user = {
        id: localUser.id,
        name: localUser.name,
        email: localUser.email,
        role: localUser.role || "SOC Security Analyst",
      };
      setCurrentUser(user);
      setLoading(false);
      return { success: true, user };
    }

    setLoading(false);
    throw new Error("Invalid email or password. Please verify credentials or use Demo Login.");
  };

  const register = async (name, email, password, role = "SOC Security Analyst") => {
    setLoading(true);
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanName = (name || "").trim();
    const cleanRole = role.trim();

    try {
      // 1. Try Live FastAPI Backend
      const res = await apiService.register({
        name: cleanName,
        email: cleanEmail,
        password,
        role: cleanRole,
      });
      if (res && res.user) {
        setCurrentUser(res.user);
        // Save local backup as well
        saveLocalUser(cleanEmail, {
          id: res.user.id,
          name: cleanName,
          email: cleanEmail,
          password,
          role: cleanRole,
        });
        setLoading(false);
        return { success: true, user: res.user };
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setLoading(false);
        throw new Error(err.response.data.detail);
      }
      console.warn("Backend unavailable for registration, using local fallback...");
    }

    // 2. Local Fallback Registration
    const localUsers = getLocalUsers();
    if (localUsers[cleanEmail]) {
      setLoading(false);
      throw new Error("Analyst account with this email already exists.");
    }

    const newUser = {
      id: `usr_${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      role: cleanRole,
    };
    saveLocalUser(cleanEmail, { ...newUser, password });
    setCurrentUser(newUser);
    setLoading(false);
    return { success: true, user: newUser };
  };

  const quickDemoLogin = (role = "Lead SOC Analyst") => {
    const demoAnalyst = {
      id: "usr_analyst_01",
      name: "Nensi Borad",
      email: "analyst@phishshield.com",
      role: role,
    };
    setCurrentUser(demoAnalyst);
    return demoAnalyst;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: Boolean(currentUser),
        loading,
        login,
        register,
        logout,
        quickDemoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
