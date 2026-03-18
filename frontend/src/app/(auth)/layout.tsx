export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#09090b]">
      {/* Gradient orbs */}
      <div className="absolute -top-32 right-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-violet-500/[0.10] to-indigo-500/[0.05] blur-[140px] animate-float-slow" />
      <div className="absolute -bottom-40 -left-20 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-amber-500/[0.08] to-orange-400/[0.03] blur-[120px] animate-float-slower" />
      <div className="absolute top-1/3 right-10 h-[300px] w-[300px] rounded-full bg-gradient-to-bl from-amber-400/[0.04] to-transparent blur-[100px]" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 -z-[9] opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Grain texture */}
      <div className="absolute inset-0 grain pointer-events-none" />

      <div className="w-full max-w-md px-4 relative z-10">
        {children}
      </div>
    </div>
  );
}
