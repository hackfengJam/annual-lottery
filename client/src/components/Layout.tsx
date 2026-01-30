import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Settings, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/images/cyberpunk-logo.png" alt="Logo" className="h-8 w-8" />
            <span className="text-xl font-display font-bold tracking-wider text-white neon-text-blue">
              ANNUAL LOTTERY
            </span>
          </div>
          
          <nav className="flex items-center gap-4">
            <Link href="/">
              <Button 
                variant="ghost" 
                className={cn(
                  "text-lg font-display hover:text-cyan-400 hover:bg-cyan-950/30",
                  location === "/" && "text-cyan-400 neon-text-blue bg-cyan-950/30"
                )}
              >
                <Gift className="mr-2 h-4 w-4" /> 抽奖现场
              </Button>
            </Link>
            
            <Link href="/settings">
              <Button 
                variant="ghost" 
                className={cn(
                  "text-lg font-display hover:text-pink-400 hover:bg-pink-950/30",
                  location === "/settings" && "text-pink-400 neon-text-pink bg-pink-950/30"
                )}
              >
                <Settings className="mr-2 h-4 w-4" /> 后台设置
              </Button>
            </Link>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 relative">
        {children}
      </main>
    </div>
  );
}
