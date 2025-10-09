import Image from 'next/image';
import Link from 'next/link';

interface HeroProps {
  title: string;
  lead: string;
  primaryCta: {
    href: string;
    label: string;
  };
  secondaryCta?: {
    href: string;
    label: string;
  };
  imageSrc: string;
  imageAlt: string;
}

export default function Hero({ 
  title, 
  lead, 
  primaryCta, 
  secondaryCta, 
  imageSrc, 
  imageAlt 
}: HeroProps) {
  return (
    <section className="py-24 md:py-32 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:grid grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight">
              {title}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8">
              {lead}
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link
                href={primaryCta.href}
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <span>{primaryCta.label}</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              
              {secondaryCta && (
                <Link
                  href={secondaryCta.href}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-indigo-600 text-indigo-600 rounded-xl font-semibold text-lg hover:bg-indigo-50 transition-all duration-300"
                >
                  {secondaryCta.label}
                </Link>
              )}
            </div>
          </div>
          
          {/* Right Column - Image */}
          <div className="mt-12 md:mt-0">
            <div className="relative bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-8 overflow-hidden">
              <Image
                src={imageSrc}
                alt={imageAlt}
                width={600}
                height={400}
                sizes="(min-width: 768px) 50vw, 100vw"
                className="w-full h-auto"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}