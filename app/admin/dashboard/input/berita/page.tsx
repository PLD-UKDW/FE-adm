"use client";
import Image from "next/image";

export default function UnderDevelopment() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6">
      {/* Background Accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-40 h-40 bg-green-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-60 h-60 bg-lime-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 -translate-x-1/2 -translate-y-1/2 bg-green-300/5 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
        <div className="mb-8">
          <Image 
            src="/maintenance.jpg" 
            alt="Logo ULD" 
            width={400} 
            height={400} 
            className="mx-auto" 
          />
        </div>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#3e4095]">
          This <span className="text-[#02a502]">Page</span> is Under Development
        </h1>
      </div>
    </section>
  );
}