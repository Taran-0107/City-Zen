import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Leaf, 
  Home, 
  AlertTriangle, 
  BarChart3, 
  Users, 
  Trophy, 
  MapPin, 
  User,
  Menu,
  LogOut,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/report', label: 'Report', icon: AlertTriangle },
    { href: '/sustainability', label: 'Sustainability', icon: BarChart3 },
    { href: '/community', label: 'Community', icon: Users },
    { href: '/rewards', label: 'Rewards', icon: Trophy },
    { href: '/dashboard', label: 'Dashboard', icon: MapPin },
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/login', label: 'Logout', icon: LogOut },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Independent Logo (top-left of page) */}
      <Link 
        to="/" 
        className="fixed top-2 left-4 z-50 flex items-center space-x-2 group"
      >
        <motion.div
          className="p-2 bg-gradient-primary rounded-lg"
          whileHover={{ scale: 1.05, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
        >
          <Leaf className="w-6 h-6 text-white" />
        </motion.div>
        <span className="font-bold text-xl text-gradient-eco">City-Zen</span>
      </Link>

      {/* Desktop Navigation */}
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-lg border-b border-white/20"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 relative">
            
            {/* Desktop Menu - Center */}
            <div className="hidden md:flex items-center space-x-1 absolute left-1/2 -translate-x-1/2">
              {navItems.map((item) => (
                <Link key={item.href} to={item.href}>
                  <motion.div
                    className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 ${
                      isActive(item.href)
                        ? 'bg-gradient-primary text-white shadow-eco'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="font-medium">{item.label}</span>
                  </motion.div>
                </Link>
              ))}
            </div>

            {/* Mobile Menu Button - Right */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden ml-auto"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div
          className={`md:hidden bg-white/95 backdrop-blur-lg border-t border-white/20 ${
            isOpen ? 'block' : 'hidden'
          }`}
          initial={{ opacity: 0, height: 0 }}
          animate={{ 
            opacity: isOpen ? 1 : 0, 
            height: isOpen ? 'auto' : 0 
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="px-4 py-6 space-y-2">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                to={item.href}
                onClick={() => setIsOpen(false)}
              >
                <motion.div
                  className={`px-4 py-3 rounded-lg flex items-center space-x-3 transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-gradient-primary text-white shadow-eco'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                  }`}
                  whileHover={{ x: 10 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>
      </motion.nav>

      {/* Spacer for fixed nav */}
      <div className="h-16" />
    </>
  );
};

export default Navigation;
