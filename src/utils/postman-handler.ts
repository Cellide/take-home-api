import { FastifyRequest, FastifyReply } from 'fastify';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export async function servePostmanCollection(
  scenarioFolder: string,
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const collectionPath = join(__dirname, '..', 'scenarios', scenarioFolder, 'postman_collection.json');
    const collection = JSON.parse(readFileSync(collectionPath, 'utf-8'));
    reply.header('Content-Type', 'application/json');
    reply.send(collection);
  } catch (error) {
    reply.status(404).send({
      status: 404,
      code: 'NOT_FOUND',
      message: 'Postman collection not found',
    });
  }
}
