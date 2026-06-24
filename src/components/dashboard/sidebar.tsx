"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Bookmark, 
  User, 
  Settings, 
  LogOut, 
  Menu,
  X
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";

const navItems = [
  { name: "Feed", href: "/feed", icon: LayoutDashboard },
  { name: "Saved", href: "/saved", icon: Bookmark },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobile = () => setMobileOpen(!mobileOpen);

  return (
    <>
      {/* Mobile Topbar & Hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b bg-background/80 backdrop-blur-md z-40 flex items-center justify-between px-4">
        <Logo size="small" />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={toggleMobile}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40 top-16"
          onClick={toggleMobile}
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={`fixed lg:sticky top-16 lg:top-0 left-0 z-40 h-[calc(100vh-4rem)] lg:h-screen w-64 border-r bg-card transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } flex flex-col`}
      >
        <div className="hidden lg:flex h-16 items-center px-6 border-b">
          <Logo size="small" />
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t space-y-4">
          <div className="hidden lg:flex items-center justify-between px-2">
            <span className="text-sm font-medium text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted">
            <LogOut className="mr-3 h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>
    </>
  );
}
