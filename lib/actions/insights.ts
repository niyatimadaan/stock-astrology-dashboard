'use server'

import { unstable_cache } from 'next/cache'
import { cache } from 'react'
import { NASAClient } from '../api/nasa'
import { StockClient } from '../api/stock'
import { mergeDatasets } from '../utils/data-transform'
import { calculateCorrelation } from '../utils/correlation'
import { calculateAverage, categorizeIntensity } from '../utils/statistics'
import { logError, logInfo } from '../utils/error-handling'

/**
 * Options for getInsightsData server function
 */
export interface InsightsOptions {
  startDate?: string
  endDate?: string
  stockSymbol?: string
}

/**
 * Individual insight item
 */
export interface Insight {
  id: string
  type: 'correlation' | 'trend' | 'anomaly' | 'pattern'
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  confidence: number
  relatedDates?: string[]
}

/**
 * Insights data structure
 */
export interface InsightsData {
  insights: Insight[]
  summary: {
    totalInsights: number
    highSeverityCount: number
    avgConfidence: number
  }
  generatedAt: string
}

/**
 * Internal implementation of getInsightsData.
 * Generates AI-style insights from patterns in the data.
 * 
 * @param options - Optional parameters for date range and stock symbol
 * @returns Insights data with pattern-based observations
 * 
 * Requirements: 1.1, 1.2
 */
async function getInsightsDataInternal(
  options?: InsightsOptions
): Promise<InsightsData> {
  try {
    // Use sensible defaults
    const stockSymbol = options?.stockSymbol || 'AAPL'
    const endDate = options?.endDate || new Date().toISOString().split('T')[0]
    const startDate = options?.startDate || (() => {
      const date = new Date()
      date.setDate(date.getDate() - 30)
      return date.toISOString().split('T')[0]
    })()

    logInfo('Generating insights data', {
      function: 'getInsightsData',
      startDate,
      endDate,
      stockSymbol,
    })

    // Initialize API clients
    const nasaClient = new NASAClient()
    const stockClient = new StockClient()

    // Fetch data from both APIs in parallel
    const [nasaRawEvents, stockQuotes] = await Promise.all([
      nasaClient.getFlareEvents(startDate, endDate).catch(error => {
        logError(
          'NASA API call failed in getInsightsData',
          error,
          {
            function: 'getInsightsData',
            provider: 'NASA',
          }
        )
        return []
      }),
      stockClient.getStockData(stockSymbol, '1mo').catch(error => {
        logError(
          'Stock API call failed in getInsightsData',
          error,
          {
            function: 'getInsightsData',
            provider: stockClient['config'].provider,
            symbol: stockSymbol,
          }
        )
        return []
      }),
    ])

    // Transform data
    const flareData = nasaClient.transformFlareData(nasaRawEvents)
    const stockData = stockClient.calculateVolatility(stockQuotes)

    // Merge datasets
    const composedData = mergeDatasets(flareData, stockData)

    // Generate insights
    const insights: Insight[] = []
    let insightId = 1

    // Correlation insight
    const flareValues = composedData.map(d => d.flare)
    const volatilityValues = composedData.map(d => d.volatility)
    const correlation = calculateCorrelation(flareValues, volatilityValues)
    
    if (Math.abs(correlation) > 0.3) {
      insights.push({
        id: `insight-${insightId++}`,
        type: 'correlation',
        severity: Math.abs(correlation) > 0.6 ? 'high' : 'medium',
        title: correlation > 0 ? 'Positive Correlation Detected' : 'Negative Correlation Detected',
        description: `Solar flare activity shows a ${Math.abs(correlation) > 0.6 ? 'strong' : 'moderate'} ${correlation > 0 ? 'positive' : 'negative'} correlation (${correlation.toFixed(2)}) with market volatility for ${stockSymbol}. ${correlation > 0 ? 'Higher solar activity tends to coincide with increased market volatility.' : 'Higher solar activity tends to coincide with decreased market volatility.'}`,
        confidence: Math.min(0.95, Math.abs(correlation) + 0.2),
      })
    }

    // Trend insight
    const recentFlares = flareValues.slice(-7)
    const earlierFlares = flareValues.slice(0, 7)
    
    if (recentFlares.length > 0 && earlierFlares.length > 0) {
      const recentAvg = calculateAverage(recentFlares)
      const earlierAvg = calculateAverage(earlierFlares)
      const change = ((recentAvg - earlierAvg) / earlierAvg) * 100

      if (Math.abs(change) > 20) {
        insights.push({
          id: `insight-${insightId++}`,
          type: 'trend',
          severity: Math.abs(change) > 50 ? 'high' : 'medium',
          title: change > 0 ? 'Increasing Solar Activity Trend' : 'Decreasing Solar Activity Trend',
          description: `Solar flare intensity has ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}% over the recent period. This ${change > 0 ? 'upward' : 'downward'} trend may impact market conditions.`,
          confidence: 0.75,
        })
      }
    }

    // Anomaly detection - high flare days
    const avgFlare = calculateAverage(flareValues)
    const highFlareDays = composedData.filter(d => d.flare > avgFlare * 2)
    
    if (highFlareDays.length > 0) {
      insights.push({
        id: `insight-${insightId++}`,
        type: 'anomaly',
        severity: highFlareDays.length > 3 ? 'high' : 'medium',
        title: 'Unusual Solar Activity Detected',
        description: `${highFlareDays.length} day${highFlareDays.length > 1 ? 's' : ''} with exceptionally high solar flare activity (more than 2x average) detected. These anomalies may correlate with market disruptions.`,
        confidence: 0.8,
        relatedDates: highFlareDays.map(d => d.date),
      })
    }

    // Pattern insight - volatility clustering
    let consecutiveHighVol = 0
    let maxConsecutive = 0
    const avgVolatility = calculateAverage(volatilityValues)
    
    for (const item of composedData) {
      if (item.volatility > avgVolatility * 1.5) {
        consecutiveHighVol++
        maxConsecutive = Math.max(maxConsecutive, consecutiveHighVol)
      } else {
        consecutiveHighVol = 0
      }
    }

    if (maxConsecutive >= 3) {
      insights.push({
        id: `insight-${insightId++}`,
        type: 'pattern',
        severity: maxConsecutive >= 5 ? 'high' : 'medium',
        title: 'Volatility Clustering Pattern',
        description: `Market volatility shows clustering behavior with ${maxConsecutive} consecutive days of elevated volatility. This pattern suggests sustained market uncertainty for ${stockSymbol}.`,
        confidence: 0.7,
      })
    }

    // Intensity distribution insight
    const intensityCounts = {
      Low: 0,
      Medium: 0,
      High: 0,
      Extreme: 0,
    }

    for (const value of flareValues) {
      const category = categorizeIntensity(value)
      intensityCounts[category as keyof typeof intensityCounts]++
    }

    const extremeCount = intensityCounts.Extreme
    if (extremeCount > 0) {
      insights.push({
        id: `insight-${insightId++}`,
        type: 'anomaly',
        severity: extremeCount > 2 ? 'high' : 'medium',
        title: 'Extreme Solar Events Recorded',
        description: `${extremeCount} extreme solar flare event${extremeCount > 1 ? 's' : ''} recorded during this period. Extreme events (intensity > 6) are rare and may have significant impacts.`,
        confidence: 0.9,
      })
    }

    // Low activity insight
    if (flareValues.length > 0 && calculateAverage(flareValues) < 0.5) {
      insights.push({
        id: `insight-${insightId++}`,
        type: 'trend',
        severity: 'low',
        title: 'Low Solar Activity Period',
        description: `Solar activity remains relatively quiet with an average flare intensity of ${calculateAverage(flareValues).toFixed(2)}. Low solar activity periods typically correlate with stable market conditions.`,
        confidence: 0.65,
      })
    }

    // Calculate summary
    const highSeverityCount = insights.filter(i => i.severity === 'high').length
    const avgConfidence = insights.length > 0 
      ? calculateAverage(insights.map(i => i.confidence))
      : 0

    const insightsData: InsightsData = {
      insights,
      summary: {
        totalInsights: insights.length,
        highSeverityCount,
        avgConfidence,
      },
      generatedAt: new Date().toISOString(),
    }

    logInfo('Successfully generated insights data', {
      function: 'getInsightsData',
      totalInsights: insights.length,
      highSeverityCount,
    })

    return insightsData
  } catch (error) {
    logError(
      'Unexpected error in getInsightsData',
      error,
      {
        function: 'getInsightsData',
        options,
      }
    )

    // Return empty insights data
    return getEmptyInsightsData()
  }
}

/**
 * Get empty insights data structure
 */
function getEmptyInsightsData(): InsightsData {
  return {
    insights: [],
    summary: {
      totalInsights: 0,
      highSeverityCount: 0,
      avgConfidence: 0,
    },
    generatedAt: new Date().toISOString(),
  }
}

/**
 * Request-deduplicated version of getInsightsData.
 * Uses React cache() to ensure simultaneous requests share results.
 * 
 * Requirements: 6.4
 */
const getInsightsDataDeduplicated = cache(
  async (optionsKey: string): Promise<InsightsData> => {
    const options = optionsKey ? JSON.parse(optionsKey) : undefined
    return getInsightsDataInternal(options)
  }
)

/**
 * Get insights data with Next.js caching and request deduplication.
 * 
 * This function combines:
 * - React cache() for request deduplication (same render cycle)
 * - unstable_cache() for persistent caching with 1800s revalidation
 * 
 * @param options - Optional parameters for date range and stock symbol
 * @returns Insights data with pattern-based observations
 * 
 * Requirements: 1.1, 1.2
 */
export async function getInsightsData(
  options?: InsightsOptions
): Promise<InsightsData> {
  // Create a stable key for deduplication
  const optionsKey = options ? JSON.stringify(options) : ''
  
  // Use the deduplicated version
  return getInsightsDataDeduplicated(optionsKey)
}

/**
 * Cached version of getInsightsData with 1800s (30 minutes) revalidation.
 * 
 * Requirements: 6.1
 */
export const getCachedInsightsData = unstable_cache(
  async (options?: InsightsOptions) => {
    const optionsKey = options ? JSON.stringify(options) : ''
    return getInsightsDataDeduplicated(optionsKey)
  },
  ['insights-data'],
  {
    revalidate: 1800, // 30 minutes (1800 seconds)
    tags: ['insights', 'insights-data'],
  }
)
