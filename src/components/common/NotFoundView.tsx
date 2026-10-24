import React from 'react';
import { motion } from 'motion/react';

interface NotFoundViewProps {
  navigate: (path: string) => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({ navigate }) => {
  return (
    <div className="w-full bg-[#FAFAFA] min-h-[75vh] py-10 sm:py-20 font-mono selection:bg-[#FF3131] selection:text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 sm:mb-8 text-[11px] sm:text-xs font-mono uppercase tracking-wider text-neutral-500 flex items-center space-x-2">
          <button 
            type="button" 
            onClick={() => navigate('/')} 
            className="hover:text-[#E51E2B] transition-colors cursor-pointer"
          >
            Home
          </button>
          <span>/</span>
          <span className="text-neutral-900 font-bold">404 Not Found</span>
        </nav>

        {/* Primary 404 Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white border-2 border-neutral-900 p-8 sm:p-14 shadow-2xl text-center space-y-6"
        >
          {/* Brand Red Pill Badge */}
          <div className="inline-block bg-[#E51E2B] text-white text-[10px] sm:text-xs font-mono font-bold px-3 py-1 uppercase tracking-widest">
            TH3EE Archive // Error 404
          </div>

          {/* Large Stylized 404 Visual */}
          <div className="space-y-1">
            <span className="text-6xl sm:text-8xl font-black tracking-tighter text-neutral-900 font-poppins block">
              404
            </span>
            <div className="h-1 w-16 mx-auto bg-[#E51E2B]" />
          </div>

          {/* Customer Friendly Headline & Copy */}
          <div className="space-y-3 max-w-md mx-auto">
            <h1 className="text-2xl sm:text-3xl font-black uppercase text-neutral-900 tracking-tight font-poppins">
              This page couldn&apos;t be found.
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 font-sans leading-relaxed">
              Explore the latest TH3EE drops. The silhouette or page you requested may have moved or been updated.
            </p>
          </div>

          {/* Primary Quick Actions */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <button
              type="button"
              onClick={() => navigate('/shop')}
              className="px-6 py-3.5 bg-neutral-900 hover:bg-[#E51E2B] text-white text-xs font-bold uppercase tracking-widest transition-colors shadow-md cursor-pointer flex-1"
            >
              Explore Drops
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-3.5 bg-white border border-neutral-300 hover:border-black text-neutral-900 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer flex-1 shadow-2xs"
            >
              Return Home
            </button>
          </div>

          {/* Direct Category Shortcuts */}
          <div className="pt-8 border-t border-neutral-100">
            <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">
              Popular Collections
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/shop/t-shirts')}
                className="px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer"
              >
                T-Shirts
              </button>
              <button
                type="button"
                onClick={() => navigate('/shop/hoodies-sweats')}
                className="px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer"
              >
                Hoodies &amp; Sweats
              </button>
              <button
                type="button"
                onClick={() => navigate('/shop/baahubali')}
                className="px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer"
              >
                Baahubali Universe
              </button>
              <button
                type="button"
                onClick={() => navigate('/bag')}
                className="px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer"
              >
                Shopping Bag
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFoundView;
