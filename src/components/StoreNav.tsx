import { Menu, Code } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LiveSearchBar from "@/components/LiveSearchBar";
import { CartDrawer } from "@/components/CartDrawer";
import type { IntentType } from "@/lib/personalization-engine";
import smartswapLogo from "@/assets/smartswap-logo.png";

interface StoreNavProps {
  intent: IntentType;
}

const intentAccentClass: Record<IntentType, string> = {
  gaming: "text-gaming",
  productivity: "text-productivity",
  budget: "text-budget",
  creative: "text-creative",
  student: "text-student",
  developer: "text-developer",
  default: "text-primary",
};

const StoreNav = ({ intent }: StoreNavProps) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel">
      <div className="container mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src={smartswapLogo} alt="SmartSwap" className="w-8 h-8 rounded-md" />
          <span className="font-display text-xl font-bold tracking-tight text-foreground">
            Smart<span className={`${intentAccentClass[intent]} transition-colors duration-700`}>Swap</span>
          </span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {["Gaming", "Office", "Creative", "Sale"].map((item) => (
            <a key={item} href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {item}
            </a>
          ))}
          <Link
            to="/integrate"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            <Code className="w-3.5 h-3.5" />
            Integration Guide
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <LiveSearchBar />
          <CartDrawer />
          <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground">
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default StoreNav;
