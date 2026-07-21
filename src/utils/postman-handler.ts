import { FastifyRequest, FastifyReply } from 'fastify';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function servePostmanCollection(
  scenarioFolder: string,
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    // Resolved relative to process.cwd(), not import.meta.url: esbuild bundles this module
    // into dist/index.js, so import.meta.url would point at the bundle's location instead
    // of this file's real path — see src/scenarios/travel/standard/store.ts for the same fix.
    const collectionPath = join(process.cwd(), 'src', 'scenarios', scenarioFolder, 'postman_collection.json');
    const collection = JSON.parse(readFileSync(collectionPath, 'utf-8'));
    reply.header('Content-Type', 'application/json');
    reply.send(collection);
  } catch {
    reply.status(404).send({
      status: 404,
      code: 'NOT_FOUND',
      message: 'Postman collection not found',
    });
  }
}
