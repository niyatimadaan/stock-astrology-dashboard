# Design Document

## Overview

This design outlines the migration from Next.js API routes to server functions (Server Actions) for fetching and processing data from external APIs. The system will integrate NASA's DONKI API for solar flare data and stock price APIs (primarily Yahoo Finance with fallback options) to provide real-time correlation analysis between solar activity and market volatility.

The architecture leverages Next.js 16's server functions with built-in caching, type safety through TypeScript, and a clean separation between data fetching logic and presentation components. Server functions will be organized in a `lib/actions` directory, providing a centralized location for all server-side data operations.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Components                        │
│  (Dashboard, Charts, Statistics Display)                    │
└────────────────┬────────────────────────────────────────────┘
                 │ Direct Function Calls
                 │ (No HTTP Layer)
┌────────────────▼────────────────────────────────────────────┐
│                   Server Functions Layer                     │
│  - getDashboardData()                                       │
│  - getForecastData()                                        │
│  - getAnalysisData()                                        │
│  - getComparisonData()                                      │
└────────────┬───────────────────┬────────────────────────────┘
             │                   │
             │                   │
┌────────────▼─────────┐  ┌─────▼──────────────────────┐
│  NASA DONKI API      │  │  Stock Price APIs          │
│  (Solar Flares)      │  │  (Yahoo Finance/Fallback)  │
└──────────────────────┘  └────────────────────────────┘
```

### Directory Structure

```
lib/
├── actions/
│   ├── dashboard.ts       # Main dashboard data fetching
│   ├── forecast.ts        # Forecast data operations
│   ├── analysis.ts        # Analysis data operations
│   ├── comparison.ts      # Comparison data operations
│   ├── insights.ts        # Insights data operations
│   └── simulator.ts       # Simulator data operations
├── api/
│   ├── nasa.ts           # NASA API client
│   ├── stock.ts          # Stock API client
│   └── types.ts          # Shared API types
└── utils/
    ├── correlation.ts    # Statistical calculations
    ├── data-transform.ts # Data transformation utilities
    └── cache.ts          # Cache configuration helpers
```

## Components and Interfaces

### Core Data Types

```typescript
// lib/api/types.ts

export interface NASAFlareEvent {
  flrID: string
  beginTime: string
  peakTime: string
  endTime: string
  classType: string  // e.g., "M2.5", "X1.0"
  sourceLocation: string
  activeRegionNum: number
  linkedEvents: any[]
}

export interface FlareData {
  date: string
  flare: number
  class: string
  peakTime: string
  sourceRegion?: number
}

export interface StockQuote {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface StockData {
  date: string
  close: number
  volume: number
  volatility: number
  high?: number
  low?: number
  open?: number
}

export interface ComposedData {
  date: string
  flare: number
  volatility: number
  trades: number
}

export interface CorrelationData {
  flare: number
  volatility: number
}

export interface DistributionData {
  range: string
  count: number
}

export interface DashboardStats {
  avgFlare: number
  avgVolatility: number
  totalTrades: number
  correlation: number
  maxFlare: number
  maxVolatility: number
}

export interface DashboardData {
  composedData: ComposedData[]
  correlationData: CorrelationData[]
  distributionData: DistributionData[]
  heatmapData: Array<ComposedData & { intensity: number }>
  stats: DashboardStats
}
```

### NASA API Client

```typescript
// lib/api/nasa.ts

export interface NASAClientConfig {
  apiKey: string
  baseUrl: string
  timeout: number
}

export class NASAClient {
  private config: NASAClientConfig
  
  constructor(config?: Partial<NASAClientConfig>)
  
  async getFlareEvents(
    startDate: string,
    endDate: string
  ): Promise<NASAFlareEvent[]>
  
  transformFlareData(events: NASAFlareEvent[]): FlareData[]
}
```

### Stock API Client

```typescript
// lib/api/stock.ts

export interface StockClientConfig {
  provider: 'yahoo' | 'alphavantage' | 'finnhub'
  apiKey?: string
  timeout: number
}

export class StockClient {
  private config: StockClientConfig
  
  constructor(config?: Partial<StockClientConfig>)
  
  async getStockData(
    symbol: string,
    range: string
  ): Promise<StockQuote[]>
  
  calculateVolatility(quotes: StockQuote[]): StockData[]
}
```

### Server Functions

```typescript
// lib/actions/dashboard.ts

'use server'

export async function getDashboardData(
  options?: {
    startDate?: string
    endDate?: string
    stockSymbol?: string
  }
): Promise<DashboardData>

export async function refreshDashboardData(): Promise<void>
```

```typescript
// lib/actions/forecast.ts

'use server'

export interface ForecastData {
  forecastDays: number
  avgPredictedVolatility: number
  avgPredictedFlare: number
  confidence: number
  trend: 'rising' | 'declining' | 'stable'
  predictions: Array<{
    date: string
    predictedFlare: number
    predictedVolatility: number
    confidenceInterval: [number, number]
  }>
}

export async function getForecastData(
  days?: number
): Promise<ForecastData>
```

## Data Models

### Data Flow

1. **Client Component** calls server function
2. **Server Function** orchestrates:
   - Parallel API calls to NASA and Stock APIs
   - Data transformation and normalization
   - Statistical calculations (correlation, volatility)
   - Data merging and composition
3. **Caching Layer** stores results with revalidation
4. **Client Component** receives typed data and renders

### Data Transformation Pipeline

```
NASA Raw Data → Parse Flare Events → Extract Metrics → Normalize Dates
                                                              ↓
                                                        Merge by Date
                                                              ↑
Stock Raw Data → Calculate Volatility → Extract Metrics → Normalize Dates
```

### Caching Strategy

- **NASA Data**: Revalidate every 3600 seconds (1 hour)
- **Stock Data**: Revalidate every 1800 seconds (30 minutes)
- **Composed Data**: Revalidate every 1800 seconds (30 minutes)
- **Forecast Data**: Revalidate every 7200 seconds (2 hours)

Use Next.js `unstable_cache` or React `cache` with appropriate tags for granular invalidation.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Server function type safety
*For any* server function with explicit return type annotations, the returned data should match the declared TypeScript return type structure at runtime
**Validates: Requirements 1.2, 7.2**

### Property 2: NASA API request construction
*For any* valid date range where startDate <= endDate, the NASA API client should construct a properly formatted request URL with both dates in YYYY-MM-DD format
**Validates: Requirements 2.1**

### Property 3: NASA data transformation completeness
*For any* NASA API response containing flare events, the transformation should extract all required fields (flare class, peak time, intensity, source region) and produce a standardized FlareData structure
**Validates: Requirements 2.2, 2.3**

### Property 4: Stock data extraction and volatility calculation
*For any* stock API response containing OHLC price data, the system should extract all price fields and calculate a non-negative volatility metric
**Validates: Requirements 3.2, 3.3**

### Property 5: API error handling with empty returns
*For any* external API call that fails (network error, error status code, timeout), the system should catch the exception, log it with context, and return an empty data array without propagating the exception
**Validates: Requirements 2.4, 5.1, 5.2, 5.3**

### Property 6: Data merge with temporal alignment
*For any* two time-series datasets with date fields, merging should align data by matching dates, preserve chronological order, and not create duplicate date entries
**Validates: Requirements 4.1, 4.3**

### Property 7: Date normalization consistency
*For any* date string in various formats (ISO 8601, Unix timestamp, MM-DD-YYYY), the normalization function should produce a consistent YYYY-MM-DD output format
**Validates: Requirements 4.4**

### Property 8: Correlation coefficient mathematical bounds
*For any* two numeric arrays of equal length representing flare intensity and volatility, the calculated correlation coefficient should be between -1 and 1 inclusive
**Validates: Requirements 4.2, 9.4**

### Property 9: Incomplete data handling
*For any* dataset pair where one or both contain missing values (null, undefined, NaN), the correlation and merge operations should handle missing data without throwing exceptions
**Validates: Requirements 4.5**

### Property 10: Stock symbol validation
*For any* stock symbol input, the system should validate the symbol format and either accept valid symbols or return an appropriate error message for invalid ones
**Validates: Requirements 8.1, 8.4**

### Property 11: API fallback mechanism
*For any* primary stock API failure (Yahoo Finance unavailable), the system should attempt alternative APIs in sequence until one succeeds or all fail
**Validates: Requirements 3.4**

### Property 12: Cache hit behavior
*For any* server function with caching enabled, when cached data is available and within the revalidation period, the system should serve the cached response without making external API calls
**Validates: Requirements 6.1, 6.2**

### Property 13: Cache expiration and refresh
*For any* cached data that has exceeded its revalidation period, the next request should trigger a fresh fetch from external APIs and update the cache
**Validates: Requirements 6.3**

### Property 14: Request deduplication
*For any* multiple simultaneous requests for identical data, the system should make only one external API call and share the result among all requesters
**Validates: Requirements 6.4**

### Property 15: Statistical calculation accuracy
*For any* dataset containing numeric values, the calculated statistics (average flare, average volatility, max flare, max volatility, total volume) should match their mathematical definitions within floating-point precision tolerance
**Validates: Requirements 9.1, 9.2, 9.3**

### Property 16: Distribution categorization completeness
*For any* flare intensity value, the categorization function should assign it to exactly one distribution range (Low: 0-2, Medium: 2-4, High: 4-6, Extreme: 6+)
**Validates: Requirements 9.5**

### Property 17: Parallel symbol fetching order preservation
*For any* array of stock symbols requested in parallel, the returned data should maintain the same order as the input symbol array
**Validates: Requirements 8.5**

### Property 18: Optional parameter handling
*For any* server function with optional parameters (date ranges, stock symbols), calling without those parameters should use sensible defaults and not throw errors
**Validates: Requirements 8.2, 8.3**

### Property 19: Data validation for unexpected formats
*For any* API response with unexpected or malformed data structures, the transformation functions should validate the data shape and handle gracefully without crashing
**Validates: Requirements 7.4**

## Error Handling

### Error Categories

1. **Network Errors**: Timeout, connection refused, DNS failures
2. **API Errors**: 4xx/5xx status codes, rate limiting, invalid responses
3. **Data Validation Errors**: Unexpected data shapes, missing required fields
4. **Calculation Errors**: Division by zero, invalid mathematical operations

### Error Handling Strategy

```typescript
// Centralized error handling utility
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public provider?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

// Error handling in server functions
try {
  const data = await externalAPI.fetch()
  return transformData(data)
} catch (error) {
  console.error('[ServerFunction] Error:', {
    function: 'getDashboardData',
    error: error instanceof Error ? error.message : 'Unknown error',
    timestamp: new Date().toISOString()
  })
  
  // Return safe fallback
  return getEmptyDataStructure()
}
```

### Fallback Mechanisms

1. **Empty Data Arrays**: Return empty arrays with proper typing
2. **Sample Data**: Provide static sample data for development
3. **Cached Data**: Serve stale cache if fresh fetch fails
4. **Partial Data**: Return successfully fetched data even if one source fails

## Testing Strategy

### Unit Testing

We'll use **Vitest** as the testing framework for unit tests, leveraging its speed and compatibility with Next.js.

**Unit test coverage:**
- Data transformation functions (NASA event parsing, stock data processing)
- Statistical calculation functions (correlation, volatility, averages)
- Date normalization utilities
- Error handling edge cases (empty inputs, null values)
- Data validation functions

**Example unit tests:**
- Test that `transformFlareData` correctly extracts class type from "M2.5" format
- Test that `calculateVolatility` handles single data point gracefully
- Test that `normalizeDate` converts various formats to YYYY-MM-DD
- Test that `mergeDatasets` handles mismatched array lengths

### Property-Based Testing

We'll use **fast-check** as the property-based testing library for JavaScript/TypeScript.

**Configuration:**
- Minimum 100 iterations per property test
- Each property test must reference its design document property number
- Tag format: `**Feature: external-api-integration, Property {number}: {property_text}**`

**Property test coverage:**
- Property 5: Volatility calculation non-negativity
- Property 6: Data merge temporal alignment
- Property 7: Correlation coefficient bounds
- Property 11: Date normalization consistency
- Property 12: Statistics calculation accuracy
- Property 13: Distribution categorization completeness

**Example property tests:**
```typescript
// Property 5: Volatility calculation non-negativity
test('volatility is always non-negative', () => {
  fc.assert(
    fc.property(
      fc.array(fc.float({ min: 0.01, max: 10000 }), { minLength: 2 }),
      (prices) => {
        const volatility = calculateVolatility(prices)
        return volatility >= 0
      }
    ),
    { numRuns: 100 }
  )
})
```

### Integration Testing

- Test complete server function flows with mocked external APIs
- Test caching behavior with different revalidation periods
- Test parallel API call handling
- Test error recovery and fallback mechanisms

### API Mocking Strategy

Use **MSW (Mock Service Worker)** for intercepting and mocking external API calls during tests:
- Mock NASA DONKI API responses
- Mock Yahoo Finance API responses
- Simulate various error conditions (timeouts, 500 errors, rate limits)
- Test with realistic data shapes and edge cases

## Implementation Notes

### Environment Variables

```env
NASA_API_KEY=your_nasa_api_key_here
STOCK_API_PROVIDER=yahoo
STOCK_API_KEY=optional_for_premium_providers
ENABLE_SAMPLE_DATA=false
CACHE_REVALIDATION_INTERVAL=1800
```

### Alternative Stock APIs

If Yahoo Finance becomes unavailable:

1. **Alpha Vantage** (free tier: 25 requests/day)
   - Endpoint: `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={symbol}&apikey={key}`
   
2. **Finnhub** (free tier: 60 requests/minute)
   - Endpoint: `https://finnhub.io/api/v1/quote?symbol={symbol}&token={token}`

3. **Twelve Data** (free tier: 800 requests/day)
   - Endpoint: `https://api.twelvedata.com/time_series?symbol={symbol}&interval=1day&apikey={key}`

### Performance Considerations

- Use `Promise.all()` for parallel API calls
- Implement request deduplication for simultaneous identical requests
- Consider implementing a request queue for rate-limited APIs
- Use streaming responses for large datasets if needed
- Implement progressive data loading for better UX

### Security Considerations

- Never expose API keys in client-side code
- Validate all user inputs (stock symbols, date ranges)
- Implement rate limiting on server functions if exposed publicly
- Sanitize error messages before sending to client
- Use environment variables for all sensitive configuration
