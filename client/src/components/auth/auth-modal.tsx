import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
}

export function AuthModal({ isOpen, onClose, defaultTab = "login" }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { user } = useAuth();

  // If user is logged in, close the modal
  useEffect(() => {
    if (user && isOpen) {
      onClose();
    }
  }, [user, isOpen, onClose]);

  const handleSuccess = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center mb-2">
            {activeTab === "login" ? "Welcome Back" : "Create an Account"}
          </DialogTitle>
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
              <i className="fas fa-paw text-primary text-xl"></i>
            </span>
          </div>
          <p className="text-center text-gray-600 mb-6">
            {activeTab === "login"
              ? "Sign in to access your account and continue your adoption journey."
              : "Join our community of pet lovers and find your perfect companion."}
          </p>
        </DialogHeader>

        <Tabs 
          defaultValue={defaultTab} 
          value={activeTab} 
          onValueChange={(v) => setActiveTab(v as "login" | "register")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <LoginForm onSuccess={handleSuccess} />
          </TabsContent>
          <TabsContent value="register">
            <RegisterForm onSuccess={handleSuccess} />
          </TabsContent>
        </Tabs>

        <div className="relative flex items-center justify-center mt-6 mb-6">
          <div className="border-t border-gray-300 absolute w-full"></div>
          <div className="bg-white px-4 relative text-sm text-gray-500">or continue with</div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50">
            <i className="fab fa-google text-red-500 mr-2"></i>
            <span className="text-sm font-medium text-gray-700">Google</span>
          </button>
          <button className="flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50">
            <i className="fab fa-facebook-f text-blue-600 mr-2"></i>
            <span className="text-sm font-medium text-gray-700">Facebook</span>
          </button>
        </div>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            {activeTab === "login" ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => setActiveTab(activeTab === "login" ? "register" : "login")}
              className="text-primary hover:text-indigo-700 font-medium"
            >
              {activeTab === "login" ? "Sign up" : "Login"}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
