import { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  login: (token: string, user: any) => void;
  logout: () => void;
  updateUser: (user: any) => void; // New function to update user state
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('jwtToken'));
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('currentUser');
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      return null;
    }
  });
  const navigate = useNavigate();

  const login = (token: string, userData: any) => {
    localStorage.setItem('jwtToken', token);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
    navigate('/'); // This redirect is only for initial login
  };

  const logout = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('currentUser');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
  };

  // New function that updates user data without redirecting
  const updateUser = (userData: any) => {
    localStorage.setItem('currentUser', JSON.stringify(userData));
    setUser(userData);
  };


  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};