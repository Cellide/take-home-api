import { FastifyInstance } from 'fastify';
import { ApiError } from '../../../types/index.js';
import { cacheKey, getCached, setCached } from '../../../core/cache.js';
import { generateFlights } from './generator.js';
import { TravelStore } from './store.js';
import { logFlow } from '../../../core/logger.js';
import type { Flight, Airport, City } from '../types/index.js';
import {
  baseSearchFlightsSchema,
  baseFlightDetailSchema,
  baseListAirportsSchema,
  baseListCitiesSchema,
} from '../types/openapi.js';

const CACHE_TTL = 3600;
const LARGE_CACHE_TTL = 3600 * 24;
const SCENARIO = 'travel';
const NAMESPACE = `${SCENARIO}:v1`;

const store = new TravelStore();

// v1 schemas are the shared base as-is today; spread/override here if this
// version ever needs route-specific validation or response tweaks.
const searchFlightsSchema = { ...baseSearchFlightsSchema };
const flightDetailSchema = { ...baseFlightDetailSchema };
const listAirportsSchema = { ...baseListAirportsSchema };
const listCitiesSchema = { ...baseListCitiesSchema };

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: { from: string; to: string; date: string } }>(
    '/api/travel/v1/search',
    {
      schema: searchFlightsSchema,
    },
    async (request) => {
      const { from, to, date } = request.query;

      logFlow({
        reqId: request.id,
        flow: 'flight-search',
        step: 'query',
        data: { from, to, date },
      });

      const cacheKeyVal = cacheKey(NAMESPACE, 'flights', from, to, date);
      let flightsData = getCached<Flight[]>(cacheKeyVal);

      if (!flightsData) {
        const generated = generateFlights(from, to, date, 5);
        setCached(cacheKeyVal, generated, CACHE_TTL);

        logFlow({
          reqId: request.id,
          flow: 'flight-search',
          step: 'generated',
          data: { count: generated.length },
        });
        flightsData = generated;
      } else {
        logFlow({
          reqId: request.id,
          flow: 'flight-search',
          step: 'cached',
        });
      }

      return {
        from,
        to,
        date,
        routes: flightsData,
      };
    },
  );

  app.get<{ Params: { id: string } }>(
    '/api/travel/v1/flights/:id',
    {
      schema: flightDetailSchema,
    },
    async (request) => {
      const { id } = request.params;

      logFlow({
        reqId: request.id,
        flow: 'flight-detail',
        step: 'lookup',
        data: { id },
      });

      const parts = id.split('-');
      if (parts.length < 4) {
        throw new ApiError(400, 'INVALID_FLIGHT_ID', 'Invalid flight ID format');
      }

      const from = parts[0].toUpperCase();
      const to = parts[1].toUpperCase();
      const date = parts.slice(2, -1).join('-');

      const cacheKeyVal = cacheKey(NAMESPACE, 'flights', from, to, date);
      let flightsData = getCached<Flight[]>(cacheKeyVal);

      if (!flightsData) {
        const generated = generateFlights(from, to, date, 5);
        setCached(cacheKeyVal, generated, CACHE_TTL);
        flightsData = generated;
      }

      const flight = store.getFlight(flightsData, id);

      if (!flight) {
        throw new ApiError(404, 'FLIGHT_NOT_FOUND', 'Flight not found');
      }

      logFlow({
        reqId: request.id,
        flow: 'flight-detail',
        step: 'lookup-found',
        data: { id, airline: flight.airline },
      });

      return flight;
    },
  );

  app.get(
    '/api/travel/v1/airports',
    {
      schema: listAirportsSchema,
    },
    async (request) => {
      logFlow({
        reqId: request.id,
        flow: 'list-airports',
        step: 'fetch',
      });

      const cacheKeyVal = cacheKey(NAMESPACE, 'airports');
      let airports = getCached<Airport[]>(cacheKeyVal);

      if (!airports) {
        airports = await store.getAirports();
        setCached(cacheKeyVal, airports, LARGE_CACHE_TTL);

        logFlow({
          reqId: request.id,
          flow: 'list-airports',
          step: 'generated',
          data: { count: airports.length },
        });
      } else {
        logFlow({
          reqId: request.id,
          flow: 'list-airports',
          step: 'cached',
        });
      }

      return { airports };
    },
  );

  app.get(
    '/api/travel/v1/cities',
    {
      schema: listCitiesSchema,
    },
    async (request) => {
      logFlow({
        reqId: request.id,
        flow: 'list-cities',
        step: 'fetch',
      });

      const cacheKeyVal = cacheKey(NAMESPACE, 'cities');
      let cities = getCached<City[]>(cacheKeyVal);

      if (!cities) {
        cities = await store.getCities();
        setCached(cacheKeyVal, cities, LARGE_CACHE_TTL);

        logFlow({
          reqId: request.id,
          flow: 'list-cities',
          step: 'generated',
          data: { count: cities.length },
        });
      } else {
        logFlow({
          reqId: request.id,
          flow: 'list-cities',
          step: 'cached',
        });
      }

      return { cities };
    },
  );
}
