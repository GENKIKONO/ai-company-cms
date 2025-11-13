/**
 * Geolocation and mapping related types
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeocodeResult extends Coordinates {
  normalized: string;
}

export interface MapProps {
  lat?: number;
  lng?: number;
  address?: string;
  zoom?: number;
  height?: string;
  className?: string;
  draggable?: boolean;
  onCoordinatesChange?: (coordinates: Coordinates) => void;
}

export interface AddressFormData {
  address: string;
  lat?: number;
  lng?: number;
}