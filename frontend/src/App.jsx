import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
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

import "./css/index.css";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="app-layout">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/scanner" element={<Scanner />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/history" element={<ScanHistory />} />
                <Route path="/model" element={<ModelPerformance />} />
                <Route path="/about" element={<About />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
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
