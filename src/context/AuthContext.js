import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // Inicializa el token con lo que esté en localStorage
  const [authToken, setAuthToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (authToken) {
      // Guarda el token en localStorage y decodifica el payload
      localStorage.setItem('token', authToken);
      try {
        // El payload del JWT es { uid: usuarioDB.id, rol: usuarioDB.rol_id }
        const decoded = jwtDecode(authToken);
        setUser({ 
          id: decoded.uid, // ID del usuario
          rol: decoded.rol // Rol del usuario (1=Admin, 3=Alumno)
        });
      } catch (error) {
        console.error("Error decodificando token:", error);
        logout(); // Cierra sesión si el token es inválido
      }
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [authToken]);

  const login = (token) => {
    setAuthToken(token);
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const isAuthenticated = !!authToken;
  const isStudent = user && user.rol === 3;

  return (
    <AuthContext.Provider value={{ authToken, user, isAuthenticated, isStudent, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};