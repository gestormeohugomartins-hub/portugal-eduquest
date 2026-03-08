import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import ParentRegisterPage from "./pages/ParentRegisterPage";
import StudentRegisterPage from "./pages/StudentRegisterPage";
import GamePage from "./pages/GamePage";
import ParentDashboard from "./pages/ParentDashboard";
import PlacementTestPage from "./pages/PlacementTestPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register/parent" element={<ParentRegisterPage />} />
            <Route path="/register/student" element={<StudentRegisterPage />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/parent" element={<ParentDashboard />} />
            <Route path="/placement-test" element={<PlacementTestPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
