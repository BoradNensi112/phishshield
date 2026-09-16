import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Scanner from "./pages/Scanner";
import Dashboard from "./pages/Dashboard";
import ScanHistory from "./pages/ScanHistory";
import ModelPerformance from "./pages/ModelPerformance";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminPortal from "./pages/AdminPortal";
import UserProfile from "./pages/UserProfile";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import "./css/index.css";

// Root entry point: Lands directly on Login page if unauthenticated
const RootRedirect = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Scanner /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="app-layout">
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* Default Entry Point: Direct Login */}
                <Route path="/" element={<RootRedirect />} />
                <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/about" element={<About />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Authenticated Analyst Only Routes */}
                <Route
                  path="/scanner"
                  element={
                    <ProtectedRoute>
                      <Scanner />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <ScanHistory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <UserProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/model"
                  element={
                    <ProtectedRoute>
                      <ModelPerformance />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminPortal />
                    </AdminRoute>
                  }
                />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
