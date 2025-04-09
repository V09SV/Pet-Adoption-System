import { useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export default function AuthPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Redirect to home if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Left Column - Auth Forms */}
            <div className="lg:w-1/2 p-8 md:p-12">
              <div className="max-w-md mx-auto">
                <div className="flex justify-center mb-6">
                  <span className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100">
                    <i className="fas fa-paw text-primary text-2xl"></i>
                  </span>
                </div>
                
                <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Welcome to PawMates</h2>
                <p className="text-center text-gray-600 mb-8">Join our community to find or list pets for adoption.</p>
                
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>
                  <TabsContent value="login">
                    <LoginForm onSuccess={() => navigate('/')} />
                  </TabsContent>
                  <TabsContent value="register">
                    <RegisterForm onSuccess={() => navigate('/')} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            
            {/* Right Column - Hero Image & Message */}
            <div className="lg:w-1/2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-90"></div>
              <img
                src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1286&q=80"
                alt="Pet adoption"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-12">
                <h3 className="text-3xl font-bold text-white mb-4">Find Your Perfect Companion</h3>
                <p className="text-white text-lg mb-6">
                  PawMates connects loving pets with caring owners. Create an account today to begin your journey.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center text-white">
                    <i className="fas fa-check-circle text-green-400 mr-2"></i>
                    <span>Browse thousands of pets waiting for a home</span>
                  </li>
                  <li className="flex items-center text-white">
                    <i className="fas fa-check-circle text-green-400 mr-2"></i>
                    <span>Message directly with pet owners</span>
                  </li>
                  <li className="flex items-center text-white">
                    <i className="fas fa-check-circle text-green-400 mr-2"></i>
                    <span>List your own pets for adoption</span>
                  </li>
                  <li className="flex items-center text-white">
                    <i className="fas fa-check-circle text-green-400 mr-2"></i>
                    <span>Join a community of pet lovers</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
