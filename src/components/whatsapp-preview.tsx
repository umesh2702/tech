import { Check, CheckCheck } from "lucide-react";
import type { IntelligenceItem } from "@/types";

interface WhatsAppPreviewProps {
  items: IntelligenceItem[];
}

export function WhatsAppPreview({ items }: WhatsAppPreviewProps) {
  const topItem = items[0];
  const secondItem = items[1];

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="max-w-[350px] mx-auto bg-[#efeae2] dark:bg-[#0b141a] rounded-[30px] border-[8px] border-black/90 shadow-2xl overflow-hidden relative">
      {/* Top Bar */}
      <div className="bg-[#008069] dark:bg-[#202c33] text-white px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
          P
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-[15px] leading-tight">Pulse AI</h4>
          <p className="text-[11px] text-white/80">bot</p>
        </div>
      </div>

      {/* Chat Background */}
      <div className="p-4 space-y-4 h-[500px] overflow-y-auto" style={{ backgroundImage: "url('https://static.whatsapp.net/rsrc.php/v3/yl/r/gi_DckOUM5a.png')", opacity: 0.9 }}>
        
        {/* Message Bubble */}
        <div className="bg-white dark:bg-[#202c33] p-3 rounded-2xl rounded-tl-none shadow-sm relative w-[90%]">
          <div className="absolute top-0 -left-2 w-0 h-0 border-t-[10px] border-t-white dark:border-t-[#202c33] border-l-[10px] border-l-transparent"></div>
          
          <div className="text-[13px] leading-snug space-y-3 text-[#111b21] dark:text-[#e9edef]">
            <p className="font-bold text-[14px]">🎯 Pulse AI Digest</p>
            <p>Here are your top opportunities today:</p>
            
            {topItem && (
              <div className="border-l-4 border-[#00a884] pl-2 space-y-1">
                <p className="font-bold">[{topItem.opportunityScore}/10] {topItem.title}</p>
                <p>💡 <span className="font-semibold">Opp:</span> {topItem.opportunity}</p>
                <p className="text-blue-500 underline text-xs pt-1">{topItem.sourceUrl}</p>
              </div>
            )}

            {secondItem && (
              <div className="border-l-4 border-pulse-amber pl-2 space-y-1">
                <p className="font-bold">[{secondItem.opportunityScore}/10] {secondItem.title}</p>
                <p>💡 <span className="font-semibold">Opp:</span> {secondItem.opportunity}</p>
                <p className="text-blue-500 underline text-xs pt-1">{secondItem.sourceUrl}</p>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground pt-2">Reply /settings to change digest frequency.</p>
          </div>
          
          <div suppressHydrationWarning className="text-[10px] text-gray-400 text-right mt-1 flex items-center justify-end gap-1">
            {currentTime}
          </div>
        </div>

      </div>

      {/* Input Bar */}
      <div className="bg-[#f0f2f5] dark:bg-[#202c33] p-2 flex items-center gap-2">
        <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-full px-4 py-2 text-sm text-muted-foreground border dark:border-none">
          Message
        </div>
        <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center text-white">
          <Check className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
