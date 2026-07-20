import { airportSchema, airlineSchema, flightSchema, omitSchemaFields } from '../standard/openapi.js';

// v2 is the full-surface version: no field trims on airports/airlines.
export const v2AirportSchema = airportSchema;
export const v2AirlineSchema = airlineSchema;
// v2 hides the flat `price` simplification, keeping the per-class `pricing` breakdown.
export const v2FlightSchema = omitSchemaFields(flightSchema, ['price']);
