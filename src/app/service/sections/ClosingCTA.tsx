import Link from 'next/link';
import { serviceCopy } from '../copy';

export default function ClosingCTA() {
  return (
    <section className="py-16 md:py-20 bg-indigo-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
          {serviceCopy.closingCTA.title}
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={serviceCopy.closingCTA.primaryHref}
            className="bg-white text-indigo-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors"
          >
            {serviceCopy.closingCTA.primaryText}
          </Link>
          <Link
            href={serviceCopy.closingCTA.secondaryHref}
            className="border border-white text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            {serviceCopy.closingCTA.secondaryText}
          </Link>
        </div>
      </div>
    </section>
  );
}