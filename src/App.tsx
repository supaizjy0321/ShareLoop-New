import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { RouterErrorBoundary } from "@/components/RouterErrorBoundary";
import AuthPage from "./pages/AuthPage";
import ExplorePage from "./pages/ExplorePage";
import VendorDashboard from "./pages/VendorDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const homeForRole = (role: 'vendor' | 'customer') =>
  role === 'vendor' ? '/vendor-dashboard' : '/customer-dashboard';

const AppRoutes = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<AuthPage />} />
        {/* After vendor/customer logout, the browser can still be on /vendor-dashboard
            or /customer-dashboard. Normalize to "/" so login + redirects behave reliably. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  const home = homeForRole(user.role);

  return (
    <Routes>
      <Route path="/" element={<Navigate to={home} replace />} />
      <Route
        path="/explore"
        element={user.role === 'customer' ? <ExplorePage /> : <Navigate to={home} replace />}
      />
      <Route
        path="/vendor-dashboard"
        element={user.role === 'vendor' ? <VendorDashboard /> : <Navigate to={home} replace />}
      />
      <Route
        path="/customer-dashboard"
        element={user.role === 'customer' ? <CustomerDashboard /> : <Navigate to={home} replace />}
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <DataProvider>
          <BrowserRouter>
            <RouterErrorBoundary>
              <AppRoutes />
            </RouterErrorBoundary>
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
