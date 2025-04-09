import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, KeyIcon, UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  rememberMe: z.boolean().default(false),
});

type LoginData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { loginMutation } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [savedUsername, setSavedUsername] = useState<string>("");
  
  // Check for saved username in localStorage
  useEffect(() => {
    const username = localStorage.getItem("savedUsername");
    if (username) {
      setSavedUsername(username);
      form.setValue("username", username);
      form.setValue("rememberMe", true);
    }
  }, []);

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = (data: LoginData) => {
    // Save username if rememberMe is checked
    if (data.rememberMe) {
      localStorage.setItem("savedUsername", data.username);
    } else {
      localStorage.removeItem("savedUsername");
    }
    
    // Submit to login API endpoint
    loginMutation.mutate(
      { username: data.username, password: data.password },
      {
        onSuccess: () => {
          if (onSuccess) onSuccess();
        },
        onError: (error) => {
          toast({
            title: "Login failed",
            description: error.message || "Please check your credentials and try again.",
            variant: "destructive",
          });
        }
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 font-medium">Username</FormLabel>
                <FormControl>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input 
                      placeholder="Enter your username" 
                      className="pl-10 py-5" 
                      {...field} 
                      autoComplete="username"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pl-10 py-5"
                      {...field}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between mt-2">
            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-indigo-500"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal text-gray-600 cursor-pointer">
                    Remember me
                  </FormLabel>
                </FormItem>
              )}
            />
            <Button 
              variant="link" 
              type="button"
              className="text-sm text-primary hover:text-indigo-700 px-0"
              onClick={() => toast({
                title: "Password Reset",
                description: "Please contact PawMates support to reset your password.",
              })}
            >
              Forgot password?
            </Button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-indigo-700 text-white py-6 rounded-md transition-all shadow-md hover:shadow-lg"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
        
        {loginMutation.isError && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {loginMutation.error.message || "Login failed. Please check your credentials."}
          </div>
        )}
        
        <FormDescription className="text-center text-xs text-gray-500 mt-4">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </FormDescription>
      </form>
    </Form>
  );
}
