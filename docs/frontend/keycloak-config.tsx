import React, { useEffect, useState, createContext, useContext } from 'react';
import Keycloak from 'keycloak-js';

// Configuración de Keycloak
const keycloakConfig = {
  url: 'http://localhost:8080',
  realm: 'activa360',
  clientId: 'activa360-frontend',
};

const keycloak = new Keycloak(keycloakConfig);

interface AuthContextType {
  authenticated: boolean;
  token: string | undefined;
  username: string | undefined;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [username, setUsername] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    keycloak
      .init({
        onLoad: 'login-required', // Exige iniciar sesión al entrar a la app
        pkceMethod: 'S256',        // Seguridad PKCE obligatoria para SPAs
        checkLoginIframe: false,
      })
      .then((auth) => {
        setAuthenticated(auth);
        if (auth) {
          setToken(keycloak.token);
          setUsername(keycloak.tokenParsed?.preferred_username);
          
          // Configurar temporizador para refrescar el token antes de que expire
          setInterval(() => {
            keycloak.updateToken(70).then((refreshed) => {
              if (refreshed) {
                setToken(keycloak.token);
              }
            });
          }, 60000);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error al inicializar Keycloak:', err);
        setLoading(false);
      });
  }, []);

  const logout = () => {
    keycloak.logout();
  };

  if (loading) {
    return <div>Cargando autenticación y sesión...</div>;
  }

  return (
    <AuthContext.Provider value={{ authenticated, token, username, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

// Ejemplo de cómo consumir la API protegida con Axios
// import axios from 'axios';
//
// export const useApi = () => {
//   const { token } = useAuth();
//   const api = axios.create({
//     baseURL: 'http://localhost:3000/api',
//   });
//
//   api.interceptors.request.use((config) => {
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   });
//
//   return api;
// };
