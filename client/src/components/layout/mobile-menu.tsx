import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Link } from "wouter";
import { User } from "@shared/schema";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navLinks: { href: string; label: string; active: boolean }[];
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
}

export function MobileMenu({ 
  isOpen, 
  onClose, 
  navLinks, 
  user,
  onLogin,
  onLogout
}: MobileMenuProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[300px] sm:w-[400px]" side="left">
        <nav className="flex flex-col gap-4 mt-4">
          {navLinks.map((link) => (
            <Link 
              key={link.label}
              href={link.href} 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                link.active 
                  ? 'text-primary bg-indigo-50' 
                  : 'text-gray-700 hover:text-primary hover:bg-gray-50'
              }`}
              onClick={onClose}
            >
              {link.label}
            </Link>
          ))}
          
          <div className="pt-4 pb-3 border-t border-gray-200">
            {user ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50"
                  onClick={onClose}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/messages" 
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50"
                  onClick={onClose}
                >
                  Messages
                </Link>
                {user.isAdmin && (
                  <Link 
                    href="/admin" 
                    className="block px-3 py-2 rounded-md text-base font-medium text-primary hover:bg-indigo-50"
                    onClick={onClose}
                  >
                    Admin
                  </Link>
                )}
                <Button 
                  onClick={() => {
                    onLogout();
                    onClose();
                  }} 
                  variant="ghost" 
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={() => {
                    onLogin();
                    onClose();
                  }} 
                  variant="ghost" 
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50"
                >
                  Login
                </Button>
                <Button 
                  onClick={() => {
                    onLogin();
                    onClose();
                  }} 
                  className="block w-full mt-1 px-3 py-2 rounded-md text-base font-medium bg-primary text-white hover:bg-indigo-700"
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
