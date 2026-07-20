# Currency Rates

The `currency_rates.csv` file contains exchange rates for all currencies used across airports in the travel scenario. Each currency is mapped to its USD conversion rate (how many units of that currency equal 1 USD).

## Format

```
currency_code,rate_usd
USD,1.0
EUR,0.92
JPY,149.5
...
```

## Updating Rates

The `build-currency-rates.ts` script can be used to fetch and update exchange rates from live sources:

```bash
npm run db:build:currency-rates
```

### How It Works

The builder script:

1. **Attempts to fetch live rates** from free, public exchange rate APIs:
   - `exchangerate.host` - Free, open-source, no authentication required
   - `exchangerate-api.com` - Free tier with 1500 requests/month

2. **Falls back to hardcoded rates** if APIs are unavailable (offline mode, rate limits, etc.)

3. **Generates the CSV** with all 117 currencies used in the airports data

### Fallback Rates

The fallback rates are reasonable approximations based on typical market rates:
- Major currencies (USD, EUR, GBP, JPY, CHF, CAD, AUD): Live market rates
- Regional currencies: Typical market rates per region
- Rare/isolated currencies: Conservative estimates

### Usage in Code

To use currency rates in the API:

```typescript
// Load rates from CSV
const rates = parseCSV('currency_rates.csv');

// Get rate for a currency
const eurToUsd = rates['EUR']; // 0.92
const usdToEur = 1 / rates['EUR']; // 1.087

// Convert prices
const priceInUsd = 100;
const priceInEur = priceInUsd / rates['EUR']; // 91.3 EUR
```

## Notes

- Rates are stored with 1 USD as the base
- All rates are approximate and updated manually or via the build script
- For production use, consider integrating a real-time rate provider with proper caching
- The script has a 10-second timeout per API request to handle network issues gracefully
