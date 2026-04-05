import { Link, useNavigate } from "react-router-dom";
import { Wind, Heart, Sparkles, Gamepad2, BarChart3, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleProtectedNavigation = (path: string) => {
    if (user) {
      navigate(path);
    } else {
      // Store the intended destination
      localStorage.setItem("redirectAfterLogin", path);
      navigate("/auth", { state: { from: { pathname: path } } });
    }
  };

  return (
    <div className="flex flex-col items-center px-4 py-16 max-w-4xl mx-auto">
      <h1 className="text-4xl sm:text-5xl font-bold text-center mb-4">
        Find Your <span className="text-primary">Inner Peace</span>
      </h1>
      <p className="text-muted-foreground text-center max-w-lg mb-10 text-lg">
        Guided breathing, interactive mood games, and intelligent mental wellness tracking — all in one beautiful experience.
      </p>

      {/* Animated preview circle */}
      <div className="breathing-circle w-48 h-48 mb-10" style={{ animation: "pulse-glow 4s ease-in-out infinite" }}>
        <div className="breathing-circle-inner w-20 h-20 flex items-center justify-center" style={{ animation: "breathe-expand 4s ease-in-out infinite alternate" }}>
          <span className="text-primary-foreground font-semibold text-sm drop-shadow-sm">Breathe In</span>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-wrap gap-3 justify-center mb-16">
        <Link to="/breathing">
          <Button className="px-6 h-11 rounded-full gap-2">
            <Wind className="h-4 w-4" /> Start Relaxation
          </Button>
        </Link>
        
        {/* Play Mood Games - Protected */}
        <Button 
          variant="outline" 
          className="px-6 h-11 rounded-full gap-2"
          onClick={() => handleProtectedNavigation("/games")}
        >
          <Gamepad2 className="h-4 w-4" /> Play Mood Games
        </Button>
        
        {/* View Dashboard - Protected */}
        <Button 
          variant="outline" 
          className="px-6 h-11 rounded-full gap-2"
          onClick={() => handleProtectedNavigation("/dashboard")}
        >
          <BarChart3 className="h-4 w-4" /> View Dashboard
        </Button>
      </div>

      {/* Show login message if not logged in */}
      {!user && (
        <div className="mb-10 p-4 bg-primary/10 rounded-lg border border-primary/20 text-center max-w-md">
          <p className="text-sm text-primary font-medium">
            🔒 Please login to play games and track your progress
          </p>
          <Button 
            variant="link" 
            className="text-primary mt-1 p-0 h-auto"
            onClick={() => navigate("/auth")}
          >
            Sign in here →
          </Button>
        </div>
      )}

      {/* Qualities */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-10">
        {[
          { icon: Heart, title: "Calmness", desc: "Breathe & relax" },
          { icon: Wind, title: "Focus", desc: "Train your mind" },
          { icon: Sparkles, title: "Clarity", desc: "Find your balance" },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-center gap-3 p-5 bg-card rounded-xl border border-border">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        {/* Breathing Card - Always accessible */}
        <Link
          to="/breathing"
          className="flex flex-col gap-3 p-5 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all"
        >
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
            <Wind className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground">Breathing Exercises</h3>
          <p className="text-sm text-muted-foreground">4 scientifically-backed breathing patterns to calm your mind</p>
        </Link>

        {/* Games Card - Protected */}
        <div
          onClick={() => handleProtectedNavigation("/games")}
          className="flex flex-col gap-3 p-5 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
            <Gamepad2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground">Mood Games</h3>
          <p className="text-sm text-muted-foreground">Fun interactive games that help assess your mental state</p>
          {!user && (
            <span className="text-xs text-primary mt-2">🔒 Login to play</span>
          )}
        </div>

        {/* Dashboard Card - Protected */}
        <div
          onClick={() => handleProtectedNavigation("/dashboard")}
          className="flex flex-col gap-3 p-5 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground">Smart Dashboard</h3>
          <p className="text-sm text-muted-foreground">Track your progress with beautiful charts and insights</p>
          {!user && (
            <span className="text-xs text-primary mt-2">🔒 Login to view</span>
          )}
        </div>
      </div>

      {/* Optional: Report link if needed */}
      {user && (
        <div className="mt-6 text-center">
          <Link to="/report">
            <Button variant="ghost" size="sm" className="gap-2">
              <FileText className="h-4 w-4" /> View Detailed Report
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Index;