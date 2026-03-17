import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthContext, useAuthProvider } from "@/hooks/useAuth";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RoleSelectionPage from "./pages/RoleSelectionPage";
import DashboardPage from "./pages/DashboardPage";
import CropPlanningPage from "./pages/CropPlanningPage";
import ShelfLifePage from "./pages/ShelfLifePage";
import GovernmentSchemesPage from "./pages/GovernmentSchemesPage";
import ExpensesPage from "./pages/ExpensesPage";
import ChatbotPage from "./pages/ChatbotPage";
import SettingsPage from "./pages/SettingsPage";
import MarketplacePage from "./pages/MarketplacePage";
import BuyerRequestsPage from "./pages/BuyerRequestsPage";
import DataAnalystPage from "./pages/DataAnalystPage";
import FarmerTalkPage from "./pages/FarmerTalkPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const auth = useAuthProvider();

  return (
    <AuthContext.Provider value={auth}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/role-selection" element={<RoleSelectionPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/crop-planning" element={<CropPlanningPage />} />
              <Route path="/shelf-life" element={<ShelfLifePage />} />
              <Route path="/government-schemes" element={<GovernmentSchemesPage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/chatbot" element={<ChatbotPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/buyer-requests" element={<BuyerRequestsPage />} />
              <Route path="/data-analyst" element={<DataAnalystPage />} />
              <Route path="/farmer-talk" element={<FarmerTalkPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthContext.Provider>
  );
};

export default App;
