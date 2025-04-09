import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import FindPetsPage from "@/pages/find-pets-page";
import PetDetailsPage from "@/pages/pet-details-page";
import OwnerDashboardPage from "@/pages/owner-dashboard-page";
import MessagesPage from "@/pages/messages-page";
import AdminDashboardPage from "@/pages/admin-dashboard-page";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/find-pets" component={FindPetsPage} />
      <Route path="/pet/:id" component={PetDetailsPage} />
      <ProtectedRoute path="/dashboard" component={OwnerDashboardPage} />
      <ProtectedRoute path="/messages" component={MessagesPage} />
      <ProtectedRoute path="/admin" component={AdminDashboardPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router />
      <Toaster />
    </AuthProvider>
  );
}

export default App;
