/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import HorizontalScroller from '../HorizontalScroller';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock scrollIntoView
const mockScrollIntoView = jest.fn();
HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock window.innerWidth
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

// Test children components
const TestCard = ({ children, ...props }: any) => (
  <div data-testid="test-card" {...props}>
    {children}
  </div>
);

describe('HorizontalScroller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    // Reset window.innerWidth to desktop by default
    Object.defineProperty(window, 'innerWidth', { value: 1024 });
  });

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(
        <HorizontalScroller>
          <TestCard>Card 1</TestCard>
          <TestCard>Card 2</TestCard>
        </HorizontalScroller>
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
      expect(screen.getByLabelText('横スクロールリスト')).toBeInTheDocument();
    });

    it('renders with custom aria-label', () => {
      render(
        <HorizontalScroller ariaLabel="カスタムラベル">
          <TestCard>Card 1</TestCard>
        </HorizontalScroller>
      );

      expect(screen.getByLabelText('カスタムラベル')).toBeInTheDocument();
    });

    it('applies correct CSS classes for snap scrolling', () => {
      render(
        <HorizontalScroller>
          <TestCard>Card 1</TestCard>
        </HorizontalScroller>
      );

      const container = screen.getByRole('region');
      expect(container).toHaveClass('scroll-smooth', 'snap-x', 'snap-mandatory');
    });
  });

  describe('Dots Navigation', () => {
    it('renders correct number of dots for children', async () => {
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 400 });
      
      render(
        <HorizontalScroller showDots={true}>
          <TestCard>Card 1</TestCard>
          <TestCard>Card 2</TestCard>
          <TestCard>Card 3</TestCard>
        </HorizontalScroller>
      );

      await waitFor(() => {
        const dots = screen.getAllByRole('tab');
        expect(dots).toHaveLength(3);
      });
    });

    it('sets first dot as selected initially', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 400 });
      
      render(
        <HorizontalScroller showDots={true}>
          <TestCard>Card 1</TestCard>
          <TestCard>Card 2</TestCard>
        </HorizontalScroller>
      );

      await waitFor(() => {
        const firstDot = screen.getByLabelText('1ページ目');
        expect(firstDot).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('does not render dots when showDots is false', () => {
      Object.defineProperty(window, 'innerWidth', { value: 400 });
      
      render(
        <HorizontalScroller showDots={false}>
          <TestCard>Card 1</TestCard>
          <TestCard>Card 2</TestCard>
        </HorizontalScroller>
      );

      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    });

    it('does not render dots for single child', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 400 });
      
      render(
        <HorizontalScroller showDots={true}>
          <TestCard>Card 1</TestCard>
        </HorizontalScroller>
      );

      await waitFor(() => {
        expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
      });
    });

    it('calls scrollIntoView when dot is clicked', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 400 });
      
      render(
        <HorizontalScroller showDots={true}>
          <TestCard>Card 1</TestCard>
          <TestCard>Card 2</TestCard>
        </HorizontalScroller>
      );

      await waitFor(() => {
        const secondDot = screen.getByLabelText('2ページ目');
        fireEvent.click(secondDot);
      });

      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    });
  });

  describe('Arrow Navigation', () => {
    it('renders navigation arrows on mobile when enabled', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 400 });
      
      render(
        <HorizontalScroller showArrowsOnMobile={true}>
          <TestCard>Card 1</TestCard>
          <TestCard>Card 2</TestCard>
        </HorizontalScroller>
      );

      await waitFor(() => {
        expect(screen.getByLabelText('前のページ')).toBeInTheDocument();
        expect(screen.getByLabelText('次のページ')).toBeInTheDocument();
      });
    });

    it('wraps arrows in mobile-only container', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024 });
      
      render(
        <HorizontalScroller showArrowsOnMobile={true}>
          <TestCard>Card 1</TestCard>
          <TestCard>Card 2</TestCard>
        </HorizontalScroller>
      );

      await waitFor(() => {
        // Arrows are wrapped in sm:hidden container for mobile-only display
        const mobileContainer = document.querySelector('.sm\\:hidden');
        expect(mobileContainer).toBeInTheDocument();
        
        const prevArrow = mobileContainer?.querySelector('button[aria-label="前のページ"]');
        const nextArrow = mobileContainer?.querySelector('button[aria-label="次のページ"]');
        expect(prevArrow).toBeInTheDocument();
        expect(nextArrow).toBeInTheDocument();
      });
    });

    it('disables previous arrow at first position', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 400 });
      
      render(
        <HorizontalScroller showArrowsOnMobile={true}>
          <TestCard>Card 1</TestCard>
          <TestCard>Card 2</TestCard>
        </HorizontalScroller>
      );

      await waitFor(() => {
        const prevButton = screen.getByLabelText('前のページ');
        expect(prevButton).toBeDisabled();
      });
    });

    it('does not render arrows when showArrowsOnMobile is false', () => {
      Object.defineProperty(window, 'innerWidth', { value: 400 });
      
      render(
        <HorizontalScroller showArrowsOnMobile={false}>
          <TestCard>Card 1</TestCard>
          <TestCard>Card 2</TestCard>
        </HorizontalScroller>
      );

      expect(screen.queryByLabelText('前のページ')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('次のページ')).not.toBeInTheDocument();
    });

    it('calls navigation functions when arrows are clicked', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 400 });
      
      render(
        <HorizontalScroller showArrowsOnMobile={true}>
          <TestCard>Card 1</TestCard>
          <TestCard>Card 2</TestCard>
          <TestCard>Card 3</TestCard>
        </HorizontalScroller>
      );

      await waitFor(() => {
        const nextButton = screen.getByLabelText('次のページ');
        fireEvent.click(nextButton);
      });

      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    });
  });

  describe('Hint System', () => {
    it('shows hint on mobile when localStorage is empty', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 400 });
      mockLocalStorage.getItem.mockReturnValue(null);
      
      render(
        <HorizontalScroller showHintOnce={true}>
          <TestCard>Card 1</TestCard>
          <TestCard>Card 2</TestCard>
        </HorizontalScroller>
      );

      await waitFor(() => {
        expect(screen.getByText('横にスワイプして他の項目も見れます')).toBeInTheDocument();
      });
    });

    it('does not show hint when localStorage has seen flag', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 400 });
      mockLocalStorage.getItem.mockReturnValue('seen');
      
      render(
        <HorizontalScroller showHintOnce={true}>
          <TestCard>Card 1</TestCard>
          <TestCard>Card 2</TestCard>
        </HorizontalScroller>
      );

      await waitFor(() => {
        expect(screen.queryByText('横にスワイプして他の項目も見れます')).not.toBeInTheDocument();
      });
    });

    it('does not show hint on desktop regardless of localStorage', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024 });
      mockLocalStorage.getItem.mockReturnValue(null);
      
      render(
        <HorizontalScroller showHintOnce={true}>
          <TestCard>Card 1</TestCard>
          <TestCard>Card 2</TestCard>
        </HorizontalScroller>
      );

      await waitFor(() => {
        expect(screen.queryByText('横にスワイプして他の項目も見れます')).not.toBeInTheDocument();
      });
    });

    it('dismisses hint and sets localStorage when close button is clicked', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 400 });
      mockLocalStorage.getItem.mockReturnValue(null);
      
      render(
        <HorizontalScroller showHintOnce={true}>
          <TestCard>Card 1</TestCard>
          <TestCard>Card 2</TestCard>
        </HorizontalScroller>
      );

      await waitFor(() => {
        const closeButton = screen.getByLabelText('ヒントを閉じる');
        fireEvent.click(closeButton);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('hs-hint', 'seen');
      expect(screen.queryByText('横にスワイプして他の項目も見れます')).not.toBeInTheDocument();
    });

    it('does not show hint when showHintOnce is false', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 400 });
      mockLocalStorage.getItem.mockReturnValue(null);
      
      render(
        <HorizontalScroller showHintOnce={false}>
          <TestCard>Card 1</TestCard>
          <TestCard>Card 2</TestCard>
        </HorizontalScroller>
      );

      await waitFor(() => {
        expect(screen.queryByText('横にスワイプして他の項目も見れます')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for dots navigation', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 400 });
      
      render(
        <HorizontalScroller showDots={true}>
          <TestCard>Card 1</TestCard>
          <TestCard>Card 2</TestCard>
          <TestCard>Card 3</TestCard>
        </HorizontalScroller>
      );

      await waitFor(() => {
        expect(screen.getByLabelText('ページインジケーター')).toBeInTheDocument();
        expect(screen.getByLabelText('1ページ目')).toBeInTheDocument();
        expect(screen.getByLabelText('2ページ目')).toBeInTheDocument();
        expect(screen.getByLabelText('3ページ目')).toBeInTheDocument();
      });
    });

    it('sets proper role attributes', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 400 });
      
      render(
        <HorizontalScroller showDots={true}>
          <TestCard>Card 1</TestCard>
          <TestCard>Card 2</TestCard>
        </HorizontalScroller>
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByRole('tablist')).toBeInTheDocument();
        const tabs = screen.getAllByRole('tab');
        expect(tabs).toHaveLength(2);
      });
    });

    it('updates aria-selected when current index changes', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 400 });
      
      const { rerender } = render(
        <HorizontalScroller showDots={true}>
          <TestCard>Card 1</TestCard>
          <TestCard>Card 2</TestCard>
        </HorizontalScroller>
      );

      await waitFor(() => {
        const firstDot = screen.getByLabelText('1ページ目');
        const secondDot = screen.getByLabelText('2ページ目');
        
        expect(firstDot).toHaveAttribute('aria-selected', 'true');
        expect(secondDot).toHaveAttribute('aria-selected', 'false');
      });
    });
  });

  describe('Data Attributes', () => {
    it('adds data-index attributes to children', () => {
      render(
        <HorizontalScroller>
          <TestCard>Card 1</TestCard>
          <TestCard>Card 2</TestCard>
          <TestCard>Card 3</TestCard>
        </HorizontalScroller>
      );

      const container = screen.getByRole('region');
      const childElements = container.querySelectorAll('[data-index]');
      expect(childElements).toHaveLength(3);
      expect(childElements[0]).toHaveAttribute('data-index', '0');
      expect(childElements[1]).toHaveAttribute('data-index', '1');
      expect(childElements[2]).toHaveAttribute('data-index', '2');
    });
  });

  describe('CSS Grid/Flex Layout', () => {
    it('applies correct layout classes based on className prop', () => {
      const { rerender } = render(
        <HorizontalScroller className="lg:grid-cols-2">
          <TestCard>Card 1</TestCard>
          <TestCard>Card 2</TestCard>
        </HorizontalScroller>
      );

      const flexContainer = screen.getByRole('region').querySelector('.flex');
      expect(flexContainer).toHaveClass('sm:grid-cols-1', 'lg:grid-cols-2', 'justify-center');

      rerender(
        <HorizontalScroller className="md:grid-cols-4">
          <TestCard>Card 1</TestCard>
          <TestCard>Card 2</TestCard>
        </HorizontalScroller>
      );

      expect(flexContainer).toHaveClass('sm:grid-cols-2', 'md:grid-cols-4', 'justify-start');
    });

    it('applies default layout classes when no special className', () => {
      render(
        <HorizontalScroller>
          <TestCard>Card 1</TestCard>
          <TestCard>Card 2</TestCard>
        </HorizontalScroller>
      );

      const flexContainer = screen.getByRole('region').querySelector('.flex');
      expect(flexContainer).toHaveClass('sm:grid-cols-2', 'lg:grid-cols-3', 'justify-start');
    });
  });

  describe('Single Child Handling', () => {
    it('handles single child correctly', () => {
      render(
        <HorizontalScroller>
          <TestCard>Single Card</TestCard>
        </HorizontalScroller>
      );

      const container = screen.getByRole('region');
      const childElements = container.querySelectorAll('[data-index]');
      expect(childElements).toHaveLength(1);
      expect(childElements[0]).toHaveAttribute('data-index', '0');
    });
  });

  describe('IntersectionObserver Integration', () => {
    it('sets up IntersectionObserver when children are present', async () => {
      render(
        <HorizontalScroller>
          <TestCard>Card 1</TestCard>
          <TestCard>Card 2</TestCard>
        </HorizontalScroller>
      );

      await waitFor(() => {
        expect(mockIntersectionObserver).toHaveBeenCalledWith(
          expect.any(Function),
          expect.objectContaining({
            threshold: 0.5,
            rootMargin: '0px'
          })
        );
      });
    });
  });
});