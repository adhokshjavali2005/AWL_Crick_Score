import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MatchProvider } from "@/contexts/MatchContext";
import AppHeader from "@/components/AppHeader";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import MatchDashboard from "@/pages/MatchDashboard";
import AdminPanel from "@/pages/AdminPanel";
import ScoringPanel from "@/pages/ScoringPanel";
import MatchSummary from "@/pages/MatchSummary";
import Scorecard from "@/pages/Scorecard";
import CreateMatch from "@/pages/CreateMatch";
import LiveMatches from "@/pages/LiveMatches";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <MatchProvider>
        <TooltipProvider>
          <BrowserRouter>
            <AppHeader />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/match" element={<MatchDashboard />} />
              <Route path="/create-match" element={<CreateMatch />} />
              <Route path="/live-matches" element={<LiveMatches />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/admin/scoring" element={<ScoringPanel />} />
              <Route path="/scorecard" element={<Scorecard />} />
              <Route path="/summary" element={<MatchSummary />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </MatchProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
