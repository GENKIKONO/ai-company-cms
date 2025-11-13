/**
 * Lightweight widow-fix library for preventing orphaned words
 * Optimized for Japanese text with mixed Japanese and English content
 */

interface WidowFixOptions {
  /** Number of words to keep together on the last line (default: 2) */
  minWordsLastLine?: number;
  /** Maximum character length for widow prevention (default: 30) */
  maxWidowLength?: number;
  /** Enable Japanese text optimization (default: true) */
  japaneseOptimization?: boolean;
}

/**
 * Prevents widow words by replacing the last space with a non-breaking space
 * @param text - The text to process
 * @param options - Configuration options
 * @returns Text with widow prevention applied
 */
export function preventWidow(text: string, options: WidowFixOptions = {}): string {
  const {
    minWordsLastLine = 2,
    maxWidowLength = 30,
    japaneseOptimization = true
  } = options;

  if (!text || text.length === 0) return text;
  
  // Trim whitespace
  const trimmed = text.trim();
  
  // For very short text, no widow fix needed
  if (trimmed.length <= maxWidowLength) return trimmed;
  
  // Split on whitespace while preserving Japanese characters
  const words = trimmed.split(/(\s+)/);
  
  // Need at least 3 elements (word, space, word) to apply widow fix
  if (words.length < 3) return trimmed;
  
  // Find the last space that separates actual words (not just whitespace)
  let lastSpaceIndex = -1;
  for (let i = words.length - 2; i >= 0; i--) {
    if (/\s/.test(words[i]) && words[i + 1] && words[i + 1].trim()) {
      lastSpaceIndex = i;
      break;
    }
  }
  
  // No space found, return original
  if (lastSpaceIndex === -1) return trimmed;
  
  // Check if we should apply widow fix
  const lastWord = words[lastSpaceIndex + 1];
  const secondLastWord = words[lastSpaceIndex - 1];
  
  if (!lastWord || !secondLastWord) return trimmed;
  
  // For Japanese optimization, be more conservative with short segments
  if (japaneseOptimization) {
    // Check if last word is too long for widow fix
    if (lastWord.length > 15) return trimmed;
    
    // Check if combined length of last two words is reasonable
    if ((lastWord + secondLastWord).length > maxWidowLength) return trimmed;
  }
  
  // Apply widow fix by replacing last space with non-breaking space
  const result = [...words];
  result[lastSpaceIndex] = result[lastSpaceIndex].replace(/\s+/, '\u00A0');
  
  return result.join('');
}

/**
 * Apply widow fix to all elements with the 'widow-fix' class
 * This function can be called on page load or after dynamic content updates
 */
export function applyWidowFixToElements(): void {
  if (typeof document === 'undefined') return; // SSR safety
  
  const elements = document.querySelectorAll('.widow-fix');
  
  elements.forEach((element) => {
    if (element.textContent) {
      const fixedText = preventWidow(element.textContent);
      
      // Only update if text actually changed
      if (fixedText !== element.textContent) {
        element.textContent = fixedText;
      }
    }
  });
}

/**
 * React hook for applying widow fix to dynamic content
 * Usage: const widowFixedText = useWidowFix(originalText);
 */
export function useWidowFix(text: string, options?: WidowFixOptions): string {
  // This is a simple function that can be used in React components
  // For more advanced usage, wrap in useMemo for performance
  return preventWidow(text, options);
}

/**
 * Auto-initialize widow fix when DOM is ready
 * Call this in your main app initialization
 */
export function initWidowFix(): void {
  if (typeof document === 'undefined') return;
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyWidowFixToElements);
  } else {
    applyWidowFixToElements();
  }
}