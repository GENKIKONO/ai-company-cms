// Design System Index - 統一エクスポート

// Core Components
export { default as UnifiedCTA, PrimaryCTA, SecondaryCTA } from './components/UnifiedCTA';
export { HIGButton } from './components/HIGButton';
export { HIGCard } from './components/HIGCard';

// Patterns
export { default as HeroSection } from './patterns/HeroSection';

// CSS Imports - 順序重要（トークン → パターン）
// Unified color tokens are now in styles/design-tokens.css via globals.css
import './tokens/typography.css';
import './tokens/utilities.css';
import './patterns/sections.css';