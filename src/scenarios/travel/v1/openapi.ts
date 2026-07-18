import { travelSchemas, travelEndpoints } from '../types/openapi.js'

export function getTravelV1OpenAPI(): Record<string, unknown> {
  return travelEndpoints;
}

export function getTravelV1Schemas(): Record<string, unknown> {
  return travelSchemas;
}
