import { Link } from "react-router-dom";
import { Wind, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="flex flex-col items-center px-4 py-16 max-w-4xl mx-auto">
      <h1 className="text-4xl sm:text-5xl font-bold text-center mb-4">
        Find Your <span className="text-primary">Inner Peace</span>
      </h1>
      <p className="text-muted-foreground text-center max-w-lg mb-10 text-lg">
        Guided breathing exercises to calm your mind, sharpen focus, and improve sleep.
      </p>

      {/* Animated preview circle */}
      <div className="breathing-circle w-48 h-48 mb-10" style={{ animation: "pulse-glow 4s ease-in-out infinite" }}>
        <div className="breathing-circle-inner w-20 h-20 flex items-center justify-center" style={{ animation: "breathe-expand 4s ease-in-out infinite alternate" }}>
          <span className="text-primary-foreground font-semibold text-sm drop-shadow-sm">Breathe</span>
        </div>
      </div>

      <Link to="/breathing">
        <Button className="px-8 h-12 rounded-full text-base gap-2">
          <Wind className="h-5 w-5" />
          Start Breathing
        </Button>
      </Link>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-16">
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
    </div>
  );
};

export default Index;
