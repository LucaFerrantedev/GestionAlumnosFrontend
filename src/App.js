import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Componente de enrutamiento básico para proteger rutas
const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/" />;
};

const App = () => {
  return (
    // Envuelve toda la app con el Router
    <Router>
      {/* Envuelve las rutas con el AuthProvider para que puedan usar el contexto */}
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Si está autenticado, redirige a /dashboard, sino a /login */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
      
      {/* La ruta del Dashboard está protegida */}
      <Route 
        path="/dashboard" 
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } 
      />
      
      {/* Manejo de rutas no definidas */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} />} />
    </Routes>
  );
};

export default App;