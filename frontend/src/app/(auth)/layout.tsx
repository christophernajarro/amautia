export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#09090b]">
      {/* Radial gradient base */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(245,158,11,0.08), transparent)",
        }}
      />
      {/* Grid pattern */}
      <div
        className="absolute inset-0 -z-[9] opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      {/* Gradient orbs */}
      <div className="absolute -top-40 right-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-amber-500/[0.07] to-orange-500/[0.03] blur-[120px]" />
      <div className="absolute -bottom-60 -left-40 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-amber-400/[0.05] to-yellow-300/[0.02] blur-[120px]" />
      {/* Grain */}
      <div className="absolute inset-0 -z-[8] grain pointer-events-none" />

      <div className="w-full max-w-md px-4 relative z-10">
        {children}
      </div>
    </div>
  );
}
