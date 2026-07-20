import type { Airport, Airline } from '../standard/types.js';
import type { FormattedFlight, FormattedRoute } from '../standard/formatters.js';

// v2 response shapes: the full OpenAPI/schema surface, minus the flat `price` simplification
// that v1 exposes. Composed from the shared base types/formatters so a v2 field drop can never
// silently diverge from the canonical shape.
export type V2Airport = Omit<Airport, 'isStandard' | 'isRegional' | 'isHub' | 'isIsolated'>;
export type V2Airline = Airline;
// Drops the flat `price` simplification, keeping the per-class `pricing` breakdown.
export type V2Flight = Omit<FormattedFlight, 'price'>;
export type V2Route = Omit<FormattedRoute, 'flights' | 'price'> & {
  flights: V2Flight[];
};
