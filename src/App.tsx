import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Index from "./pages/Index.tsx";
import Breathing from "./pages/Breathing.tsx";
import Games from "./pages/Games.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Report from "./pages/Report.tsx";
import Auth from "./pages/Auth.tsx";
import NotFound from "./pages/NotFound.tsx";

import MoodColors from "@/components/games/MoodColors";
import StressSquish from "@/components/games/StressSquish";
import MemoryMatch from "@/components/games/MemoryMatch";
import MoodCheckIn from "@/components/games/MoodCheckIn";
import CalmMaze from "@/components/games/CalmMaze";
import BreathRhythm from "@/components/games/BreathRhythm";
import FocusDot from "@/components/games/FocusDot";
import CopingPuzzle from "@/components/games/CopingPuzzle";
import BreathCount from "@/components/games/BreathCount";

import { supabase } from "./integrations/supabase/client.ts";
import { useEffect } from "react";

const queryClient = new QueryClient();

// Create a wrapper component that handles auth redirects
const AppContent = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // Redirect to home page on sign out
        navigate("/");
      }
    });

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <>
      <Header />
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<Index />} />
        <Route path="/breathing" element={<Breathing />} />
        <Route path="/games" element={<Games />} />
        <Route path="/games/mood-colors" element={<MoodColors />} />
        <Route path="/games/stress-squish" element={<StressSquish />} />
        <Route path="/games/memory-match" element={<MemoryMatch />} />
        <Route path="/games/mood-checkin" element={<MoodCheckIn />} />
        <Route path="/games/calm-maze" element={<CalmMaze />} />
        <Route path="/games/breath-rhythm" element={<BreathRhythm />} />
        <Route path="/games/focus-dot" element={<FocusDot />} />
        <Route path="/games/coping-puzzle" element={<CopingPuzzle />} />
        <Route path="/games/breath-count" element={<BreathCount />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/report" element={<Report />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;