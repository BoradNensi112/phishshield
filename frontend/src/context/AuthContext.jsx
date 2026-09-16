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
        setCurrentUser(res.user);
        setLoading(false);
        return { success: true, user: res.user };
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
      const all = await apiService.getAdminUsers();
      const me = all.find(u => u.email?.toLowerCase() === currentUser.email?.toLowerCase());
      if (me) {
        if (me.status === "suspended") {
          logout();
          return;
        }
        if (me.role !== currentUser.role) {
          setCurrentUser(prev => ({ ...prev, role: me.role }));
        }
      }
    } catch {
      // background refresh fallback
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const isAdmin = Boolean(
    currentUser && currentUser.is_admin === true
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
