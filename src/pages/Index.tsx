import { Link } from "react-router-dom";
import { Wind, Heart, Sparkles, Gamepad2, BarChart3, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
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
        <Link to="/games">
          <Button variant="outline" className="px-6 h-11 rounded-full gap-2">
            <Gamepad2 className="h-4 w-4" /> Play Mood Games
          </Button>
        </Link>
        <Link to="/dashboard">
          <Button variant="outline" className="px-6 h-11 rounded-full gap-2">
            <BarChart3 className="h-4 w-4" /> View Dashboard
          </Button>
        </Link>
      </div>

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
        {[
          { to: "/breathing", icon: Wind, title: "Breathing Exercises", desc: "4 scientifically-backed breathing patterns to calm your mind" },
          { to: "/games", icon: Gamepad2, title: "Mood Games", desc: "Fun interactive games that help assess your mental state" },
          { to: "/dashboard", icon: BarChart3, title: "Smart Dashboard", desc: "Track your progress with beautiful charts and insights" },
        ].map(({ to, icon: Icon, title, desc }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col gap-3 p-5 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all"
          >
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Index;
