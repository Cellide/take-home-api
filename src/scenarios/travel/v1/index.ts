import type { FastifyInstance } from 'fastify';
import type { Scenario } from '../../../types/index.js';
import type { citiesParameters, airportsParameters, searchFlightParameters } from '../../../types/openapi.js';
import { registerRoutes } from './routes.js';

export const travelV1: Scenario = {
  namespace: 'travel/v1',

  async register(app: FastifyInstance): Promise<void> {
    await registerRoutes(app);
  },

  openapi() {
    return {
      '/api/travel/v1/airports': airportsParameters,
      '/api/travel/v1/cities': citiesParameters,
      '/api/travel/v1/flights': searchFlightsParameters,
    };
  },
};
