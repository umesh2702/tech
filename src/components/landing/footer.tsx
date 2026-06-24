"use client";

import { Logo } from "@/components/shared/logo";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="border-t bg-card/50" id="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Logo size="small" />
            <p className="text-sm text-muted-foreground mt-3 max-w-xs leading-relaxed">
              AI-powered founder intelligence delivered on WhatsApp. Built for builders.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Product</h4>
            <ul className="space-y-2.5">
              <li><a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
              <li><a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Intelligence</h4>
            <ul className="space-y-2.5">
              <li><span className="text-sm text-muted-foreground">Artificial Intelligence</span></li>
              <li><span className="text-sm text-muted-foreground">Startups</span></li>
              <li><span className="text-sm text-muted-foreground">Funding</span></li>
              <li><span className="text-sm text-muted-foreground">Developer Tools</span></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Legal</h4>
            <ul className="space-y-2.5">
              <li><span className="text-sm text-muted-foreground">Privacy Policy</span></li>
              <li><span className="text-sm text-muted-foreground">Terms of Service</span></li>
              <li><span className="text-sm text-muted-foreground">Cookie Policy</span></li>
            </ul>
          </div>
        </div>

        <Separator className="mb-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Pulse AI. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Built with 🧠 for founders, by founders.
          </p>
        </div>
      </div>
    </footer>
  );
}
