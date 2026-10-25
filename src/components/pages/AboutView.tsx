import React from 'react';

interface AboutViewProps {
  navigate: (path: string) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ navigate }) => {
  return (
    <div className="w-full bg-[#FAFAFA] min-h-[80vh] py-8 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6 sm:mb-8 text-[11px] sm:text-xs font-mono uppercase tracking-wider text-neutral-500 flex items-center space-x-2">
          <button type="button" onClick={() => navigate('/')} className="hover:text-[#E51E2B] transition-colors">Home</button>
          <span>/</span>
          <span className="text-neutral-900 font-bold">About TH3EE</span>
        </nav>

        {/* Header Block */}
        <div className="bg-white border border-neutral-200 rounded-sm p-6 sm:p-12 shadow-xs mb-8 sm:mb-12">
          <div className="inline-block bg-[#E51E2B] text-white text-[10px] sm:text-xs font-mono font-bold px-2.5 py-1 uppercase tracking-widest mb-4">
            Our Atelier Story
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase text-neutral-900 tracking-tight leading-tight">
            About TH3EE <br />
            <span className="text-[#E51E2B]">Luxury Clothing from Tirupati</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-neutral-700 leading-relaxed font-sans font-medium">
            TH3EE is built on precision, restraint and craft. Discover the story behind Tirupati&apos;s luxury T-shirt label and the philosophy behind every piece.
          </p>
        </div>

        {/* Narrative Section */}
        <div className="space-y-8 text-neutral-700 text-sm sm:text-base leading-relaxed bg-white border border-neutral-200 p-6 sm:p-10 rounded-sm mb-12">
          <div>
            <h2 className="text-xl sm:text-2xl font-black uppercase text-neutral-900 tracking-tight mb-3">
              The Three Layers of Garment Excellence
            </h2>
            <p>
              The name <strong>TH3EE</strong> originates from the triad foundational to timeless apparel design: <strong>Fiber</strong>, <strong>Form</strong>, and <strong>Finishing</strong>. In a world saturated with ephemeral fast-fashion, we prioritize heavyweight structure, soft-touch handfeel, and deliberate silhouettes engineered to maintain their character over years of wear.
            </p>
          </div>

          <div className="border-t border-neutral-100 pt-6">
            <h2 className="text-xl sm:text-2xl font-black uppercase text-neutral-900 tracking-tight mb-3">
              Rooted in Tirupati, Crafted for the World
            </h2>
            <p>
              Operating from our dedicated custom studio in Tirupati, Andhra Pradesh, TH3EE combines cutting-edge Direct-to-Film (DTF) transfer technology with premium 240+ GSM ring-spun loopback cotton blanks. Every cut, stitch, and print is inspected hands-on before entering circulation.
            </p>
          </div>

          <div className="border-t border-neutral-100 pt-6">
            <h2 className="text-xl sm:text-2xl font-black uppercase text-neutral-900 tracking-tight mb-3">
              Restraint as a Signature
            </h2>
            <p>
              Whether executing an iconic cinematic homage or an understated minimalist blank, our design ethos stays anchored in restraint. We reject clutter in favor of immaculate proportions, reinforced drop-shoulder ribs, and deep, resonant colorways.
            </p>
          </div>

          <div className="pt-4 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => navigate('/shop')}
              className="bg-[#E51E2B] hover:bg-black text-white font-mono font-bold text-xs uppercase px-6 py-3 tracking-wider transition-colors shadow-xs"
            >
              Shop The Collection
            </button>
            <button
              type="button"
              onClick={() => navigate('/customise')}
              className="bg-black hover:bg-[#E51E2B] text-white font-mono font-bold text-xs uppercase px-6 py-3 tracking-wider transition-colors shadow-xs"
            >
              Customise
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
