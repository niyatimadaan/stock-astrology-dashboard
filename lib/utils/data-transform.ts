import { FlareData, StockData, ComposedData } from '../api/types'

/**
 * Checks if a value is valid (not null, undefined, or NaN)
 */
function isValidNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value)
}

/**
 * Merges NASA flare data and stock data by date, aligning time series data
 * to ensure accurate temporal relationships. Handles missing data gracefully.
 * 
 * @param flareData - Array of flare events with dates
 * @param stockData - Array of stock data with dates
 * @returns Array of composed data aligned by date in chronological order
 * 
 * Requirements: 4.1, 4.3, 4.5
 */
export function mergeDatasets(
  flareData: FlareData[],
  stockData: StockData[]
): ComposedData[] {
  // Handle empty or invalid inputs
  if (!flareData || !stockData || flareData.length === 0 || stockData.length === 0) {
    return []
  }

  // Create maps for efficient lookup and prevent duplicates
  const flareMap = new Map<string, FlareData>()
  const stockMap = new Map<string, StockData>()

  // Populate maps, handling duplicates by keeping the first occurrence
  // Also validate that required fields exist and are valid
  for (const flare of flareData) {
    if (
      flare && 
      flare.date && 
      typeof flare.date === 'string' &&
      isValidNumber(flare.flare) &&
      !flareMap.has(flare.date)
    ) {
      flareMap.set(flare.date, flare)
    }
  }

  for (const stock of stockData) {
    if (
      stock && 
      stock.date && 
      typeof stock.date === 'string' &&
      isValidNumber(stock.volatility) &&
      isValidNumber(stock.volume) &&
      !stockMap.has(stock.date)
    ) {
      stockMap.set(stock.date, stock)
    }
  }

  // Find common dates (intersection)
  const commonDates = Array.from(flareMap.keys()).filter(date => 
    stockMap.has(date)
  )

  // Sort dates chronologically
  commonDates.sort((a, b) => a.localeCompare(b))

  // Merge data for common dates, filtering out any with invalid values
  const composedData: ComposedData[] = []
  
  for (const date of commonDates) {
    const flare = flareMap.get(date)!
    const stock = stockMap.get(date)!

    // Double-check values are still valid
    if (
      isValidNumber(flare.flare) &&
      isValidNumber(stock.volatility) &&
      isValidNumber(stock.volume)
    ) {
      composedData.push({
        date,
        flare: flare.flare,
        volatility: stock.volatility,
        trades: stock.volume
      })
    }
  }

  return composedData
}
