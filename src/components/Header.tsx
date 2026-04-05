import { Link, useLocation } from "react-router-dom";
import { Wind, Home } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const Header = () => {
  const { pathname } = useLocation();

  const links = [
    { to: "/", label: "Home", icon: Home },
    { to: "/breathing", label: "Breathe", icon: Wind },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-card/70 border-b border-border">
      <div className="container flex items-center justify-between h-14 px-4 mx-auto">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <Wind className="h-5 w-5 text-primary" />
          <span className="text-primary">MindBreath</span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === to
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
          <div className="ml-2">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
