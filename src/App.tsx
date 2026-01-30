import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { SuperadminLayout } from "./components/superadmin/SuperadminLayout";
import { SuperadminDashboard } from "./pages/superadmin/SuperadminDashboard";
import { CustomersPage } from "./pages/superadmin/CustomersPage";
import { FinancialYearsPage } from "./pages/superadmin/FinancialYearsPage";
import { ModulesPage } from "./pages/superadmin/ModulesPage";
import { PermissionsPage } from "./pages/superadmin/PermissionsPage";
import { UsersPage } from "./pages/superadmin/UsersPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            
            {/* Superadmin Routes */}
            <Route path="/superadmin" element={<SuperadminLayout />}>
              <Route index element={<SuperadminDashboard />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="financial-years" element={<FinancialYearsPage />} />
              <Route path="modules" element={<ModulesPage />} />
              <Route path="permissions" element={<PermissionsPage />} />
              <Route path="users" element={<UsersPage />} />
            </Route>
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
