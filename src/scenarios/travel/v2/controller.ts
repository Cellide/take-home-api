import type { FastifyRequest } from 'fastify';
import {
  searchFlightsBase,
  getFlightDetailBase,
  listAirportsBase,
  listCitiesBase,
  type SearchFlightsQuery,
  type FlightIdParams,
  type SearchFlightsRequest,
  type FlightDetailRequest,
} from '../standard/controller.js';
import type { FormattedFlight, FormattedRoute } from '../standard/formatters.js';
import type { Airport, City } from '../standard/types.js';
import type { V2Airport, V2Flight, V2Route } from './types.js';

export type { SearchFlightsQuery, FlightIdParams, SearchFlightsRequest, FlightDetailRequest };

// v2 airports drop only the internal category flags; icao/utcOffset/lat/long stay (full spec).
function toV2Airport({
  isStandard: _isStandard,
  isRegional: _isRegional,
  isHub: _isHub,
  isIsolated: _isIsolated,
  ...airport
}: Airport): V2Airport {
  return airport;
}

// v2 flights/routes drop the flat `price` simplification and keep the per-class `pricing` breakdown.
function toV2Flight({ price: _price, ...flight }: FormattedFlight): V2Flight {
  return flight;
}

function toV2Route({ price: _price, flights, ...route }: FormattedRoute): V2Route {
  return { ...route, flights: flights.map(toV2Flight) };
}

export interface SearchFlightsResult extends SearchFlightsQuery {
  routes: V2Route[];
}

export async function searchFlights(request: SearchFlightsRequest): Promise<SearchFlightsResult> {
  const { from, to, date, routes } = await searchFlightsBase(request);
  return { from, to, date, routes: routes.map(toV2Route) };
}

export async function getFlightDetail(request: FlightDetailRequest): Promise<V2Flight> {
  const flight = await getFlightDetailBase(request);
  return toV2Flight(flight);
}

export async function listAirports(request: FastifyRequest): Promise<{ airports: V2Airport[] }> {
  const airports = await listAirportsBase(request);
  return { airports: airports.map(toV2Airport) };
}

export async function listCities(request: FastifyRequest): Promise<{ cities: City[] }> {
  const cities = await listCitiesBase(request);
  return { cities };
}
