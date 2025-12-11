'use server'

import { unstable_cache } from 'next/cache'
import { cache } from 'react'
import { NASAClient } from '../api/nasa'
import { StockClient } from '../api/stock'
import { mergeDatasets } from '../utils/data-transform'
import { calculateCorrelation } from '../utils/correlation'
import {
  calculateAverage,
  calculateMax,
  calculateSum,
  categorizeIntensity,
} from '../utils/statistics'
import {
  DashboardData,
  ComposedData,
  CorrelationData,
  DistributionData,
  FlareData,
  StockData,
} from '../api/types'
import {
  logError,
  logInfo,
  getEmptyDashboardData,
} from '../utils/error-handling'

/**
 * Options for getDashboardData server function
 */
export interface DashboardOptions {
  startDate?: string
  endDate?: string
  stockSymbol?: string
}

/**
 * Internal implementation of getDashboardData.
 * This function fetches from NASA and Stock APIs in parallel,
 * merges the data, and calculates statistics.
 * 
 * This function implements parallel API call independence - if one API fails,
 * the other's data is still returned with partial results.
 * 
 * @param options - Optional parameters for date range and stock symbol
 * @returns Dashboard data with composed data, correlations, distributions, and stats
 * 
 * Requirements: 1.1, 1.2, 4.1, 5.3, 6.1, 8.2
 */
async function getDashboardDataInternal(
  options?: DashboardOptions
): Promise<DashboardData> {
  try {
    // Use sensible defaults for optional parameters
    const stockSymbol = options?.stockSymbol || 'AAPL'
    
    // Default to last 30 days if not specified
    const endDate = options?.endDate || new Date().toISOString().split('T')[0]
    const startDate = options?.startDate || (() => {
      const date = new Date()
      date.setDate(date.getDate() - 30)
      return date.toISOString().split('T')[0]
    })()

    logInfo('Fetching dashboard data', {
      function: 'getDashboardData',
      startDate,
      endDate,
      stockSymbol,
    })

    // Initialize API clients
    const nasaClient = new NASAClient()
    const stockClient = new StockClient()

    // Fetch data from both APIs in parallel
    // This ensures NASA API failure doesn't block stock API and vice versa
    const [nasaRawEvents, stockQuotes] = await Promise.all([
      nasaClient.getFlareEvents(startDate, endDate).catch(error => {
        logError(
          'NASA API call failed in getDashboardData',
          error,
          {
            function: 'getDashboardData',
            provider: 'NASA',
            startDate,
            endDate,
          }
        )
        // Return empty array to allow partial data
        return []
      }),
      stockClient.getStockData(stockSymbol, '1mo').catch(error => {
        logError(
          'Stock API call failed in getDashboardData',
          error,
          {
            function: 'getDashboardData',
            provider: stockClient['config'].provider,
            symbol: stockSymbol,
          }
        )
        // Return empty array to allow partial data
        return []
      }),
    ])

    // Transform NASA data
    let flareData: FlareData[] = []
    try {
      flareData = nasaClient.transformFlareData(nasaRawEvents)
      logInfo('Transformed NASA data', {
        function: 'getDashboardData',
        flareCount: flareData.length,
      })
    } catch (error) {
      logError(
        'Failed to transform NASA data',
        error,
        {
          function: 'getDashboardData',
          rawEventCount: nasaRawEvents.length,
        }
      )
    }

    // Transform stock data
    let stockData: StockData[] = []
    try {
      stockData = stockClient.calculateVolatility(stockQuotes)
      logInfo('Transformed stock data', {
        function: 'getDashboardData',
        stockDataCount: stockData.length,
      })
    } catch (error) {
      logError(
        'Failed to transform stock data',
        error,
        {
          function: 'getDashboardData',
          quoteCount: stockQuotes.length,
        }
      )
    }

    // Merge datasets by date
    let composedData: ComposedData[] = []
    try {
      composedData = mergeDatasets(flareData, stockData)
      logInfo('Merged datasets', {
        function: 'getDashboardData',
        composedDataCount: composedData.length,
      })
    } catch (error) {
      logError(
        'Failed to merge datasets',
        error,
        {
          function: 'getDashboardData',
          flareDataCount: flareData.length,
          stockDataCount: stockData.length,
        }
      )
    }

    // Generate correlation data
    const correlationData: CorrelationData[] = composedData.map(item => ({
      flare: item.flare,
      volatility: item.volatility,
    }))

    // Calculate statistics
    const flareValues = composedData.map(d => d.flare)
    const volatilityValues = composedData.map(d => d.volatility)
    const tradeValues = composedData.map(d => d.trades)

    const avgFlare = calculateAverage(flareValues)
    const avgVolatility = calculateAverage(volatilityValues)
    const totalTrades = calculateSum(tradeValues)
    const maxFlare = calculateMax(flareValues)
    const maxVolatility = calculateMax(volatilityValues)
    const correlation = calculateCorrelation(flareValues, volatilityValues)

    // Generate distribution data
    const distributionData = generateDistributionData(flareValues)

    // Generate heatmap data (composed data with intensity)
    const heatmapData = composedData.map(item => ({
      ...item,
      intensity: item.flare * item.volatility, // Combined intensity metric
    }))

    const dashboardData: DashboardData = {
      composedData,
      correlationData,
      distributionData,
      heatmapData,
      stats: {
        avgFlare,
        avgVolatility,
        totalTrades,
        correlation,
        maxFlare,
        maxVolatility,
      },
    }

    logInfo('Successfully generated dashboard data', {
      function: 'getDashboardData',
      composedDataCount: composedData.length,
      correlation,
    })

    return dashboardData
  } catch (error) {
    // Catch any unexpected errors
    logError(
      'Unexpected error in getDashboardData',
      error,
      {
        function: 'getDashboardData',
        options,
      }
    )

    // Return empty dashboard data structure
    return getEmptyDashboardData()
  }
}

/**
 * Generate distribution data by categorizing flare intensities
 * @param flareValues - Array of flare intensity values
 * @returns Array of distribution data with counts per category
 */
function generateDistributionData(flareValues: number[]): DistributionData[] {
  const categories = ['Low', 'Medium', 'High', 'Extreme']
  const counts: Record<string, number> = {
    Low: 0,
    Medium: 0,
    High: 0,
    Extreme: 0,
  }

  // Categorize each flare value
  for (const value of flareValues) {
    const category = categorizeIntensity(value)
    counts[category]++
  }

  // Convert to array format
  return categories.map(range => ({
    range,
    count: counts[range],
  }))
}

/**
 * Request-deduplicated version of getDashboardData.
 * Uses React cache() to ensure simultaneous requests share results.
 * 
 * This prevents multiple parallel calls with the same parameters from
 * making duplicate API requests during a single render cycle.
 * 
 * Requirements: 6.4
 */
const getDashboardDataDeduplicated = cache(
  async (optionsKey: string): Promise<DashboardData> => {
    const options = optionsKey ? JSON.parse(optionsKey) : undefined
    return getDashboardDataInternal(options)
  }
)

/**
 * Get dashboard data with Next.js caching and request deduplication.
 * 
 * This function combines:
 * - React cache() for request deduplication (same render cycle)
 * - unstable_cache() for persistent caching with 1800s revalidation
 * 
 * @param options - Optional parameters for date range and stock symbol
 * @returns Dashboard data with composed data, correlations, distributions, and stats
 * 
 * Requirements: 1.1, 1.2, 4.1, 5.3, 6.1, 6.4, 8.2
 */
export async function getDashboardData(
  options?: DashboardOptions
): Promise<DashboardData> {
  // Create a stable key for deduplication
  const optionsKey = options ? JSON.stringify(options) : ''
  
  // Use the deduplicated version
  return getDashboardDataDeduplicated(optionsKey)
}

/**
 * Cached version of getDashboardData with 1800s (30 minutes) revalidation.
 * 
 * This wraps the deduplicated function with Next.js unstable_cache for
 * persistent caching across requests and deployments.
 * 
 * Cache tags allow for granular invalidation:
 * - 'dashboard': Invalidate all dashboard data
 * - 'dashboard-data': Invalidate this specific cache entry
 * 
 * Requirements: 1.5, 6.1, 6.2, 6.3
 */
export const getCachedDashboardData = unstable_cache(
  async (options?: DashboardOptions) => {
    const optionsKey = options ? JSON.stringify(options) : ''
    return getDashboardDataDeduplicated(optionsKey)
  },
  ['dashboard-data'],
  {
    revalidate: 1800, // 30 minutes (1800 seconds)
    tags: ['dashboard', 'dashboard-data'],
  }
)

/**
 * Refresh dashboard data by invalidating the cache.
 * This can be called manually to force a fresh fetch.
 * 
 * Note: In production, you would use revalidateTag('dashboard') from next/cache
 * to invalidate the cache. This is a placeholder for manual cache invalidation.
 */
export async function refreshDashboardData(): Promise<void> {
  logInfo('Dashboard data refresh requested', {
    function: 'refreshDashboardData',
  })
  // In Next.js 14+, you would call:
  // revalidateTag('dashboard')
}
