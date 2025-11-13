/**
 * HIG-Compliant Icon System
 * SVG icons following Apple Human Interface Guidelines
 * 24px base size, 1.5-2px stroke width, monoline style
 */

import React from 'react';

import { logger } from '@/lib/log';
export interface IconProps {
  size?: number;
  className?: string;
  'aria-hidden'?: boolean;
  'aria-label'?: string;
}

const defaultProps: Partial<IconProps> = {
  size: 24,
  'aria-hidden': true,
};

// Utility function for consistent icon structure
const createIcon = (
  displayName: string,
  pathElements: React.ReactNode
) => {
  const Icon = React.forwardRef<SVGSVGElement, IconProps>(
    ({ size = 24, className, ...props }, ref) => (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
      >
        {pathElements}
      </svg>
    )
  );
  
  Icon.displayName = displayName;
  return Icon;
};

// Core Icons (replacing common emojis)
export const CheckIcon = createIcon(
  'CheckIcon',
  <path d="m9 12 2 2 4-4" />
);

export const CheckCircleIcon = createIcon(
  'CheckCircleIcon',
  <>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </>
);

export const XIcon = createIcon(
  'XIcon',
  <>
    <path d="m18 6-12 12" />
    <path d="m6 6 12 12" />
  </>
);

export const AlertTriangleIcon = createIcon(
  'AlertTriangleIcon',
  <>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="m12 17 .01 0" />
  </>
);

export const InfoIcon = createIcon(
  'InfoIcon',
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="m12 16-4-4 4-4" />
    <path d="M16 12H8" />
  </>
);

export const ArrowRightIcon = createIcon(
  'ArrowRightIcon',
  <>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </>
);

export const ArrowLeftIcon = createIcon(
  'ArrowLeftIcon',
  <>
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
  </>
);

export const ArrowUpIcon = createIcon(
  'ArrowUpIcon',
  <>
    <path d="M12 19V5" />
    <path d="m5 12 7-7 7 7" />
  </>
);

export const ArrowDownIcon = createIcon(
  'ArrowDownIcon',
  <>
    <path d="M12 5v14" />
    <path d="m19 12-7 7-7-7" />
  </>
);

export const ChevronRightIcon = createIcon(
  'ChevronRightIcon',
  <path d="m9 18 6-6-6-6" />
);

export const ChevronLeftIcon = createIcon(
  'ChevronLeftIcon',
  <path d="m15 18-6-6 6-6" />
);

export const ChevronUpIcon = createIcon(
  'ChevronUpIcon',
  <path d="m18 15-6-6-6 6" />
);

export const ChevronDownIcon = createIcon(
  'ChevronDownIcon',
  <path d="m6 9 6 6 6-6" />
);

export const PlusIcon = createIcon(
  'PlusIcon',
  <>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </>
);

export const MinusIcon = createIcon(
  'MinusIcon',
  <path d="M5 12h14" />
);

export const SearchIcon = createIcon(
  'SearchIcon',
  <>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </>
);

export const MenuIcon = createIcon(
  'MenuIcon',
  <>
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </>
);

export const UserIcon = createIcon(
  'UserIcon',
  <>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </>
);

export const SettingsIcon = createIcon(
  'SettingsIcon',
  <>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" />
    <circle cx="12" cy="12" r="3" />
  </>
);

export const HomeIcon = createIcon(
  'HomeIcon',
  <>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9,22 9,12 15,12 15,22" />
  </>
);

export const BuildingIcon = createIcon(
  'BuildingIcon',
  <>
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
    <path d="M6 12h4" />
    <path d="M6 16h4" />
    <path d="M16 12h2" />
    <path d="M16 16h2" />
  </>
);

export const DocumentIcon = createIcon(
  'DocumentIcon',
  <>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" x2="8" y1="13" y2="13" />
    <line x1="16" x2="8" y1="17" y2="17" />
    <polyline points="10,9 9,9 8,9" />
  </>
);

export const MailIcon = createIcon(
  'MailIcon',
  <>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-10 5L2 7" />
  </>
);

export const PhoneIcon = createIcon(
  'PhoneIcon',
  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
);

export const MapPinIcon = createIcon(
  'MapPinIcon',
  <>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </>
);

export const ExternalLinkIcon = createIcon(
  'ExternalLinkIcon',
  <>
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </>
);

export const EyeIcon = createIcon(
  'EyeIcon',
  <>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </>
);

export const EyeOffIcon = createIcon(
  'EyeOffIcon',
  <>
    <path d="m15 18-.722-3.25" />
    <path d="M2 2l20 20" />
    <path d="M6.71 6.71C4.04 8.3 2 12 2 12s3 7 10 7c1.53 0 2.97-.3 4.24-.85" />
    <path d="m12 5.18A7 7 0 0 1 22 12c0 .38-.04.75-.11 1.1" />
    <path d="m17 17-2.5-2.5" />
    <path d="m17 17-2.73-2.73" />
  </>
);

export const HeartIcon = createIcon(
  'HeartIcon',
  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
);

export const StarIcon = createIcon(
  'StarIcon',
  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
);

export const LoadingIcon = createIcon(
  'LoadingIcon',
  <>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    <animateTransform
      attributeName="transform"
      attributeType="XML"
      type="rotate"
      dur="1s"
      from="0 12 12"
      to="360 12 12"
      repeatCount="indefinite"
    />
  </>
);

// Business-specific icons
export const ServiceIcon = createIcon(
  'ServiceIcon',
  <>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M9 9h6v6H9z" />
    <path d="m9 9 3 3 3-3" />
  </>
);

export const CaseStudyIcon = createIcon(
  'CaseStudyIcon',
  <>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14,2 14,8 20,8" />
    <circle cx="10" cy="13" r="2" />
    <path d="m13 17 5 5" />
  </>
);

export const FAQIcon = createIcon(
  'FAQIcon',
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </>
);

export const NewsIcon = createIcon(
  'NewsIcon',
  <>
    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
    <path d="M18 14h-8" />
    <path d="M15 18h-5" />
    <path d="M10 6h8v4h-8V6z" />
  </>
);

export const PartnershipIcon = createIcon(
  'PartnershipIcon',
  <>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </>
);

// Icon component with size variants
export const Icon = React.forwardRef<SVGSVGElement, IconProps & { name: string }>(
  ({ name, ...props }, ref) => {
    // Icon mapping
    const icons: Record<string, React.ComponentType<any>> = {
      check: CheckIcon,
      'check-circle': CheckCircleIcon,
      x: XIcon,
      'alert-triangle': AlertTriangleIcon,
      info: InfoIcon,
      'arrow-right': ArrowRightIcon,
      'arrow-left': ArrowLeftIcon,
      'arrow-up': ArrowUpIcon,
      'arrow-down': ArrowDownIcon,
      'chevron-right': ChevronRightIcon,
      'chevron-left': ChevronLeftIcon,
      'chevron-up': ChevronUpIcon,
      'chevron-down': ChevronDownIcon,
      plus: PlusIcon,
      minus: MinusIcon,
      search: SearchIcon,
      menu: MenuIcon,
      user: UserIcon,
      settings: SettingsIcon,
      home: HomeIcon,
      building: BuildingIcon,
      document: DocumentIcon,
      mail: MailIcon,
      phone: PhoneIcon,
      'map-pin': MapPinIcon,
      'external-link': ExternalLinkIcon,
      eye: EyeIcon,
      'eye-off': EyeOffIcon,
      heart: HeartIcon,
      star: StarIcon,
      loading: LoadingIcon,
      service: ServiceIcon,
      'case-study': CaseStudyIcon,
      faq: FAQIcon,
      news: NewsIcon,
      partnership: PartnershipIcon,
    };
    
    const IconComponent = icons[name];
    
    if (!IconComponent) {
      logger.warn(`Icon "${name}" not found`);
      return null;
    }
    
    return <IconComponent {...props} />;
  }
);

Icon.displayName = 'Icon';