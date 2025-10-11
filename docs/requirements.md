# AIO Hub Requirements Specification

## Document Overview

This document provides a comprehensive specification of the AIO Hub AI企業CMS platform, covering UI/UX design standards, technical architecture, component specifications, and testing requirements based on the current implementation.

**Version**: 1.0  
**Last Updated**: October 2025  
**Status**: Production-Ready  

---

## Section 1: システム概要 (System Overview)

### 1.1 Purpose and Scope

AIO Hub is an AI-powered enterprise CMS platform designed to optimize company information for AI discoverability and search. The system provides:

- **AI-optimized content structuring** using JSON-LD format
- **Hearing service workflow** for professional content optimization
- **Multi-tenant organization management** with role-based access
- **Responsive design** optimized for Japanese typography
- **Enterprise-grade security** with RLS (Row Level Security)

### 1.2 System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   Next.js 15.5 │◄───┤   API Routes    │◄───┤   Supabase      │
│   TypeScript    │    │   Middleware    │    │   PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────┤   External      │──────────────┘
                        │   Services      │
                        │   • Stripe      │
                        │   • Vercel      │
                        │   • Sentry      │
                        └─────────────────┘
```

### 1.3 Core Technologies

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Frontend** | Next.js | 15.5.4 | React framework with App Router |
| **Styling** | Tailwind CSS | 3.4+ | Utility-first CSS framework |
| **Language** | TypeScript | 5.0+ | Type-safe development |
| **Testing** | Jest | 29.0+ | Unit and integration testing |
| **E2E Testing** | Playwright | Latest | End-to-end testing |
| **Database** | Supabase | Latest | PostgreSQL with real-time features |
| **Deployment** | Vercel | Latest | Serverless deployment platform |

---

## Section 2: デザインガイドライン (Design Guidelines)

### 2.1 Design System Foundation

AIO Hub implements a comprehensive design system based on **CSS Design Tokens** and **Visual Alignment Standards**.

#### 2.1.1 Design Tokens

| Token Category | Values | Usage |
|----------------|---------|--------|
| **Colors** | `--color-brand: #4F46E5`<br>`--color-accent: #06B6D4`<br>`--color-text: #0F172A` | Brand colors, text colors |
| **Typography** | `--font-size-h1: clamp(28px, 6vw, 38px)`<br>`--font-size-h2: clamp(22px, 4.5vw, 30px)` | Responsive typography |
| **Spacing** | `--space-xs: clamp(4px, 1vw, 8px)`<br>`--space-xl: clamp(32px, 6vw, 64px)` | Consistent spacing rhythm |
| **Layout** | `--measure-hero: 30ch`<br>`--measure-lead: 44ch`<br>`--measure-body: 38ch` | Optimal line lengths |

#### 2.1.2 Visual Alignment Standards

**Center Column + Left Text** principle implementation:

| Element | Positioning Standard | Tolerance | Implementation |
|---------|---------------------|-----------|----------------|
| **Hero Headlines** | Container centerline | ±8px | `.center-col + .text-left` |
| **Body Text** | Aligned with headlines | ±4px | `.measure-lead .copy` |
| **Pricing Cards (PC)** | Screen centerline | ±16px | `lg:grid-cols-2 justify-center` |
| **Mobile Cards** | 1.1-card display | ±4px | `min-w-[85vw]` |

### 2.2 Typography System

#### 2.2.1 Japanese Typography Optimization

```css
.jp-heading {
  text-wrap: balance;      /* Headlines balanced */
  text-align: left;        /* Consistent left alignment */
  word-break: keep-all;    /* Prevent word breaks */
  hanging-punctuation: allow-end;
}

.jp-body {
  text-wrap: pretty;       /* Natural paragraph wrapping */
  text-align: left;        /* Left-aligned for readability */
  overflow-wrap: anywhere; /* Handle long URLs/strings */
  line-height: 1.75;       /* Optimal reading line height */
}
```

#### 2.2.2 Responsive Design Patterns

| Pattern | CSS Implementation | Breakpoints |
|---------|-------------------|-------------|
| **Container** | `.center-col { max-width: 72rem; margin-inline: auto; }` | All sizes |
| **Section Padding** | `clamp(2.5rem, 4vw, 5rem)` | Standard sections |
| **Hero Padding** | `clamp(3rem, 6vw, 7rem)` | Hero sections |
| **Text Sizing** | `clamp(15px, 1.6vw + .6rem, 18px)` | Body text |

---

## Section 3: 機能一覧 (Feature Specifications)

### 3.1 Core Components

#### 3.1.1 HeroSection Component

**File**: `src/components/hearing-service/HeroSection.tsx`

**Features**:
- Gradient background with animated blur elements
- Badge with AI optimization messaging
- Split headline with gradient text effect
- Feature points with icons (Brain, Target, Sparkles)
- Dual CTA buttons (primary + secondary)
- Service feature cards in horizontal scroller

**Layout Structure**:
```jsx
<section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
  <div className="center-col text-left">
    <div className="measure-lead">
      {/* Content with optimized line lengths */}
    </div>
  </div>
</section>
```

#### 3.1.2 PricingSection Component

**File**: `src/components/hearing-service/PricingSection.tsx`

**Features**:
- Two-tier pricing (Single + Continuous plans)
- Popular plan highlighting with badges
- Feature comparison with checkmarks
- Mobile-optimized horizontal scrolling
- PC center-aligned grid layout
- Payment information section

**Key Implementation**:
- **Mobile**: `min-w-[85vw]` cards with horizontal scroll
- **Desktop**: `lg:grid-cols-2 justify-center` with `max-w-6xl`
- **Pricing Data**: Structured plan objects with features/limitations

#### 3.1.3 FlowSection Component

**File**: `src/components/hearing-service/FlowSection.tsx`

**Features**:
- 3-step process visualization
- Color-coded step indicators
- Before/After comparison section
- Detailed step breakdowns
- Responsive card layout

**Step Structure**:
1. **申し込み** (Application) - Blue theme
2. **ヒアリング** (60-minute hearing) - Purple theme  
3. **AI最適化・公開** (AI optimization & publishing) - Indigo theme

#### 3.1.4 HorizontalScroller Component

**File**: `src/components/ui/HorizontalScroller.tsx`

**Advanced Features**:
- **Swipe affordance**: Visual hints for scrollable content
- **Accessibility**: ARIA labels and keyboard navigation
- **Performance**: Intersection Observer for visibility
- **Customization**: Configurable dots, arrows, padding
- **Touch optimization**: Smooth scroll behavior
- **Grid fallback**: Desktop grid layout when appropriate

**Props Interface**:
```typescript
{
  className?: string;
  ariaLabel?: string;
  showDots?: boolean;
  showArrowsOnMobile?: boolean;
  showHintOnce?: boolean;
  scrollPaddingInlineStart?: string;
  scrollPaddingInlineEnd?: string;
}
```

### 3.2 Layout Components

#### 3.2.1 Header System

**Files**: 
- `src/components/header/I18nSafeAuthHeader.tsx`
- `src/components/header/MobileMenu.tsx`

**Features**:
- Multi-language support (EN/JP)
- Authentication state management
- Mobile hamburger menu
- User avatar with dropdown
- Safe fallback handling

#### 3.2.2 FAB (Floating Action Button)

**File**: `src/components/ui/FAB.tsx`

**Features**:
- iOS safe area support
- Menu expansion with backdrop
- Touch-optimized sizing
- Z-index management
- Accessibility compliance

#### 3.2.3 Footer System

**Features**:
- Responsive grid layout
- Legal links and policies
- Contact information
- Social media links
- Copyright and attribution

---

## Section 4: 技術仕様 (Technical Specifications)

### 4.1 Frontend Architecture

#### 4.1.1 Next.js Configuration

**File**: `next.config.js`

```javascript
{
  experimental: {
    optimizeCss: true,
    webpackBuildWorker: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-*']
  },
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
  }
}
```

#### 4.1.2 TypeScript Configuration

**Files**: `tsconfig.json`, `tsconfig.build.json`, `tsconfig.test.json`

**Key Settings**:
- Strict mode enabled
- Path mapping for clean imports
- Separate configs for build and test
- ESNext module resolution

#### 4.1.3 CSS Architecture

**File**: `src/app/globals.css`

**System Organization**:
1. **Tailwind Base**: `@tailwind base/components/utilities`
2. **Design Tokens**: CSS variables for consistency
3. **Typography System**: Japanese text optimization
4. **Layout Utilities**: Center column, measure classes
5. **Component Styles**: Reusable UI patterns
6. **Responsive Utilities**: Clamp-based scaling

### 4.2 State Management

#### 4.2.1 Authentication State

**File**: `src/lib/auth.ts`

- Supabase Auth integration
- Server-side session management
- Middleware protection
- Role-based access control

#### 4.2.2 UI State Management

- React Context for global UI state
- Custom hooks for component logic
- LocalStorage for user preferences
- URL state for navigation

### 4.3 Performance Optimization

#### 4.3.1 Image Optimization

**File**: `src/components/ui/OptimizedImage.tsx`

- Next.js Image component wrapper
- Lazy loading with Intersection Observer
- Responsive image sizing
- WebP/AVIF format support

#### 4.3.2 Code Splitting

- Route-based splitting via App Router
- Dynamic imports for heavy components
- Bundle analysis with webpack-bundle-analyzer
- Tree shaking optimization

#### 4.3.3 Caching Strategy

- Vercel Edge caching for static assets
- Supabase query caching
- Browser caching headers
- ISR (Incremental Static Regeneration)

---

## Section 5: テスト基準 (Testing Standards)

### 5.1 Test Architecture

#### 5.1.1 Unit Testing

**Framework**: Jest + React Testing Library

**Files**: 
- `jest.config.js` - Main test configuration
- `src/components/ui/__tests__/HorizontalScroller.test.tsx` - Component tests

**Coverage Requirements**:
- Components: 90% line coverage
- Utilities: 95% line coverage
- Critical paths: 100% coverage

**Test Categories**:
```javascript
describe('HorizontalScroller', () => {
  it('renders children correctly')
  it('handles touch interactions')
  it('provides keyboard navigation')
  it('maintains accessibility standards')
  it('performs smooth scrolling')
})
```

#### 5.1.2 Integration Testing

**Framework**: Jest with Supabase mock

**Focus Areas**:
- Database operations
- Authentication flows
- API route handlers
- Form submissions

#### 5.1.3 End-to-End Testing

**Framework**: Playwright

**Test Scenarios**:
- User registration and login
- Organization creation workflow
- Content publishing flow
- Payment integration
- Mobile responsive behavior

### 5.2 Visual Regression Testing

#### 5.2.1 Component Screenshots

**Implementation**: Playwright visual comparisons

**Coverage**:
- All major components
- Mobile and desktop viewports
- Light and dark themes
- Different content states

#### 5.2.2 Visual Alignment Verification

**Custom Tests**: 
- Center column alignment (±8px tolerance)
- Text baseline consistency
- Grid layout verification
- Responsive breakpoint testing

### 5.3 Performance Testing

#### 5.3.1 Core Web Vitals

**Targets**:
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

**Monitoring**: 
- Vercel Speed Insights
- Custom Web Vitals reporting
- Lighthouse CI integration

#### 5.3.2 Accessibility Testing

**Standards**: WCAG 2.1 AA compliance

**Tools**:
- axe-core automated testing
- Manual keyboard navigation testing
- Screen reader compatibility
- Color contrast verification

---

## Section 6: 今後の拡張指針 (Future Extension Guidelines)

### 6.1 Planned Integrations

#### 6.1.1 Stripe Payment System

**Implementation Strategy**:
- Subscription management
- Usage-based billing
- Multi-currency support
- Tax calculation integration

**Files to Implement**:
- `src/lib/stripe.ts` - Stripe client
- `src/app/api/stripe/` - Webhook handlers
- `src/components/billing/` - Payment UI

#### 6.1.2 Advanced CMS Features

**Content Management**:
- Rich text editor integration
- Media library system
- Version control for content
- Collaboration features

**AI Optimization**:
- Automated content analysis
- SEO recommendations
- JSON-LD generation
- Search optimization

### 6.2 Scalability Considerations

#### 6.2.1 Database Optimization

**Current**: Supabase PostgreSQL with RLS
**Future**: 
- Read replicas for performance
- Database sharding strategy
- Cache layer implementation
- Query optimization

#### 6.2.2 Frontend Scalability

**Architecture Evolution**:
- Micro-frontend consideration
- Component library extraction
- Design system standardization
- Build performance optimization

### 6.3 Internationalization Expansion

#### 6.3.1 Multi-Language Support

**Current**: Japanese + English
**Future Languages**: 
- Traditional Chinese
- Korean
- Thai
- Vietnamese

**Implementation**:
- i18n routing strategy
- Translation management
- RTL language support
- Cultural adaptation

#### 6.3.2 Regional Customization

**Features**:
- Currency localization
- Payment method adaptation
- Legal compliance per region
- Cultural UI adjustments

### 6.4 Advanced Features Roadmap

#### 6.4.1 AI-Powered Features

- **Content Generation**: AI-assisted writing
- **Optimization Suggestions**: Automated improvements
- **Analytics Integration**: AI-driven insights
- **Chatbot Integration**: Customer support automation

#### 6.4.2 Enterprise Features

- **Single Sign-On (SSO)**: Enterprise authentication
- **Advanced Analytics**: Business intelligence
- **API Extensions**: Third-party integrations
- **White-Label Solutions**: Custom branding

---

## Appendix

### A. Code Standards

#### A.1 TypeScript Guidelines

- Use strict mode
- Prefer interfaces over types for object shapes
- Implement proper error handling
- Document complex logic with JSDoc

#### A.2 CSS Guidelines

- Use Design Tokens for all values
- Follow BEM naming for component styles
- Implement mobile-first responsive design
- Maintain consistent spacing rhythm

#### A.3 Component Guidelines

- Implement proper prop validation
- Use forwardRef for DOM components
- Include accessibility attributes
- Document component APIs

### B. Deployment Checklist

#### B.1 Pre-Deployment

- [ ] All tests passing
- [ ] TypeScript compilation successful
- [ ] Lint checks passed
- [ ] Build optimization verified
- [ ] Environment variables configured

#### B.2 Post-Deployment

- [ ] Health checks passing
- [ ] Performance metrics within targets
- [ ] Error monitoring active
- [ ] Cache invalidation completed
- [ ] User acceptance testing completed

### C. Monitoring and Maintenance

#### C.1 Performance Monitoring

- Core Web Vitals tracking
- Error rate monitoring
- Database performance metrics
- API response time tracking

#### C.2 Security Monitoring

- Authentication failure tracking
- Rate limiting metrics
- Security header validation
- Vulnerability scanning

---

**Document Signature**

This requirements specification represents the current production state of AIO Hub as of October 2025. All specifications are based on implemented, tested, and deployed features.

**Generated with Claude Code** - Technical documentation automation
**Co-Authored-By**: Claude <noreply@anthropic.com>