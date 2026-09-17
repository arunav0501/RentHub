import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/navbar/Navbar';
import Landing from './pages/Landing/Landing';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import OwnerDashboard from './pages/OwnerDashboard/OwnerDashboard';
import ProductDetails from './pages/ProductDetails/ProductDetails';
import { AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-200">
        <Navbar />
        <main className="flex-grow pt-16">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <OwnerDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
      <Toaster position="top-right" />
      </div>
    </ThemeProvider>
  );
}

export default App;
