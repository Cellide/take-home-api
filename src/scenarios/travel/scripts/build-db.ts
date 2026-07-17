import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { faker } from '@faker-js/faker';
import { openDatabase, saveDatabase, dropDatabase } from '../../../core/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TRAVEL_DIR = path.resolve(__dirname, '..');
const DB_NAME = 'travel';
const MAX_AIRLINES_PER_AIRPORT = 10;
const MIN_AIRLINES_PER_AIRPORT = 3;

interface AirportRow {
    rank: number;
    iata: string;
    icao: string;
    name: string;
    city: string;
    country: string;
    countryCode: string;
    passengersMonthly: number;
    lat: number;
    lng: number;
    utcOffset: number;
}

interface AirlineRow {
    iata: string;
    icao: string;
    airline: string;
    country: string;
    countryCode: string;
}

// Minimal RFC4180-ish CSV parser: handles quoted fields with embedded commas.
function parseCsv(filePath: string): string[][] {
    const content = fs.readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n').trim();
    const rows: string[][] = [];

    for (const line of content.split('\n')) {
        const fields: string[] = [];
        let field = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (inQuotes) {
                if (char === '"' && line[i + 1] === '"') {
                    field += '"';
                    i++;
                } else if (char === '"') {
                    inQuotes = false;
                } else {
                    field += char;
                }
            } else if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                fields.push(field);
                field = '';
            } else {
                field += char;
            }
        }
        fields.push(field);
        rows.push(fields);
    }

    return rows;
}

function parseAirports(filePath: string): AirportRow[] {
    const [, ...rows] = parseCsv(filePath);
    return rows.map((r) => ({
        rank: Number(r[0]),
        iata: r[1],
        icao: r[2],
        name: r[3],
        city: r[4],
        country: r[5],
        countryCode: r[6],
        passengersMonthly: Number(r[7]),
        lat: Number(r[8]),
        lng: Number(r[9]),
        utcOffset: Number(r[10]),
    }));
}

function parseAirlines(filePath: string): AirlineRow[] {
    const [, ...rows] = parseCsv(filePath);
    return rows.map((r) => ({
        iata: r[0],
        icao: r[1],
        airline: r[2],
        country: r[3],
        countryCode: r[4],
    }));
}

// Deterministic hash so re-running the build produces identical airline assignments.
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

async function buildDb(): Promise<void> {
    const airports = parseAirports(path.join(TRAVEL_DIR, 'airports.csv'));
    const fictionalAirlines = parseAirlines(path.join(TRAVEL_DIR, 'fictional_airlines.csv'));
    const realAirlines = parseAirlines(path.join(TRAVEL_DIR, 'real_airlines.csv'));

    await dropDatabase(DB_NAME);
    const dbPath = path.join(TRAVEL_DIR, `${DB_NAME}.sqlite`);
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
    }

    const db = await openDatabase(TRAVEL_DIR, DB_NAME);

    db.run(`
        CREATE TABLE airports (
            iata TEXT PRIMARY KEY,
            icao TEXT,
            name TEXT NOT NULL,
            city TEXT NOT NULL,
            country TEXT NOT NULL,
            country_code TEXT NOT NULL,
            passengers_monthly REAL NOT NULL,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            utc_offset REAL NOT NULL,
            rank INTEGER NOT NULL
        );

        CREATE TABLE airlines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            iata TEXT NOT NULL,
            icao TEXT,
            name TEXT NOT NULL,
            country TEXT NOT NULL,
            country_code TEXT NOT NULL,
            is_fictional INTEGER NOT NULL,
            UNIQUE (iata, is_fictional)
        );

        CREATE TABLE airport_airlines (
            airport_iata TEXT NOT NULL REFERENCES airports (iata),
            airline_id INTEGER NOT NULL REFERENCES airlines (id),
            PRIMARY KEY (airport_iata, airline_id)
        );

        CREATE INDEX idx_airport_airlines_airline ON airport_airlines (airline_id);
    `);

    const insertAirport = db.prepare(`
        INSERT INTO airports (iata, icao, name, city, country, country_code, passengers_monthly, lat, lng, utc_offset, rank)
        VALUES (:iata, :icao, :name, :city, :country, :country_code, :passengers_monthly, :lat, :lng, :utc_offset, :rank)
    `);
    for (const a of airports) {
        insertAirport.run({
            ':iata': a.iata,
            ':icao': a.icao,
            ':name': a.name,
            ':city': a.city,
            ':country': a.country,
            ':country_code': a.countryCode,
            ':passengers_monthly': a.passengersMonthly,
            ':lat': a.lat,
            ':lng': a.lng,
            ':utc_offset': a.utcOffset,
            ':rank': a.rank,
        });
    }
    insertAirport.free();

    const insertAirline = db.prepare(`
        INSERT INTO airlines (iata, icao, name, country, country_code, is_fictional)
        VALUES (:iata, :icao, :name, :country, :country_code, :is_fictional)
    `);
    const fictionalAirlineIds: number[] = [];
    for (const airline of fictionalAirlines) {
        insertAirline.run({
            ':iata': airline.iata,
            ':icao': airline.icao,
            ':name': airline.airline,
            ':country': airline.country,
            ':country_code': airline.countryCode,
            ':is_fictional': 1,
        });
        fictionalAirlineIds.push(db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0] as number);
    }
    for (const airline of realAirlines) {
        insertAirline.run({
            ':iata': airline.iata,
            ':icao': airline.icao,
            ':name': airline.airline,
            ':country': airline.country,
            ':country_code': airline.countryCode,
            ':is_fictional': 0,
        });
    }
    insertAirline.free();

    // Airline coverage: relationship data isn't sourced from anywhere real, so it's
    // assumed. Bigger airports (by passenger volume) get served by more airlines,
    // scaled between MIN and MAX, using the default (fictional) airline roster.
    const maxPassengers = Math.max(...airports.map((a) => a.passengersMonthly));

    const insertLink = db.prepare(`
        INSERT INTO airport_airlines (airport_iata, airline_id)
        VALUES (:airport_iata, :airline_id)
    `);
    for (const airport of airports) {
        faker.seed(hashString(airport.iata));

        const share = maxPassengers > 0 ? airport.passengersMonthly / maxPassengers : 0;
        const count = Math.min(
            MAX_AIRLINES_PER_AIRPORT,
            Math.max(MIN_AIRLINES_PER_AIRPORT, Math.round(MIN_AIRLINES_PER_AIRPORT + share * (MAX_AIRLINES_PER_AIRPORT - MIN_AIRLINES_PER_AIRPORT))),
        );

        const servingAirlineIds = faker.helpers.arrayElements(fictionalAirlineIds, count);
        for (const airlineId of servingAirlineIds) {
            insertLink.run({ ':airport_iata': airport.iata, ':airline_id': airlineId });
        }
    }
    insertLink.free();

    await saveDatabase(TRAVEL_DIR, DB_NAME);
    await dropDatabase(DB_NAME);

    console.log(`Built ${dbPath}`);
    console.log(`  airports: ${airports.length}`);
    console.log(`  airlines: ${fictionalAirlines.length} fictional + ${realAirlines.length} real`);
    console.log(`  airport_airlines: up to ${MAX_AIRLINES_PER_AIRPORT} fictional airlines per airport`);
}

buildDb().catch((err) => {
    console.error(err);
    process.exit(1);
});
