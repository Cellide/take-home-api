import type { Flight, Route } from './types.js';

// Version-agnostic formatted shape: raw Flight/Route with flightTimeHours/flightDistanceKms
// presented for API consumption (HH:MM string, rounded km). Still carries both `price` and
// `pricing` — version controllers trim whichever one their scenario hides.
export type FormattedFlight = Omit<Flight, 'flightTimeHours' | 'flightDistanceKms'> & {
  flightTimeHours: string;
  flightDistanceKms: number;
};
export type FormattedRoute = Omit<Route, 'flights' | 'flightTimeHours' | 'flightDistanceKms'> & {
  flightTimeHours: string;
  flightDistanceKms: number;
  flights: FormattedFlight[];
};

export function formatFlightTime(hours: number): string {
  const minutes = Math.ceil(hours * 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function formatFlight(flight: Flight): FormattedFlight {
  return {
    ...flight,
    flightTimeHours: formatFlightTime(flight.flightTimeHours),
    flightDistanceKms: Math.round(flight.flightDistanceKms),
  };
}

export function formatRoute(route: Route): FormattedRoute {
  return {
    ...route,
    flightTimeHours: formatFlightTime(route.flightTimeHours),
    flightDistanceKms: Math.round(route.flightDistanceKms),
    flights: route.flights.map(formatFlight),
  };
}
