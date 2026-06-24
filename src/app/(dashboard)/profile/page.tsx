"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES } from "@/lib/constants";
import { CheckCircle2, MessageCircle, AlertCircle } from "lucide-react";
import type { Category } from "@/types";

export default function ProfilePage() {
  const [whatsappNumber, setWhatsappNumber] = useState("9876543210");
  const [interests, setInterests] = useState<Category[]>(["AI", "STARTUPS"]);
  const [isSaved, setIsSaved] = useState(false);

  const toggleInterest = (id: Category) => {
    setInterests(
      interests.includes(id)
        ? interests.filter((i) => i !== id)
        : [...interests, id]
    );
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Profile & Interests</h1>
        <p className="text-muted-foreground">
          Manage your personal information and intelligence preferences.
        </p>
      </div>

      {/* WhatsApp Section */}
      <div className="bg-card border rounded-2xl p-6 md:p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-pulse-green/10 flex items-center justify-center shrink-0">
            <MessageCircle className="h-5 w-5 text-pulse-green" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">WhatsApp Delivery Number</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Where we send your intelligence digests and instant alerts.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 max-w-md">
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <div className="flex items-center px-3 bg-muted rounded-lg text-sm font-medium shrink-0">
                +91
              </div>
              <Input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ""))}
                className="h-10"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-pulse-green font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Verified Number
            </div>
          </div>
          <Button variant="outline" className="h-10">Update</Button>
        </div>
      </div>

      {/* Interests Section */}
      <div className="bg-card border rounded-2xl p-6 md:p-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Intelligence Interests</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Select the topics you want to monitor. Our AI will curate your feed based on these.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {CATEGORIES.map((category) => {
            const isSelected = interests.includes(category.id);
            return (
              <button
                key={category.id}
                onClick={() => toggleInterest(category.id)}
                className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "hover:border-primary/30"
                }`}
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: `${category.color}15`, color: category.color }}
                >
                  {/* Using generic icon for profile page for simplicity */}
                  <CheckCircle2 className={`h-5 w-5 ${isSelected ? "opacity-100" : "opacity-30"}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{category.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {category.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-card border rounded-2xl p-6 md:p-8">
        <h2 className="text-lg font-semibold mb-6">Account Information</h2>
        
        <div className="space-y-4 max-w-md">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <div className="flex items-center gap-2">
              <Input disabled value="founder@example.com" />
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-0">Google</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Connected via Google SSO</p>
          </div>
        </div>
      </div>

      {/* Save Actions */}
      <div className="flex items-center gap-4 pt-4 border-t">
        <Button onClick={handleSave} className="gradient-primary text-white border-0 px-8">
          Save Changes
        </Button>
        {isSaved && (
          <span className="text-sm text-pulse-green flex items-center gap-1.5 animate-fade-in">
            <CheckCircle2 className="h-4 w-4" /> Preferences saved
          </span>
        )}
      </div>
    </div>
  );
}
