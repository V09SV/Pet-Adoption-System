import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { AuthModal } from "@/components/auth/auth-modal";
import { useModal } from "@/hooks/use-modal";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const { isOpen: isAuthModalOpen, open: openAuthModal, close: closeAuthModal } = useModal();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navLinks = [
    { href: "/", label: "Home", active: location === "/" },
    { href: "/find-pets", label: "Find Pets", active: location === "/find-pets" },
    { href: "#", label: "Resources", active: false },
    { href: "#", label: "About Us", active: false },
  ];

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <i className="fas fa-paw text-primary text-2xl mr-2"></i>
                <span className="font-accent font-bold text-xl text-primary">PawMates</span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navLinks.map((link) => (
                <Link 
                  key={link.label}
                  href={link.href} 
                  className={`text-${link.active ? 'gray-900 border-primary' : 'gray-500 border-transparent'} hover:text-primary px-3 py-2 text-sm font-medium border-b-2`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            
            {/* User Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <>
                  <Link href="/dashboard" className="text-gray-700 hover:text-primary text-sm font-medium">Dashboard</Link>
                  <Link href="/messages" className="text-gray-700 hover:text-primary text-sm font-medium">Messages</Link>
                  {user.isAdmin && (
                    <Link href="/admin" className="text-primary font-medium text-sm">Admin</Link>
                  )}
                  <Button 
                    onClick={handleLogout} 
                    variant="outline" 
                    className="text-gray-700 hover:text-primary text-sm font-medium"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={openAuthModal} 
                    variant="ghost" 
                    className="text-gray-700 hover:text-primary text-sm font-medium"
                  >
                    Login
                  </Button>
                  <Button 
                    onClick={openAuthModal} 
                    className="bg-primary hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setIsOpen(true)} 
                className="text-gray-500 hover:text-primary focus:outline-none"
              >
                <i className="fas fa-bars text-xl"></i>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        <MobileMenu 
          isOpen={isOpen} 
          onClose={() => setIsOpen(false)} 
          navLinks={navLinks}
          user={user}
          onLogin={openAuthModal}
          onLogout={handleLogout}
        />
      </header>

      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
    </>
  );
}
