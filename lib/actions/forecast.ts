'use server'

import { unstable_cache } from 'next/cache'
import { cache } from 'react'
import { NASAClient } from '../api/nasa'
import { StockClient } from '../api/stock'
import { ForecastData, ForecastPrediction } from '../api/types'
import { calculateAverage } from '../utils/statistics'
import { logError, logInfo } from '../utils/error-handling'

/**
 * Options for getForecastData server function
 */
export interface ForecastOptions {
  days?: number
  stockSymbol?: string
}

/**
 * Internal implementation of getForecastData.
 * Implements basic trend analysis and forecasting based on historical data.
 * 
 * @param options - Optional parameters for forecast days and stock symbol
 * @returns Forecast data with predictions and trend analysis
 * 
 * Requirements: 1.1, 1.2, 6.1
 */
async function getForecastDataInternal(
  options?: ForecastOptions
): Promise<ForecastData> {
  try {
    // Use sensible defaults
    const forecastDays = options?.days || 7
    const stockSymbol = options?.stockSymbol || 'AAPL'

    logInfo('Generating forecast data', {
      function: 'getForecastData',
      forecastDays,
      stockSymbol,
    })

    // Fetch historical data for trend analysis (last 30 days)
    const endDate = new Date().toISOString().split('T')[0]
    const startDate = (() => {
      const date = new Date()
      date.setDate(date.getDate() - 30)
      return date.toISOString().split('T')[0]
    })()

    // Initialize API clients
    const nasaClient = new NASAClient()
    const stockClient = new StockClient()

    // Fetch historical data in parallel
    const [nasaRawEvents, stockQuotes] = await Promise.all([
      nasaClient.getFlareEvents(startDate, endDate).catch(error => {
        logError(
          'NASA API call failed in getForecastData',
          error,
          {
            function: 'getForecastData',
            provider: 'NASA',
          }
        )
        return []
      }),
      stockClient.getStockData(stockSymbol, '1mo').catch(error => {
        logError(
          'Stock API call failed in getForecastData',
          error,
          {
            function: 'getForecastData',
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

    // Calculate historical averages for trend analysis
    const historicalFlares = flareData.map(d => d.flare)
    const historicalVolatility = stockData.map(d => d.volatility)

    const avgHistoricalFlare = calculateAverage(historicalFlares)
    const avgHistoricalVolatility = calculateAverage(historicalVolatility)

    // Analyze trend (simple linear regression on recent data)
    const trend = analyzeTrend(historicalFlares, historicalVolatility)

    // Generate predictions
    const predictions: ForecastPrediction[] = []
    const today = new Date()

    for (let i = 1; i <= forecastDays; i++) {
      const forecastDate = new Date(today)
      forecastDate.setDate(forecastDate.getDate() + i)
      const dateStr = forecastDate.toISOString().split('T')[0]

      // Simple trend-based prediction
      const trendFactor = trend === 'rising' ? 1.05 : trend === 'declining' ? 0.95 : 1.0
      const dayFactor = Math.pow(trendFactor, i)

      const predictedFlare = avgHistoricalFlare * dayFactor
      const predictedVolatility = avgHistoricalVolatility * dayFactor

      // Calculate confidence interval (decreases with forecast distance)
      const confidenceWidth = 0.2 * i // Wider interval for further predictions
      const lowerBound = Math.max(0, predictedVolatility * (1 - confidenceWidth))
      const upperBound = predictedVolatility * (1 + confidenceWidth)

      predictions.push({
        date: dateStr,
        predictedFlare,
        predictedVolatility,
        confidenceInterval: [lowerBound, upperBound],
      })
    }

    // Calculate average predicted values
    const avgPredictedFlare = calculateAverage(predictions.map(p => p.predictedFlare))
    const avgPredictedVolatility = calculateAverage(predictions.map(p => p.predictedVolatility))

    // Calculate confidence score (decreases with forecast length)
    const confidence = Math.max(0.5, 1 - (forecastDays * 0.05))

    const forecastData: ForecastData = {
      forecastDays,
      avgPredictedVolatility,
      avgPredictedFlare,
      confidence,
      trend,
      predictions,
    }

    logInfo('Successfully generated forecast data', {
      function: 'getForecastData',
      forecastDays,
      trend,
      confidence,
    })

    return forecastData
  } catch (error) {
    logError(
      'Unexpected error in getForecastData',
      error,
      {
        function: 'getForecastData',
        options,
      }
    )

    // Return empty forecast data
    return getEmptyForecastData(options?.days || 7)
  }
}

/**
 * Analyze trend from historical data
 * @param flares - Historical flare values
 * @param volatility - Historical volatility values
 * @returns Trend direction
 */
function analyzeTrend(
  flares: number[],
  volatility: number[]
): 'rising' | 'declining' | 'stable' {
  if (flares.length < 2 || volatility.length < 2) {
    return 'stable'
  }

  // Take the most recent 10 data points for trend analysis
  const recentFlares = flares.slice(-10)
  const recentVolatility = volatility.slice(-10)

  // Calculate simple moving average for first half vs second half
  const midpoint = Math.floor(recentFlares.length / 2)
  
  const firstHalfFlare = calculateAverage(recentFlares.slice(0, midpoint))
  const secondHalfFlare = calculateAverage(recentFlares.slice(midpoint))
  
  const firstHalfVolatility = calculateAverage(recentVolatility.slice(0, midpoint))
  const secondHalfVolatility = calculateAverage(recentVolatility.slice(midpoint))

  // Determine trend based on both metrics
  const flareTrend = secondHalfFlare > firstHalfFlare * 1.1 ? 1 : 
                     secondHalfFlare < firstHalfFlare * 0.9 ? -1 : 0
  const volatilityTrend = secondHalfVolatility > firstHalfVolatility * 1.1 ? 1 :
                          secondHalfVolatility < firstHalfVolatility * 0.9 ? -1 : 0

  // Combine trends
  const combinedTrend = flareTrend + volatilityTrend

  if (combinedTrend > 0) return 'rising'
  if (combinedTrend < 0) return 'declining'
  return 'stable'
}

/**
 * Get empty forecast data structure
 */
function getEmptyForecastData(days: number): ForecastData {
  return {
    forecastDays: days,
    avgPredictedVolatility: 0,
    avgPredictedFlare: 0,
    confidence: 0,
    trend: 'stable',
    predictions: [],
  }
}

/**
 * Request-deduplicated version of getForecastData.
 * Uses React cache() to ensure simultaneous requests share results.
 * 
 * Requirements: 6.4
 */
const getForecastDataDeduplicated = cache(
  async (optionsKey: string): Promise<ForecastData> => {
    const options = optionsKey ? JSON.parse(optionsKey) : undefined
    return getForecastDataInternal(options)
  }
)

/**
 * Get forecast data with Next.js caching and request deduplication.
 * 
 * This function combines:
 * - React cache() for request deduplication (same render cycle)
 * - unstable_cache() for persistent caching with 7200s revalidation
 * 
 * @param options - Optional parameters for forecast days and stock symbol
 * @returns Forecast data with predictions and trend analysis
 * 
 * Requirements: 1.1, 1.2, 6.1
 */
export async function getForecastData(
  options?: ForecastOptions
): Promise<ForecastData> {
  // Create a stable key for deduplication
  const optionsKey = options ? JSON.stringify(options) : ''
  
  // Use the deduplicated version
  return getForecastDataDeduplicated(optionsKey)
}

/**
 * Cached version of getForecastData with 7200s (2 hours) revalidation.
 * 
 * Requirements: 6.1
 */
export const getCachedForecastData = unstable_cache(
  async (options?: ForecastOptions) => {
    const optionsKey = options ? JSON.stringify(options) : ''
    return getForecastDataDeduplicated(optionsKey)
  },
  ['forecast-data'],
  {
    revalidate: 7200, // 2 hours (7200 seconds)
    tags: ['forecast', 'forecast-data'],
  }
)
