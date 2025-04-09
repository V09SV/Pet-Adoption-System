import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function Footer() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({ 
        title: "Error", 
        description: "Please enter a valid email address.", 
        variant: "destructive" 
      });
      return;
    }
    
    toast({ 
      title: "Success", 
      description: "Thanks for subscribing to our newsletter!" 
    });
    
    setEmail("");
  };

  return (
    <footer className="bg-gray-800 text-white pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center mb-4">
              <i className="fas fa-paw text-primary text-2xl mr-2"></i>
              <span className="font-accent font-bold text-xl text-white">PawMates</span>
            </div>
            <p className="text-gray-300 mb-4">Connecting pets with loving homes since 2023. Our mission is to make pet adoption simple, humane, and loving.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-white">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                <i className="fab fa-instagram"></i>
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-gray-300 hover:text-white">Home</Link></li>
              <li><Link href="/find-pets" className="text-gray-300 hover:text-white">Find Pets</Link></li>
              <li><Link href="/dashboard" className="text-gray-300 hover:text-white">List Your Pet</Link></li>
              <li><a href="#" className="text-gray-300 hover:text-white">How It Works</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white">About Us</a></li>
            </ul>
          </div>
          
          {/* Resources */}
          <div className="col-span-1">
            <h3 className="text-lg font-bold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white">Adoption Guide</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white">Pet Care Tips</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white">FAQs</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white">Contact Support</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white">Partner Shelters</a></li>
            </ul>
          </div>
          
          {/* Newsletter */}
          <div className="col-span-1">
            <h3 className="text-lg font-bold mb-4">Stay Updated</h3>
            <p className="text-gray-300 mb-4">Subscribe to our newsletter for adoption stories, pet care tips, and more.</p>
            <form className="flex flex-col sm:flex-row gap-2" onSubmit={handleSubscribe}>
              <Input
                type="email"
                placeholder="Your email address"
                className="px-4 py-2 rounded-md text-gray-800 w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button 
                type="submit" 
                className="bg-primary hover:bg-indigo-700 text-white px-4 py-2 rounded-md whitespace-nowrap"
              >
                Subscribe
              </Button>
            </form>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">© 2023 PawMates. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white text-sm">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
