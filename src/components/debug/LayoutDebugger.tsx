'use client';

import { useState, useEffect } from 'react';

interface LayoutMetrics {
  viewport: { width: number; height: number };
  breakpoint: string;
  textWrapSupport: boolean;
  containerQuerySupport: boolean;
  elementsWithOverflow: Element[];
  manualBreaks: Element[];
  typographyClasses: { element: Element; classes: string[] }[];
}

export default function LayoutDebugger() {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState<LayoutMetrics | null>(null);

  const detectBreakpoint = (width: number): string => {
    if (width < 475) return 'xs';
    if (width < 640) return 'sm';
    if (width < 768) return 'md';
    if (width < 1024) return 'lg';
    if (width < 1280) return 'xl';
    return '2xl';
  };

  const checkFeatureSupport = () => {
    const testElement = document.createElement('div');
    const textWrapSupport = CSS.supports('text-wrap', 'balance');
    const containerQuerySupport = CSS.supports('container-type', 'inline-size');
    return { textWrapSupport, containerQuerySupport };
  };

  const findOverflowElements = (): Element[] => {
    const elements = document.querySelectorAll('*');
    const overflowing: Element[] = [];
    
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const parent = el.parentElement;
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        if (rect.width > parentRect.width + 1) {
          overflowing.push(el);
        }
      }
    });
    
    return overflowing;
  };

  const findManualBreaks = (): Element[] => {
    return Array.from(document.querySelectorAll('br[class*="sm:hidden"], br[class*="md:hidden"], br[class*="lg:hidden"]'));
  };

  const findTypographyElements = (): { element: Element; classes: string[] }[] => {
    const jpClasses = ['jp-heading', 'jp-body', 'btn-nowrap', 'footer-link-nowrap', 'jp-avoid-break'];
    const elements: { element: Element; classes: string[] }[] = [];
    
    jpClasses.forEach(className => {
      const found = document.querySelectorAll(`.${className}`);
      found.forEach(el => {
        const classes = Array.from(el.classList).filter(c => jpClasses.includes(c));
        elements.push({ element: el, classes });
      });
    });
    
    return elements;
  };

  const measureLayout = () => {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    const breakpoint = detectBreakpoint(viewport.width);
    const { textWrapSupport, containerQuerySupport } = checkFeatureSupport();
    const elementsWithOverflow = findOverflowElements();
    const manualBreaks = findManualBreaks();
    const typographyClasses = findTypographyElements();

    setMetrics({
      viewport,
      breakpoint,
      textWrapSupport,
      containerQuerySupport,
      elementsWithOverflow,
      manualBreaks,
      typographyClasses
    });
  };

  useEffect(() => {
    if (isVisible) {
      measureLayout();
      const handleResize = () => measureLayout();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isVisible]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 debug-overlay bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-mono shadow-lg hover:bg-red-700 transition-colors"
      >
        DEBUG
      </button>
    );
  }

  return (
    <div className="fixed inset-0 debug-overlay bg-black/50 backdrop-blur-sm">
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-2xl p-6 max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Layout Debugger</h3>
          <button
            onClick={() => setIsVisible(false)}
            className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm"
          >
            ×
          </button>
        </div>
        
        {metrics && (
          <div className="space-y-6 font-mono text-sm">
            {/* Viewport Info */}
            <div>
              <h4 className="font-bold text-[var(--bg-primary)] mb-2">Viewport & Breakpoint</h4>
              <div className="bg-gray-50 p-3 rounded">
                <p>Size: {metrics.viewport.width} × {metrics.viewport.height}</p>
                <p>Breakpoint: <span className="font-bold text-[var(--bg-primary)]">{metrics.breakpoint}</span></p>
              </div>
            </div>

            {/* Feature Support */}
            <div>
              <h4 className="font-bold text-green-600 mb-2">Browser Support</h4>
              <div className="bg-gray-50 p-3 rounded">
                <p>text-wrap: <span className={metrics.textWrapSupport ? 'text-green-600' : 'text-red-600'}>
                  {metrics.textWrapSupport ? '✓' : '✗'}
                </span></p>
                <p>container-query: <span className={metrics.containerQuerySupport ? 'text-green-600' : 'text-red-600'}>
                  {metrics.containerQuerySupport ? '✓' : '✗'}
                </span></p>
              </div>
            </div>

            {/* Layout Issues */}
            <div>
              <h4 className="font-bold text-red-600 mb-2">Layout Issues</h4>
              <div className="bg-gray-50 p-3 rounded">
                <p>Overflow Elements: <span className="font-bold">{metrics.elementsWithOverflow.length}</span></p>
                <p>Manual Breaks: <span className="font-bold">{metrics.manualBreaks.length}</span></p>
                <p>JP Typography: <span className="font-bold">{metrics.typographyClasses.length}</span></p>
              </div>
            </div>

            {/* Manual Breaks Detail */}
            {metrics.manualBreaks.length > 0 && (
              <div>
                <h4 className="font-bold text-orange-600 mb-2">Manual Breaks Found</h4>
                <div className="bg-orange-50 p-3 rounded max-h-32 overflow-y-auto">
                  {metrics.manualBreaks.map((br, idx) => (
                    <p key={idx} className="text-xs">
                      br.{br.className} in {br.parentElement?.tagName.toLowerCase()}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Typography Classes */}
            {metrics.typographyClasses.length > 0 && (
              <div>
                <h4 className="font-bold text-purple-600 mb-2">Typography Classes</h4>
                <div className="bg-purple-50 p-3 rounded max-h-32 overflow-y-auto">
                  {metrics.typographyClasses.slice(0, 10).map((item, idx) => (
                    <p key={idx} className="text-xs">
                      {item.element.tagName.toLowerCase()}.{item.classes.join('.')}
                    </p>
                  ))}
                  {metrics.typographyClasses.length > 10 && (
                    <p className="text-xs text-gray-500">...and {metrics.typographyClasses.length - 10} more</p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t">
              <button
                onClick={measureLayout}
                className="bg-[var(--bg-primary)] text-white px-4 py-2 rounded mr-2 hover:bg-[var(--bg-primary-hover)]"
              >
                Remeasure
              </button>
              <button
                onClick={() => {
                  const data = JSON.stringify(metrics, null, 2);
                  navigator.clipboard.writeText(data);
                  alert('Metrics copied to clipboard');
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Copy Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}