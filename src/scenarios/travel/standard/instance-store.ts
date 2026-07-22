import { cacheKey, getCached, setCached } from '../../../core/cache.js';
import type { Flight, Route } from './types.js';

// Generated Flights/Routes are transient instances (per FLIGHT_GENERATOR_MD's "generated
// on-the-fly per request" philosophy), not persisted rows — but downstream stages (seat
// selection, pricing, booking) need to resolve one by its ID without re-deriving the whole
// search. This is a lookup store, not a perf cache, backed by the same always-on cache.
const NAMESPACE = 'travel:instances';
const INSTANCE_TTL_SECONDS = 300;

export function storeFlights(flights: Flight[]): void {
  for (const flight of flights) {
    setCached(cacheKey(NAMESPACE, 'flight', flight.id), flight, INSTANCE_TTL_SECONDS);
  }
}

export function storeRoutes(routes: Route[]): void {
  for (const route of routes) {
    setCached(cacheKey(NAMESPACE, 'route', route.id), route, INSTANCE_TTL_SECONDS);
    storeFlights(route.flights);
  }
}

export function getStoredFlight(id: string): Flight | undefined {
  return getCached<Flight>(cacheKey(NAMESPACE, 'flight', id));
}

export function getStoredRoute(id: string): Route | undefined {
  return getCached<Route>(cacheKey(NAMESPACE, 'route', id));
}
