# Server Functions (lib/actions)

This directory contains Next.js Server Functions that provide data fetching and processing capabilities for the solar flare and market volatility dashboard application. These functions replace traditional API routes with direct server-side function calls, offering better performance, type safety, and simpler data fetching patterns.

## Overview

All server functions in this directory:
- Use the `'use server'` directive for Next.js Server Actions
- Implement caching with Next.js `unstable_cache` and React `cache`
- Include comprehensive error handling with graceful fallbacks
- Support parallel API calls with independence (one failure doesn't block others)
- Return typed data structures for full TypeScript support

## Server Functions

### 1. Dashboard (`dashboard.ts`)

**Main Function:** `getDashboardData(options?: DashboardOptions): Promise<DashboardData>`

Fetches and processes data from both NASA DONKI API and Stock APIs to provide comprehensive dashboard data including composed time series, correlation analysis, distribution data, and statistical summaries.

**Options:**
```typescript
interface DashboardOptions {
  startDate?: string    // YYYY-MM-DD format, defaults to 30 days ago
  endDate?: string      // YYYY-MM-DD format, defaults to today
  stockSymbol?: string  // Stock symbol, defaults to 'AAPL'
}
```

**Returns:**
```typescript
interface DashboardData {
  composedData: ComposedData[]           // Time series with flare and volatility data
  correlationData: CorrelationData[]     // Scatter plot data for correlation analysis
  distributionData: DistributionData[]   // Flare intensity distribution by category
  heatmapData: Array<ComposedData & { intensity: number }>  // Combined intensity metrics
  stats: DashboardStats                  // Summary statistics
}
```

**Usage Example:**
```typescript
import { getDashboardData } from '@/lib/actions/dashboard'

// Basic usage with defaults
const data = await getDashboardData()

// With custom options
const customData = await getDashboardData({
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  stockSymbol: 'TSLA'
})
```

**Caching:** 30 minutes (1800 seconds) with tags `['dashboard', 'dashboard-data']`

### 2. Forecast (`forecast.ts`)

**Main Function:** `getForecastData(options?: ForecastOptions): Promise<ForecastData>`

Generates forecast predictions based on historical solar flare and market volatility data using trend analysis and basic time series forecasting.

**Options:**
```typescript
interface ForecastOptions {
  days?: number         // Number of days to forecast, defaults to 7
  stockSymbol?: string  // Stock symbol, defaults to 'AAPL'
}
```

**Returns:**
```typescript
interface ForecastData {
  forecastDays: number
  avgPredictedVolatility: number
  avgPredictedFlare: number
  confidence: number                    // 0-1 confidence score
  trend: 'rising' | 'declining' | 'stable'
  predictions: ForecastPrediction[]     // Daily predictions with confidence intervals
}
```

**Usage Example:**
```typescript
import { getForecastData } from '@/lib/actions/forecast'

// 7-day forecast for AAPL
const forecast = await getForecastData()

// 14-day forecast for TSLA
const customForecast = await getForecastData({
  days: 14,
  stockSymbol: 'TSLA'
})
```

**Caching:** 2 hours (7200 seconds) with tags `['forecast', 'forecast-data']`

### 3. Analysis (`analysis.ts`)

**Main Function:** `getAnalysisData(options?: AnalysisOptions): Promise<AnalysisData>`

Provides detailed analysis of solar flare and market data including statistical summaries, flare classification, volatility patterns, and correlation analysis.

**Options:**
```typescript
interface AnalysisOptions {
  startDate?: string    // YYYY-MM-DD format
  endDate?: string      // YYYY-MM-DD format  
  stockSymbol?: string  // Stock symbol
}
```

**Returns:**
```typescript
interface AnalysisData {
  summary: {
    totalFlareEvents: number
    totalTradingDays: number
    avgFlareIntensity: number
    avgVolatility: number
    maxFlareIntensity: number
    maxVolatility: number
    totalVolume: number
    correlationCoefficient: number
  }
  flareAnalysis: {
    byClass: Record<string, number>           // X, M, C class counts
    byIntensityRange: Record<string, number>  // Low, Medium, High, Extreme
    mostActiveDay: { date: string; intensity: number } | null
  }
  volatilityAnalysis: {
    highVolatilityDays: number
    lowVolatilityDays: number
    avgDailyChange: number
    mostVolatileDay: { date: string; volatility: number } | null
  }
  correlationAnalysis: {
    strength: 'strong' | 'moderate' | 'weak' | 'none'
    direction: 'positive' | 'negative' | 'none'
    coefficient: number
  }
  timeSeriesData: Array<{
    date: string
    flare: number
    volatility: number
    volume: number
  }>
}
```

**Usage Example:**
```typescript
import { getAnalysisData } from '@/lib/actions/analysis'

const analysis = await getAnalysisData({
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  stockSymbol: 'GOOGL'
})

console.log(`Correlation strength: ${analysis.correlationAnalysis.strength}`)
console.log(`Total flare events: ${analysis.summary.totalFlareEvents}`)
```

**Caching:** 30 minutes (1800 seconds) with tags `['analysis', 'analysis-data']`

### 4. Comparison (`comparison.ts`)

**Main Function:** `getComparisonData(options?: ComparisonOptions): Promise<ComparisonData>`

Compares multiple stock symbols to analyze how different assets respond to solar activity, with parallel fetching and order preservation.

**Options:**
```typescript
interface ComparisonOptions {
  symbols?: string[]    // Array of stock symbols, defaults to ['AAPL', 'MSFT', 'GOOGL']
  startDate?: string    // YYYY-MM-DD format
  endDate?: string      // YYYY-MM-DD format
}
```

**Returns:**
```typescript
interface ComparisonData {
  symbols: string[]
  comparisons: StockComparison[]  // Metrics for each symbol in same order
  summary: {
    mostVolatile: string
    leastVolatile: string
    highestPrice: string
    lowestPrice: string
  }
}

interface StockComparison {
  symbol: string
  avgVolatility: number
  maxVolatility: number
  avgClose: number
  maxClose: number
  totalVolume: number
  dataPoints: number
}
```

**Usage Example:**
```typescript
import { getComparisonData } from '@/lib/actions/comparison'

// Compare default symbols
const comparison = await getComparisonData()

// Compare custom symbols
const cryptoComparison = await getComparisonData({
  symbols: ['BTC', 'ETH', 'ADA', 'DOT']
})

// Find most volatile asset
console.log(`Most volatile: ${comparison.summary.mostVolatile}`)
```

**Caching:** 30 minutes (1800 seconds) with tags `['comparison', 'comparison-data']`

### 5. Insights (`insights.ts`)

**Main Function:** `getInsightsData(options?: InsightsOptions): Promise<InsightsData>`

Generates AI-style insights from patterns in the data, including correlation patterns, trend analysis, anomaly detection, and pattern recognition.

**Options:**
```typescript
interface InsightsOptions {
  startDate?: string    // YYYY-MM-DD format
  endDate?: string      // YYYY-MM-DD format
  stockSymbol?: string  // Stock symbol
}
```

**Returns:**
```typescript
interface InsightsData {
  insights: Insight[]
  summary: {
    totalInsights: number
    highSeverityCount: number
    avgConfidence: number
  }
  generatedAt: string
}

interface Insight {
  id: string
  type: 'correlation' | 'trend' | 'anomaly' | 'pattern'
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  confidence: number        // 0-1 confidence score
  relatedDates?: string[]   // Optional dates related to the insight
}
```

**Usage Example:**
```typescript
import { getInsightsData } from '@/lib/actions/insights'

const insights = await getInsightsData({
  stockSymbol: 'TSLA'
})

// Filter high-severity insights
const criticalInsights = insights.insights.filter(
  insight => insight.severity === 'high'
)

console.log(`Found ${criticalInsights.length} critical insights`)
```

**Caching:** 30 minutes (1800 seconds) with tags `['insights', 'insights-data']`

### 6. Simulator (`simulator.ts`)

**Main Function:** `getSimulatorData(options?: SimulatorOptions): Promise<SimulatorData>`

Implements scenario simulation for different solar activity scenarios including baseline, high solar, low solar, and extreme event scenarios.

**Options:**
```typescript
interface SimulatorOptions {
  scenario?: ScenarioType   // 'baseline' | 'high_solar' | 'low_solar' | 'extreme_event'
  stockSymbol?: string      // Stock symbol
  days?: number            // Number of days to simulate
}
```

**Returns:**
```typescript
interface SimulatorData {
  scenario: ScenarioType
  description: string
  simulatedData: SimulatedDataPoint[]
  summary: {
    avgFlare: number
    avgVolatility: number
    totalVolume: number
    riskLevel: 'low' | 'medium' | 'high' | 'extreme'
  }
  assumptions: string[]
}

interface SimulatedDataPoint {
  date: string
  flare: number
  volatility: number
  volume: number
  confidence: number
}
```

**Usage Example:**
```typescript
import { getSimulatorData } from '@/lib/actions/simulator'

// Baseline scenario
const baseline = await getSimulatorData({
  scenario: 'baseline',
  days: 14
})

// Extreme event scenario
const extremeEvent = await getSimulatorData({
  scenario: 'extreme_event',
  stockSymbol: 'BTC',
  days: 7
})

console.log(`Risk level: ${extremeEvent.summary.riskLevel}`)
```

**Caching:** 30 minutes (1800 seconds) with tags `['simulator', 'simulator-data']`

## Caching Behavior

All server functions implement a dual caching strategy:

### 1. Request Deduplication (React `cache`)
- Prevents duplicate API calls within the same render cycle
- Multiple simultaneous requests for identical data share results
- Automatically handled by React's cache mechanism

### 2. Persistent Caching (Next.js `unstable_cache`)
- Caches results across requests and deployments
- Each function has specific revalidation periods:
  - **Dashboard, Analysis, Comparison, Insights, Simulator:** 30 minutes (1800s)
  - **Forecast:** 2 hours (7200s)
- Uses cache tags for granular invalidation

### Cache Tags
Each function uses specific cache tags for targeted invalidation:
- `dashboard`: `['dashboard', 'dashboard-data']`
- `forecast`: `['forecast', 'forecast-data']`
- `analysis`: `['analysis', 'analysis-data']`
- `comparison`: `['comparison', 'comparison-data']`
- `insights`: `['insights', 'insights-data']`
- `simulator`: `['simulator', 'simulator-data']`

## Error Handling

All server functions implement comprehensive error handling:

### 1. API Error Handling
- Network timeouts and connection failures
- HTTP error status codes (4xx, 5xx)
- Rate limiting (429 status codes)
- Malformed JSON responses

### 2. Parallel API Independence
- NASA API failure doesn't block Stock API calls
- Stock API failure doesn't block NASA API calls
- Returns partial data when one source fails
- Logs errors with context for debugging

### 3. Graceful Fallbacks
- Returns empty data structures on complete failure
- Maintains type safety with proper TypeScript interfaces
- Provides meaningful error context in logs

## Usage in Components

Server functions are designed to be called directly from React components:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { getDashboardData } from '@/lib/actions/dashboard'
import type { DashboardData } from '@/lib/api/types'

export default function MyComponent() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getDashboardData()
        setData(result)
      } catch (error) {
        console.error('Error fetching data:', error)
        // Handle error appropriately
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <div>Loading...</div>
  if (!data) return <div>No data available</div>

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Correlation: {data.stats.correlation}</p>
      {/* Render your data */}
    </div>
  )
}
```

## Environment Variables

Server functions require the following environment variables:

```env
# NASA API Configuration
NASA_API_KEY=your_nasa_api_key_here

# Stock API Configuration  
STOCK_API_PROVIDER=yahoo
STOCK_API_KEY=optional_for_premium_providers

# Optional Configuration
ENABLE_SAMPLE_DATA=false
CACHE_REVALIDATION_INTERVAL=1800
```

## Performance Considerations

- **Parallel Processing:** All functions use `Promise.all()` for concurrent API calls
- **Request Deduplication:** Identical simultaneous requests share results
- **Efficient Caching:** Multi-layer caching reduces external API calls
- **Error Isolation:** Individual API failures don't cascade to other operations
- **Type Safety:** Full TypeScript support eliminates runtime type errors

## Development and Testing

For development and testing, server functions include:
- Comprehensive error logging with context
- Sample data fallbacks when APIs are unavailable
- Type-safe interfaces for all inputs and outputs
- Configurable timeout handling
- Support for different API providers and fallback mechanisms

## Migration from API Routes

These server functions replace the following API routes:
- `/api/dashboard-data` → `getDashboardData()`
- `/api/forecast-data` → `getForecastData()`
- `/api/analysis-data` → `getAnalysisData()`
- `/api/comparison-data` → `getComparisonData()`
- `/api/insights-data` → `getInsightsData()`
- `/api/simulator-data` → `getSimulatorData()`

Benefits of the migration:
- **Better Performance:** Direct function calls eliminate HTTP overhead
- **Type Safety:** Full TypeScript support from server to client
- **Simpler Architecture:** No need for separate API route files
- **Better Caching:** More granular control over caching strategies
- **Error Handling:** More sophisticated error handling and recovery