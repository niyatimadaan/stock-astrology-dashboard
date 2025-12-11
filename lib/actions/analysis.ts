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
import { FlareData, StockData } from '../api/types'
import { logError, logInfo } from '../utils/error-handling'

/**
 * Options for getAnalysisData server function
 */
export interface AnalysisOptions {
  startDate?: string
  endDate?: string
  stockSymbol?: string
}

/**
 * Detailed analysis data structure
 */
export interface AnalysisData {
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
    byClass: Record<string, number>
    byIntensityRange: Record<string, number>
    mostActiveDay: {
      date: string
      intensity: number
    } | null
  }
  volatilityAnalysis: {
    highVolatilityDays: number
    lowVolatilityDays: number
    avgDailyChange: number
    mostVolatileDay: {
      date: string
      volatility: number
    } | null
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

/**
 * Internal implementation of getAnalysisData.
 * Provides detailed analysis metrics from NASA and stock data.
 * 
 * @param options - Optional parameters for date range and stock symbol
 * @returns Detailed analysis data with metrics and insights
 * 
 * Requirements: 1.1, 1.2
 */
async function getAnalysisDataInternal(
  options?: AnalysisOptions
): Promise<AnalysisData> {
  try {
    // Use sensible defaults
    const stockSymbol = options?.stockSymbol || 'AAPL'
    const endDate = options?.endDate || new Date().toISOString().split('T')[0]
    const startDate = options?.startDate || (() => {
      const date = new Date()
      date.setDate(date.getDate() - 30)
      return date.toISOString().split('T')[0]
    })()

    logInfo('Generating analysis data', {
      function: 'getAnalysisData',
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
          'NASA API call failed in getAnalysisData',
          error,
          {
            function: 'getAnalysisData',
            provider: 'NASA',
          }
        )
        return []
      }),
      stockClient.getStockData(stockSymbol, '1mo').catch(error => {
        logError(
          'Stock API call failed in getAnalysisData',
          error,
          {
            function: 'getAnalysisData',
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

    // Calculate summary statistics
    const flareValues = composedData.map(d => d.flare)
    const volatilityValues = composedData.map(d => d.volatility)
    const volumeValues = composedData.map(d => d.trades)

    const summary = {
      totalFlareEvents: flareData.length,
      totalTradingDays: stockData.length,
      avgFlareIntensity: calculateAverage(flareValues),
      avgVolatility: calculateAverage(volatilityValues),
      maxFlareIntensity: calculateMax(flareValues),
      maxVolatility: calculateMax(volatilityValues),
      totalVolume: calculateSum(volumeValues),
      correlationCoefficient: calculateCorrelation(flareValues, volatilityValues),
    }

    // Analyze flares by class
    const flareAnalysis = analyzeFlares(flareData, composedData)

    // Analyze volatility patterns
    const volatilityAnalysis = analyzeVolatility(stockData, composedData)

    // Analyze correlation
    const correlationAnalysis = analyzeCorrelation(summary.correlationCoefficient)

    // Prepare time series data
    const timeSeriesData = composedData.map(item => ({
      date: item.date,
      flare: item.flare,
      volatility: item.volatility,
      volume: item.trades,
    }))

    const analysisData: AnalysisData = {
      summary,
      flareAnalysis,
      volatilityAnalysis,
      correlationAnalysis,
      timeSeriesData,
    }

    logInfo('Successfully generated analysis data', {
      function: 'getAnalysisData',
      totalFlareEvents: summary.totalFlareEvents,
      totalTradingDays: summary.totalTradingDays,
      correlation: summary.correlationCoefficient,
    })

    return analysisData
  } catch (error) {
    logError(
      'Unexpected error in getAnalysisData',
      error,
      {
        function: 'getAnalysisData',
        options,
      }
    )

    // Return empty analysis data
    return getEmptyAnalysisData()
  }
}

/**
 * Analyze flare data by class and intensity
 */
function analyzeFlares(
  flareData: FlareData[],
  composedData: Array<{ date: string; flare: number; volatility: number; trades: number }>
): AnalysisData['flareAnalysis'] {
  // Count by class
  const byClass: Record<string, number> = {}
  for (const flare of flareData) {
    const classLetter = flare.class.charAt(0).toUpperCase()
    byClass[classLetter] = (byClass[classLetter] || 0) + 1
  }

  // Count by intensity range
  const byIntensityRange: Record<string, number> = {
    Low: 0,
    Medium: 0,
    High: 0,
    Extreme: 0,
  }

  for (const item of composedData) {
    const category = categorizeIntensity(item.flare)
    byIntensityRange[category]++
  }

  // Find most active day
  let mostActiveDay: { date: string; intensity: number } | null = null
  for (const item of composedData) {
    if (!mostActiveDay || item.flare > mostActiveDay.intensity) {
      mostActiveDay = {
        date: item.date,
        intensity: item.flare,
      }
    }
  }

  return {
    byClass,
    byIntensityRange,
    mostActiveDay,
  }
}

/**
 * Analyze volatility patterns
 */
function analyzeVolatility(
  stockData: StockData[],
  composedData: Array<{ date: string; flare: number; volatility: number; trades: number }>
): AnalysisData['volatilityAnalysis'] {
  // Count high and low volatility days (using median as threshold)
  const volatilityValues = composedData.map(d => d.volatility).sort((a, b) => a - b)
  const median = volatilityValues[Math.floor(volatilityValues.length / 2)] || 0

  let highVolatilityDays = 0
  let lowVolatilityDays = 0

  for (const item of composedData) {
    if (item.volatility > median) {
      highVolatilityDays++
    } else {
      lowVolatilityDays++
    }
  }

  // Calculate average daily change
  let totalChange = 0
  for (let i = 1; i < stockData.length; i++) {
    const change = Math.abs(stockData[i].close - stockData[i - 1].close)
    totalChange += change
  }
  const avgDailyChange = stockData.length > 1 ? totalChange / (stockData.length - 1) : 0

  // Find most volatile day
  let mostVolatileDay: { date: string; volatility: number } | null = null
  for (const item of composedData) {
    if (!mostVolatileDay || item.volatility > mostVolatileDay.volatility) {
      mostVolatileDay = {
        date: item.date,
        volatility: item.volatility,
      }
    }
  }

  return {
    highVolatilityDays,
    lowVolatilityDays,
    avgDailyChange,
    mostVolatileDay,
  }
}

/**
 * Analyze correlation strength and direction
 */
function analyzeCorrelation(
  coefficient: number
): AnalysisData['correlationAnalysis'] {
  const absCoeff = Math.abs(coefficient)
  
  let strength: 'strong' | 'moderate' | 'weak' | 'none'
  if (absCoeff >= 0.7) {
    strength = 'strong'
  } else if (absCoeff >= 0.4) {
    strength = 'moderate'
  } else if (absCoeff >= 0.2) {
    strength = 'weak'
  } else {
    strength = 'none'
  }

  let direction: 'positive' | 'negative' | 'none'
  if (coefficient > 0.1) {
    direction = 'positive'
  } else if (coefficient < -0.1) {
    direction = 'negative'
  } else {
    direction = 'none'
  }

  return {
    strength,
    direction,
    coefficient,
  }
}

/**
 * Get empty analysis data structure
 */
function getEmptyAnalysisData(): AnalysisData {
  return {
    summary: {
      totalFlareEvents: 0,
      totalTradingDays: 0,
      avgFlareIntensity: 0,
      avgVolatility: 0,
      maxFlareIntensity: 0,
      maxVolatility: 0,
      totalVolume: 0,
      correlationCoefficient: 0,
    },
    flareAnalysis: {
      byClass: {},
      byIntensityRange: {
        Low: 0,
        Medium: 0,
        High: 0,
        Extreme: 0,
      },
      mostActiveDay: null,
    },
    volatilityAnalysis: {
      highVolatilityDays: 0,
      lowVolatilityDays: 0,
      avgDailyChange: 0,
      mostVolatileDay: null,
    },
    correlationAnalysis: {
      strength: 'none',
      direction: 'none',
      coefficient: 0,
    },
    timeSeriesData: [],
  }
}

/**
 * Request-deduplicated version of getAnalysisData.
 * Uses React cache() to ensure simultaneous requests share results.
 * 
 * Requirements: 6.4
 */
const getAnalysisDataDeduplicated = cache(
  async (optionsKey: string): Promise<AnalysisData> => {
    const options = optionsKey ? JSON.parse(optionsKey) : undefined
    return getAnalysisDataInternal(options)
  }
)

/**
 * Get analysis data with Next.js caching and request deduplication.
 * 
 * This function combines:
 * - React cache() for request deduplication (same render cycle)
 * - unstable_cache() for persistent caching with 1800s revalidation
 * 
 * @param options - Optional parameters for date range and stock symbol
 * @returns Detailed analysis data with metrics and insights
 * 
 * Requirements: 1.1, 1.2
 */
export async function getAnalysisData(
  options?: AnalysisOptions
): Promise<AnalysisData> {
  // Create a stable key for deduplication
  const optionsKey = options ? JSON.stringify(options) : ''
  
  // Use the deduplicated version
  return getAnalysisDataDeduplicated(optionsKey)
}

/**
 * Cached version of getAnalysisData with 1800s (30 minutes) revalidation.
 * 
 * Requirements: 6.1
 */
export const getCachedAnalysisData = unstable_cache(
  async (options?: AnalysisOptions) => {
    const optionsKey = options ? JSON.stringify(options) : ''
    return getAnalysisDataDeduplicated(optionsKey)
  },
  ['analysis-data'],
  {
    revalidate: 1800, // 30 minutes (1800 seconds)
    tags: ['analysis', 'analysis-data'],
  }
)
