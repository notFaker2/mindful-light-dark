import { Link, useLocation } from "react-router-dom";
import { Wind, Home, Gamepad2, LayoutDashboard, FileText, LogIn, LogOut, User } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const Header = () => {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();

  // Define all possible links
  const allLinks = [
    { to: "/", label: "Home", icon: Home, requiresAuth: false },
    { to: "/breathing", label: "Breathe", icon: Wind, requiresAuth: false },
    { to: "/games", label: "Games", icon: Gamepad2, requiresAuth: true },
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, requiresAuth: true },
    { to: "/report", label: "Report", icon: FileText, requiresAuth: true },
  ];

  // Filter links based on authentication
  const links = allLinks.filter(link => !link.requiresAuth || user);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-card/70 border-b border-border">
      <div className="container flex items-center justify-between h-14 px-4 mx-auto">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <Wind className="h-5 w-5 text-primary" />
          <span className="text-primary">MindBreath</span>
        </Link>
        <nav className="flex items-center gap-0.5 overflow-x-auto">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                pathname === to || (to !== "/" && pathname.startsWith(to))
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
          <div className="ml-1.5">
            <ThemeToggle />
          </div>
          {user ? (
            <div className="flex items-center gap-1.5 ml-1.5">
              <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground px-2 py-1 rounded-lg bg-muted">
                <User className="h-3 w-3" />
                {user.user_metadata?.display_name || user.email?.split("@")[0]}
              </span>
              <Button variant="ghost" size="sm" onClick={signOut} className="h-8 px-2 text-xs">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Logout</span>
              </Button>
            </div>
          ) : (
            <Link to="/auth" className="ml-1.5">
              <Button variant="default" size="sm" className="h-8 px-3 text-xs">
                <LogIn className="h-4 w-4" />
                <span className="ml-1">Login</span>
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;