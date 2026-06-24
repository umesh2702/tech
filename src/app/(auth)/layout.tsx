export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between gradient-primary p-12 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-dots opacity-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-white/5 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a8 8 0 0 0-8 8c0 1.892.402 3.13 1.5 4.5L12 22l6.5-7.5c1.098-1.37 1.5-2.608 1.5-4.5a8 8 0 0 0-8-8Z" />
              </svg>
            </div>
            <span className="text-xl font-bold">Pulse AI</span>
          </div>
        </div>

        <div className="relative z-10">
          <blockquote className="text-2xl font-semibold leading-relaxed mb-6">
            &ldquo;Stop reading news.<br />
            Start getting intelligence.&rdquo;
          </blockquote>
          <p className="text-white/70 text-sm">
            AI-powered founder intelligence delivered on WhatsApp.
            <br />
            Built for founders, investors, and builders.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-white/60 text-xs">
          <span>50+ Sources</span>
          <span>•</span>
          <span>AI Analysis</span>
          <span>•</span>
          <span>WhatsApp Delivery</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
