# 321web Layout Refresh - Implementation Guide

## 🎯 Overview

The 321web Layout Refresh is a comprehensive design system implementation that optimizes AIO Hub for better readability, information density, and Japanese text handling. This document outlines the complete implementation.

## ✅ Implementation Status

**Completion Date:** 2025-10-11  
**Branch:** `feat/321web-layout-refresh`  
**Build Status:** ✅ All 49 pages compile successfully  
**Verification:** ✅ Complete

## 🏗️ Core Design System

### Container System
```css
.container-article {
  max-width: 1000px;          /* Optimal reading width */
  margin-inline: auto;
  padding-inline: clamp(16px, 4vw, 40px);
}

.container-hero {
  max-width: 1140px;          /* Hero section width */
  margin-inline: auto;
  padding-inline: clamp(16px, 4vw, 40px);
}
```

### Typography System
```css
.headline {
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.copy {
  font-weight: 400;
  line-height: 1.6;
}

.measure-lead {
  max-width: 44ch;            /* Lead text line length */
  line-height: 1.58;
  text-wrap: balance;
}

.measure-body {
  max-width: 38ch;            /* Body text line length */
  line-height: 1.65;
  text-wrap: pretty;
}

.measure-hero {
  max-width: 20ch;            /* Hero title line length */
  line-height: 1.1;
  text-wrap: balance;
}
```

### Japanese Text Optimization
```css
.jp-phrase {
  word-break: auto-phrase;    /* Smart Japanese line breaks */
}
```

### Spacing System
```css
.section-gap {
  margin-block: clamp(2rem, 5vw, 6rem);
}

.hero-gap {
  margin-block: clamp(3rem, 8vw, 10rem);
}

.p-gap {
  margin-block: clamp(0.75rem, 2vw, 1.5rem);
}
```

### Grid System
```css
.grid-12 {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: clamp(1.5rem, 3vw, 5rem);
}

.card {
  background: white;
  border-radius: 0.75rem;
  border: 1px solid rgb(229 231 235);
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  transition: all 0.2s ease;
}
```

## 📄 Updated Pages

### ✅ Home Page (`src/app/I18nHomePage.tsx`)
- **Container:** Updated to `container-hero`
- **Grid:** Replaced HorizontalScroller with responsive grid
- **Typography:** Applied headline/copy classes with jp-phrase

### ✅ AIO Page Components
- **HeroSection:** Container, typography, and grid updates
- **FlowSection:** Replaced HorizontalScroller, updated typography
- **FAQSection:** Container and typography optimization
- **CTASection:** Full 321web conversion

### ✅ Hearing Service Page Components  
- **HeroSection:** Complete 321web implementation
- **FlowSection:** Grid system and typography updates
- **PricingSection:** Responsive grid replacement

### ✅ Pricing Page
- **PricingTable:** Pattern established for 321web compliance

## 🔧 Migration Patterns

### Container Migration
```tsx
// Before
<div className="wide-container">
<div className="balanced-container">

// After  
<div className="container-article">  // For content pages
<div className="container-hero">     // For hero sections
```

### Grid Migration
```tsx
// Before
<HorizontalScroller className="lg:grid-cols-3">
  <div className="snap-start min-w-[280px]">

// After
<div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
  <div className="card group p-6 sm:p-7">
```

### Typography Migration
```tsx
// Before
<h2 className="ui-h2 jp-heading">
<p className="ui-lead jp-body">

// After
<h2 className="headline text-3xl sm:text-4xl md:text-5xl font-bold jp-phrase">
<p className="copy measure-lead jp-phrase">
```

### Spacing Migration
```tsx
// Before
<section className="py-24 md:py-32">
<div className="mb-16">

// After
<section className="section-gap">
<div className="section-gap">
```

## 🎨 Component Guidelines

### Cards
```tsx
<div className="card group p-6 sm:p-7">
  <h3 className="headline text-xl font-bold jp-phrase">{title}</h3>
  <p className="copy measure-body jp-phrase">{description}</p>
</div>
```

### Buttons
```tsx
<button className="cta-nowrap">
  <span className="jp-phrase">{buttonText}</span>
</button>
```

### Text Content
```tsx
<h1 className="headline measure-hero jp-phrase">{title}</h1>
<p className="copy measure-lead jp-phrase">{description}</p>
```

## ⚠️ Important Notes

### Japanese Text Handling
- Always use `jp-phrase` class for Japanese text
- Apply appropriate `measure-*` classes for optimal line lengths
- Use `text-wrap: balance` for headings, `text-wrap: pretty` for body text

### Responsive Grid System
- Follow 1→2→3 column progression
- Use consistent gap spacing: `gap-6 md:gap-8`
- Apply proper responsive breakpoints: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

### Container Usage
- Use `container-article` for content pages (1000px max-width)
- Use `container-hero` for hero sections (1140px max-width)
- Always include responsive padding with clamp()

## 🧪 Testing & Verification

### Build Status
- ✅ TypeScript compilation: Success
- ✅ All 49 pages: Generated successfully  
- ✅ No build errors
- ✅ Responsive design verified

### Browser Support
- ✅ CSS Grid: Full support
- ✅ Clamp() functions: Full support
- ✅ Text-wrap properties: Progressive enhancement

## 🚀 Next Steps

1. **Monitor Performance:** Track Core Web Vitals improvements
2. **User Testing:** Validate readability improvements
3. **Iterative Refinement:** Adjust based on user feedback
4. **Extension:** Apply patterns to additional pages as needed

## 📝 Maintenance

### Adding New Components
1. Use established 321web patterns
2. Apply appropriate container classes
3. Include Japanese text optimization
4. Follow responsive grid guidelines

### Updating Existing Components
1. Migrate containers first
2. Update typography classes
3. Replace layout systems
4. Test responsive behavior

---

*This implementation successfully modernizes the AIO Hub platform with a cohesive, scalable design system optimized for Japanese content and modern web standards.*