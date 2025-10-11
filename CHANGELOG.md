# Changelog

All notable changes to this project will be documented in this file.

## [0.1.1] - 2025-01-15

### Added
- Feature cards text optimization with `text-balance`, `jp-phrase`, and auto-phrase support
- Pricing PC balanced 2-column layout with fixed center gap
- Always-on carousel dots with persistent display across all slides  
- Mobile menu stability with route change detection

### Fixed
- Feature card line wrapping (eliminated orphan lines, optimized to 38ch)
- Pricing PC equal width cards (±4px tolerance) with center gap (64px ±8px)
- Carousel dots now visible on all slides with z-index 900
- Mobile menu freeze prevention with forced close() on route changes

### Changed
- Enhanced CSS utilities: `.measure-card`, `.jp-kinsoku`, `.price-nowrap`
- HorizontalScroller dot positioning moved to external shared layer
- MenuProvider route change detection with popstate + polling mechanism
- Progressive enhancement with `@supports (word-break: auto-phrase)`

### Technical
- Jest tests: 26/26 passing
- Build: 49 pages successfully generated
- E2E tests added for carousel, menu, and pricing layout verification
- Full Visual Alignment Standards compliance (±4px/±16px tolerances)

## [0.1.0] - 2024-12-XX

### Added
- Initial AIO Hub implementation
- Core CMS functionality
- Basic UI components