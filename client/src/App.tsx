import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { Footer } from "@/components/footer";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import CreateRide from "@/pages/create-ride";
import JoinRide from "@/pages/join-ride";
import RideDetails from "@/pages/ride-details";
import VendorDashboard from "@/pages/vendor-dashboard";
import GuidePage from "@/pages/guide-page";
import BusGuidePage from "@/pages/bus-guide-page";
import ProfilePage from "@/pages/profile";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/">
        {() => <Redirect to="/home" />}
      </Route>
      <Route path="/home" component={HomePage} />
      <Route path="/guide" component={GuidePage} />
      <Route path="/bus-guide" component={BusGuidePage} />
      <ProtectedRoute path="/rides/create" component={CreateRide} />
      <ProtectedRoute path="/rides/edit/:id" component={CreateRide} />
      <ProtectedRoute path="/rides/:id/join" component={JoinRide} />
      <Route path="/rides/:id" component={RideDetails} />
      <ProtectedRoute path="/vendor" component={VendorDashboard} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <Router />
          <Footer />
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;