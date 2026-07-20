import { airportSchema, airlineSchema, flightSchema, omitSchemaFields } from '../standard/openapi.js';

export const v1AirportSchema = omitSchemaFields(airportSchema, ['icao', 'utcOffset', 'lat', 'long']);
export const v1AirlineSchema = omitSchemaFields(airlineSchema, ['icao']);
export const v1FlightSchema = omitSchemaFields(flightSchema, ['pricing', 'seats']); // TODO: add the flat "price"
