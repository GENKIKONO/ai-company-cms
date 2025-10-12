/**
 * A/B Test hook - minimal implementation for build compatibility
 */

interface UseABTestReturn {
  variant: string;
  trackConversion: () => void;
}

export function useABTest(testName: string): UseABTestReturn {
  // Minimal safe implementation
  const variant = 'control'; // Default to control variant
  
  const trackConversion = (): void => {
    // Safe no-op implementation
    // In a real implementation, this would track conversion events
    if (typeof window !== 'undefined') {
      console.log(`A/B Test conversion tracked for ${testName}`);
    }
  };

  return { variant, trackConversion };
}