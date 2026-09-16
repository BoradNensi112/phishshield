import React, { createContext, useContext, useState, useEffect } from "react";
import apiService from "../services/api";

const AuthContext = createContext();

const STORAGE_KEY = "phishshield_auth_user";
const LOCAL_USERS_KEY = "phishshield_registered_users";

// Strict Sanitizer: Under NO circumstances can any user other than admin@phishshield.com be admin
const sanitizeUser = (userObj) => {
  if (!userObj) return null;
  const clone = { ...userObj };
  const cleanEmail = (clone.email || "").toLowerCase().trim();
  if (cleanEmail !== "admin@phishshield.com") {
    clone.is_admin = false;
    if (clone.role === "SOC Administrator" || clone.role === "Admin") {
      clone.role = "SOC Security Analyst";
    }
  }
  return clone;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      const sanitized = sanitizeUser(parsed);
      // Clean up local storage immediately to eliminate stale admin cookies
      if (sanitized) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      }
      return sanitized;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  // Sync state to localStorage whenever it changes
  useEffect(() => {
    if (currentUser) {
      const sanitized = sanitizeUser(currentUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("phishshield_token");
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

  const login = async (email, password, roleMode = "user", adminSecretKey = null) => {
    setLoading(true);
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPass = password || "";

    try {
      // 1. Try Live FastAPI Backend
      const res = await apiService.login({
        email: cleanEmail,
        password: cleanPass,
        role_mode: roleMode,
        admin_secret_key: adminSecretKey
      });
      if (res && res.user) {
        if (res.token) {
          localStorage.setItem("phishshield_token", res.token);
        }
        const sanitized = sanitizeUser(res.user);
        if (roleMode !== "admin") {
          sanitized.is_admin = false;
        }
        setCurrentUser(sanitized);
        setLoading(false);
        return { success: true, user: sanitized };
      }
    } catch (err) {
      setLoading(false);
      if (err.response && err.response.data && err.response.data.detail) {
        throw new Error(err.response.data.detail);
      }
      throw new Error("Incorrect credentials");
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
        // Save local backup as well (without logging in)
        saveLocalUser(cleanEmail, {
          id: res.user.id,
          name: cleanName,
          email: cleanEmail,
          password,
          role: cleanRole,
          status: "active"
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
      status: "active"
    };
    saveLocalUser(cleanEmail, { ...newUser, password });
    setLoading(false);
    return { success: true, user: newUser };
  };

  const quickDemoLogin = (role = "Lead SOC Analyst") => {
    const demoAnalyst = {
      id: "usr_analyst_01",
      name: "Nensi Borad",
      email: "analyst@phishshield.com",
      role: role,
      status: "active"
    };
    setCurrentUser(demoAnalyst);
    return demoAnalyst;
  };

  const quickAdminLogin = () => {
    const demoAdmin = {
      id: "usr_admin_01",
      name: "Security Operations Center Admin",
      email: "admin@phishshield.com",
      role: "SOC Administrator",
      status: "active",
      is_admin: true
    };
    setCurrentUser(demoAdmin);
    return demoAdmin;
  };

  const refreshCurrentUser = async () => {
    if (!currentUser?.email) return;
    try {
      const data = await apiService.getUserProfile();
      if (data && data.user) {
        if (data.user.status === "suspended") {
          logout();
          return;
        }
        if (data.user.role !== currentUser.role) {
          setCurrentUser(prev => sanitizeUser({ ...prev, role: data.user.role }));
        }
      }
    } catch {
      // background refresh fallback
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("phishshield_token");
  };

  // STRICT ADMIN RULE: ONLY admin@phishshield.com with authenticated is_admin=true can EVER be admin
  const isAdmin = Boolean(
    currentUser &&
    currentUser.email?.toLowerCase().trim() === "admin@phishshield.com" &&
    currentUser.is_admin === true
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: Boolean(currentUser),
        isAdmin,
        loading,
        login,
        register,
        logout,
        quickDemoLogin,
        quickAdminLogin,
        refreshCurrentUser,
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
