import path from 'path';
import type { Database } from 'sql.js';
import { getDatabase, openDatabase } from '../../../core/db.js';

// Resolved relative to process.cwd(), not import.meta.url — same reasoning as store.ts's
// TRAVEL_DIR: esbuild bundles this module into dist/index.js, which would otherwise resolve to
// the bundle's own location instead of this file's real path.
const TRAVEL_DIR = path.resolve(process.cwd(), 'src/scenarios/travel');

let ratesPromise: Promise<Map<string, number>> | undefined;

async function ensureDatabase(): Promise<Database> {
  let db = getDatabase('travel');
  if (!db) {
    db = await openDatabase(TRAVEL_DIR, 'travel');
  }
  return db;
}

// currency_rates rows are `currency_code, rate_usd` — units of that currency per 1 USD.
async function loadRates(): Promise<Map<string, number>> {
  if (!ratesPromise) {
    ratesPromise = ensureDatabase().then((db) => {
      const stmt = db.prepare('SELECT currency_code, rate_usd FROM currency_rates');
      const rates = new Map<string, number>();
      while (stmt.step()) {
        const row = stmt.getAsObject();
        rates.set(row.currency_code as string, row.rate_usd as number);
      }
      stmt.free();
      return rates;
    });
  }
  return ratesPromise;
}

// Converts a USD amount into `currency` using the currency_rates table. Falls back to the USD
// amount unchanged if the currency has no known rate (shouldn't happen — every airport's
// localCurrency is sourced from the same CSV build as currency_rates).
export async function convertFromUsd(amountUsd: number, currency: string): Promise<number> {
  if (currency === 'USD') return amountUsd;

  const rate = (await loadRates()).get(currency);
  if (rate === undefined) return amountUsd;

  return Math.round(amountUsd * rate * 100) / 100;
}
