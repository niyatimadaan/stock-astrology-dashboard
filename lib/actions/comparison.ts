'use server'

import { unstable_cache } from 'next/cache'
import { cache } from 'react'
import { StockClient } from '../api/stock'
import { calculateAverage, calculateMax } from '../utils/statistics'
import { logError, logInfo } from '../utils/error-handling'

/**
 * Options for getComparisonData server function
 */
export interface ComparisonOptions {
  symbols?: string[]
  startDate?: string
  endDate?: string
}

/**
 * Comparison data for a single stock symbol
 */
export interface StockComparison {
  symbol: string
  avgVolatility: number
  maxVolatility: number
  avgClose: number
  maxClose: number
  totalVolume: number
  dataPoints: number
}

/**
 * Time series data point for chart
 */
export interface ComparisonTimeSeriesPoint {
  date: string
  [symbol: string]: number | string // Dynamic keys for each symbol's volatility
}

/**
 * Comparison data structure
 */
export interface ComparisonData {
  symbols: string[]
  comparisons: StockComparison[]
  timeSeriesData: ComparisonTimeSeriesPoint[]
  summary: {
    mostVolatile: string
    leastVolatile: string
    highestPrice: string
    lowestPrice: string
  }
}

/**
 * Internal implementation of getComparisonData.
 * Supports multiple stock symbols with parallel fetching.
 * 
 * @param options - Optional parameters for symbols and date range
 * @returns Comparison data for multiple stock symbols
 * 
 * Requirements: 8.5
 */
async function getComparisonDataInternal(
  options?: ComparisonOptions
): Promise<ComparisonData> {
  try {
    // Use sensible defaults
    const symbols = options?.symbols || ['AAPL', 'MSFT', 'GOOGL']
    const range = '1mo'

    logInfo('Generating comparison data', {
      function: 'getComparisonData',
      symbols,
    })

    // Initialize stock client
    const stockClient = new StockClient()

    // Fetch data for all symbols in parallel
    // Use Promise.allSettled to handle individual failures gracefully
    const results = await Promise.allSettled(
      symbols.map(async (symbol) => {
        try {
          const quotes = await stockClient.getStockData(symbol, range)
          const stockData = stockClient.calculateVolatility(quotes)
          
          return {
            symbol,
            stockData,
            success: true,
          }
        } catch (error) {
          logError(
            `Failed to fetch data for symbol ${symbol}`,
            error,
            {
              function: 'getComparisonData',
              symbol,
            }
          )
          return {
            symbol,
            stockData: [],
            success: false,
          }
        }
      })
    )

    // Process results and preserve symbol order
    const comparisons: StockComparison[] = []
    const stockDataMap = new Map<string, any[]>()
    
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i]
      const result = results[i]
      
      if (result.status === 'fulfilled' && result.value.success) {
        const { stockData } = result.value
        
        // Store stock data for time series generation
        stockDataMap.set(symbol, stockData)
        
        // Calculate metrics for this symbol
        const volatilityValues = stockData.map(d => d.volatility)
        const closeValues = stockData.map(d => d.close)
        const volumeValues = stockData.map(d => d.volume)

        comparisons.push({
          symbol,
          avgVolatility: calculateAverage(volatilityValues),
          maxVolatility: calculateMax(volatilityValues),
          avgClose: calculateAverage(closeValues),
          maxClose: calculateMax(closeValues),
          totalVolume: volumeValues.reduce((sum, v) => sum + v, 0),
          dataPoints: stockData.length,
        })
      } else {
        // Add empty comparison for failed symbols to preserve order
        comparisons.push({
          symbol,
          avgVolatility: 0,
          maxVolatility: 0,
          avgClose: 0,
          maxClose: 0,
          totalVolume: 0,
          dataPoints: 0,
        })
      }
    }

    // Generate time series data for chart
    const timeSeriesData = generateTimeSeriesData(stockDataMap, symbols)

    // Generate summary
    const summary = generateSummary(comparisons)

    const comparisonData: ComparisonData = {
      symbols,
      comparisons,
      timeSeriesData,
      summary,
    }

    logInfo('Successfully generated comparison data', {
      function: 'getComparisonData',
      symbolCount: symbols.length,
      successfulFetches: comparisons.filter(c => c.dataPoints > 0).length,
      timeSeriesPoints: timeSeriesData.length,
    })

    return comparisonData
  } catch (error) {
    logError(
      'Unexpected error in getComparisonData',
      error,
      {
        function: 'getComparisonData',
        options,
      }
    )

    // Return empty comparison data
    return getEmptyComparisonData(options?.symbols || [])
  }
}

/**
 * Generate time series data for all symbols by merging by date
 */
function generateTimeSeriesData(
  stockDataMap: Map<string, any[]>,
  symbols: string[]
): ComparisonTimeSeriesPoint[] {
  // Collect all unique dates
  const allDates = new Set<string>()
  
  for (const stockData of stockDataMap.values()) {
    for (const point of stockData) {
      allDates.add(point.date)
    }
  }

  // Sort dates
  const sortedDates = Array.from(allDates).sort()

  // Build time series data
  const timeSeriesData: ComparisonTimeSeriesPoint[] = []

  for (const date of sortedDates) {
    const dataPoint: ComparisonTimeSeriesPoint = { date }

    // Add volatility for each symbol on this date
    for (const symbol of symbols) {
      const stockData = stockDataMap.get(symbol)
      if (stockData) {
        const point = stockData.find(d => d.date === date)
        if (point) {
          dataPoint[symbol] = point.volatility
        } else {
          dataPoint[symbol] = 0 // No data for this date
        }
      } else {
        dataPoint[symbol] = 0 // Symbol had no data
      }
    }

    timeSeriesData.push(dataPoint)
  }

  return timeSeriesData
}

/**
 * Generate summary statistics from comparisons
 */
function generateSummary(
  comparisons: StockComparison[]
): ComparisonData['summary'] {
  // Filter out comparisons with no data
  const validComparisons = comparisons.filter(c => c.dataPoints > 0)

  if (validComparisons.length === 0) {
    return {
      mostVolatile: 'N/A',
      leastVolatile: 'N/A',
      highestPrice: 'N/A',
      lowestPrice: 'N/A',
    }
  }

  // Find most and least volatile
  let mostVolatile = validComparisons[0]
  let leastVolatile = validComparisons[0]
  
  for (const comp of validComparisons) {
    if (comp.avgVolatility > mostVolatile.avgVolatility) {
      mostVolatile = comp
    }
    if (comp.avgVolatility < leastVolatile.avgVolatility) {
      leastVolatile = comp
    }
  }

  // Find highest and lowest price
  let highestPrice = validComparisons[0]
  let lowestPrice = validComparisons[0]
  
  for (const comp of validComparisons) {
    if (comp.avgClose > highestPrice.avgClose) {
      highestPrice = comp
    }
    if (comp.avgClose < lowestPrice.avgClose) {
      lowestPrice = comp
    }
  }

  return {
    mostVolatile: mostVolatile.symbol,
    leastVolatile: leastVolatile.symbol,
    highestPrice: highestPrice.symbol,
    lowestPrice: lowestPrice.symbol,
  }
}

/**
 * Get empty comparison data structure
 */
function getEmptyComparisonData(symbols: string[]): ComparisonData {
  return {
    symbols,
    comparisons: symbols.map(symbol => ({
      symbol,
      avgVolatility: 0,
      maxVolatility: 0,
      avgClose: 0,
      maxClose: 0,
      totalVolume: 0,
      dataPoints: 0,
    })),
    timeSeriesData: [],
    summary: {
      mostVolatile: 'N/A',
      leastVolatile: 'N/A',
      highestPrice: 'N/A',
      lowestPrice: 'N/A',
    },
  }
}

/**
 * Request-deduplicated version of getComparisonData.
 * Uses React cache() to ensure simultaneous requests share results.
 * 
 * Requirements: 6.4
 */
const getComparisonDataDeduplicated = cache(
  async (optionsKey: string): Promise<ComparisonData> => {
    const options = optionsKey ? JSON.parse(optionsKey) : undefined
    return getComparisonDataInternal(options)
  }
)

/**
 * Get comparison data with Next.js caching and request deduplication.
 * 
 * This function combines:
 * - React cache() for request deduplication (same render cycle)
 * - unstable_cache() for persistent caching with 1800s revalidation
 * 
 * @param options - Optional parameters for symbols and date range
 * @returns Comparison data for multiple stock symbols
 * 
 * Requirements: 8.5
 */
export async function getComparisonData(
  options?: ComparisonOptions
): Promise<ComparisonData> {
  // Create a stable key for deduplication
  const optionsKey = options ? JSON.stringify(options) : ''
  
  // Use the deduplicated version
  return getComparisonDataDeduplicated(optionsKey)
}

/**
 * Cached version of getComparisonData with 1800s (30 minutes) revalidation.
 * 
 * Requirements: 6.1
 */
export const getCachedComparisonData = unstable_cache(
  async (options?: ComparisonOptions) => {
    const optionsKey = options ? JSON.stringify(options) : ''
    return getComparisonDataDeduplicated(optionsKey)
  },
  ['comparison-data'],
  {
    revalidate: 1800, // 30 minutes (1800 seconds)
    tags: ['comparison', 'comparison-data'],
  }
)
