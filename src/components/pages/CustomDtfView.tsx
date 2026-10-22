import React from 'react';
import type { StoreBrandConfig } from '../../types/store';

interface CustomDtfViewProps {
  navigate: (path: string) => void;
  storeBrand: StoreBrandConfig;
}

export const CustomDtfView: React.FC<CustomDtfViewProps> = ({ navigate, storeBrand }) => {
  const whatsappUrl = `https://wa.me/${storeBrand.whatsappPhone || '919121798653'}?text=${encodeURIComponent(
    "Hi TH3EE! I'm interested in designing a custom DTF printed premium T-shirt. Please guide me through fabric options, sizing, and submitting my artwork."
  )}`;

  return (
    <div className="w-full bg-[#FAFAFA] min-h-[80vh] py-8 sm:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 sm:mb-8 text-[11px] sm:text-xs font-mono uppercase tracking-wider text-neutral-500 flex items-center space-x-2">
          <button type="button" onClick={() => navigate('/')} className="hover:text-[#E51E2B] transition-colors">Home</button>
          <span>/</span>
          <span className="text-neutral-900 font-bold">Custom DTF Studio</span>
        </nav>

        {/* Hero Banner */}
        <div className="bg-white border border-neutral-200 rounded-sm p-6 sm:p-12 shadow-xs mb-8 sm:mb-12">
          <div className="inline-block bg-[#E51E2B] text-white text-[10px] sm:text-xs font-mono font-bold px-2.5 py-1 uppercase tracking-widest mb-4">
            Tirupati Atelier Studio
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase text-neutral-900 tracking-tight leading-tight">
            Custom DTF Printed T-Shirts <br />
            <span className="text-[#E51E2B]">High-Definition Craftsmanship</span>
          </h1>
          <p className="mt-4 text-sm sm:text-base text-neutral-600 max-w-2xl leading-relaxed">
            Design your own premium T-shirt with TH3EE. High-definition Direct-to-Film (DTF) printing, rich colour saturation, and a lasting wash-proof finish on heavyweight luxury fabric, crafted in Tirupati.
          </p>

          <div className="mt-6 sm:mt-8 flex flex-wrap gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] hover:bg-[#1EBE5D] text-white font-mono font-bold text-xs uppercase px-6 py-3 tracking-wider flex items-center gap-2 shadow-xs transition-colors"
            >
              <span>Order Custom DTF on WhatsApp</span>
            </a>
            <button
              type="button"
              onClick={() => navigate('/shop')}
              className="bg-black hover:bg-[#E51E2B] text-white font-mono font-bold text-xs uppercase px-6 py-3 tracking-wider shadow-xs transition-colors"
            >
              Browse Catalog Drops
            </button>
          </div>
        </div>

        {/* Technical Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white border border-neutral-200 p-6 rounded-sm">
            <div className="w-10 h-10 rounded-full bg-red-50 text-[#E51E2B] font-mono font-bold flex items-center justify-center text-sm mb-4">
              01
            </div>
            <h3 className="text-base font-bold uppercase text-neutral-900 mb-2">Ultra-HD DTF Detailing</h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Industrial multi-pass Direct-to-Film transfer technology captures razor-sharp gradients, micro-linework, and vibrant CMYK+White inks without color bleed.
            </p>
          </div>

          <div className="bg-white border border-neutral-200 p-6 rounded-sm">
            <div className="w-10 h-10 rounded-full bg-red-50 text-[#E51E2B] font-mono font-bold flex items-center justify-center text-sm mb-4">
              02
            </div>
            <h3 className="text-base font-bold uppercase text-neutral-900 mb-2">240+ GSM Luxury Cotton</h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Silky smooth 100% combed ring-spun loopback cotton with dense fiber weave. Breathable, durable, and engineered for high-end streetwear drape.
            </p>
          </div>

          <div className="bg-white border border-neutral-200 p-6 rounded-sm">
            <div className="w-10 h-10 rounded-full bg-red-50 text-[#E51E2B] font-mono font-bold flex items-center justify-center text-sm mb-4">
              03
            </div>
            <h3 className="text-base font-bold uppercase text-neutral-900 mb-2">Wash-Proof & Crack-Free</h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Heat-cured with premium TPU powder adhesive. Zero peeling, zero cracking, and tested to withstand 50+ machine washes while retaining original luster.
            </p>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-neutral-900 text-white p-6 sm:p-10 rounded-sm mb-12">
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-6">How To Print Your Custom Piece</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 font-mono text-xs">
            <div className="border-l-2 border-[#E51E2B] pl-4">
              <span className="text-[#E51E2B] font-bold text-sm">STEP 1</span>
              <h4 className="font-bold text-neutral-100 uppercase mt-1 mb-1">Send Design</h4>
              <p className="text-neutral-400 text-[11px] leading-relaxed">Share your high-res PNG, vector, or artwork idea on WhatsApp.</p>
            </div>
            <div className="border-l-2 border-[#E51E2B] pl-4">
              <span className="text-[#E51E2B] font-bold text-sm">STEP 2</span>
              <h4 className="font-bold text-neutral-100 uppercase mt-1 mb-1">Pick Blank</h4>
              <p className="text-neutral-400 text-[11px] leading-relaxed">Choose colorway (Black, White, Maroon, Brown) and size (S to XXL).</p>
            </div>
            <div className="border-l-2 border-[#E51E2B] pl-4">
              <span className="text-[#E51E2B] font-bold text-sm">STEP 3</span>
              <h4 className="font-bold text-neutral-100 uppercase mt-1 mb-1">Digital Proof</h4>
              <p className="text-neutral-400 text-[11px] leading-relaxed">Receive a digital mockup preview from our Tirupati studio team.</p>
            </div>
            <div className="border-l-2 border-[#E51E2B] pl-4">
              <span className="text-[#E51E2B] font-bold text-sm">STEP 4</span>
              <h4 className="font-bold text-neutral-100 uppercase mt-1 mb-1">Dispatch</h4>
              <p className="text-neutral-400 text-[11px] leading-relaxed">Printed, quality-inspected, and shipped pan-India with express tracking.</p>
            </div>
          </div>
        </div>

        {/* Direct WhatsApp Callout */}
        <div className="text-center bg-white border border-neutral-200 p-8 rounded-sm">
          <h3 className="text-lg sm:text-xl font-bold uppercase text-neutral-900">Ready to print your vision?</h3>
          <p className="text-xs sm:text-sm text-neutral-600 mt-2 max-w-md mx-auto">
            Whether for personal statements, brand merchandise, or festival drops, the TH3EE Tirupati atelier handles it with precision.
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-5 bg-[#E51E2B] hover:bg-black text-white font-mono font-bold text-xs uppercase px-8 py-3 tracking-widest transition-colors shadow-xs"
          >
            Start Your Custom DTF Order
          </a>
        </div>

      </div>
    </div>
  );
};
