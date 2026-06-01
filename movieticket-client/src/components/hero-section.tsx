import { Sparkles, Monitor, Armchair } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative w-full min-h-[500px] flex items-center justify-center overflow-hidden pt-16">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop')`,
        }}
      />

      {/* Dramatic Dark Overlay */}
      <div className="absolute inset-0 bg-[#050505]/85" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/50 via-transparent to-[#050505]" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FF0033]/10 border border-[#FF0033]/30 rounded-full mb-8">
          <Sparkles className="w-4 h-4 text-[#FF0033]" />
          <span className="text-sm text-[#FF0033] font-medium">Premium Cinema Experience</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#F5F5F5] leading-tight mb-6 text-balance">
          Welcome to <span className="text-[#FF0033]">MovieTicket</span>
        </h1>

        {/* Description */}
        <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Immerse yourself in the ultimate cinematic journey. Experience movies the way they were 
          meant to be seen with our state-of-the-art screens, premium sound systems, and luxurious seating.
        </p>

        {/* Features */}
        <div className="flex flex-wrap justify-center gap-8 mb-10">
          <div className="flex items-center gap-2 text-gray-300">
            <Monitor className="w-5 h-5 text-[#FF0033]" />
            <span>4K Laser Projection</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Armchair className="w-5 h-5 text-[#FF0033]" />
            <span>Recliner Seating</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Sparkles className="w-5 h-5 text-[#FF0033]" />
            <span>Dolby Atmos Sound</span>
          </div>
        </div>

        {/* CTA */}
        <button className="inline-flex items-center gap-2 px-8 py-4 bg-[#FF0033] hover:bg-[#CC0029] text-[#F5F5F5] font-semibold rounded-lg transition-all duration-300 shadow-[0_0_30px_rgba(255,0,51,0.3)] hover:shadow-[0_0_40px_rgba(255,0,51,0.5)]">
          Browse Sessions
        </button>
      </div>
    </section>
  );
}
