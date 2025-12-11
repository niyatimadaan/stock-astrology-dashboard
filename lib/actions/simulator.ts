'use server'

import { unstable_cache } from 'next/cache'
import { cache } from 'react'
import { NASAClient } from '../api/nasa'
import { StockClient } from '../api/stock'
import { calculateAverage } from '../utils/statistics'
import { logError, logInfo } from '../utils/error-handling'

/**
 * Scenario type for simulation
 */
export type ScenarioType = 'baseline' | 'high_solar' | 'low_solar' | 'extreme_event'

/**
 * Options for getSimulatorData server function
 */
export interface SimulatorOptions {
  scenario?: ScenarioType
  stockSymbol?: string
  days?: number
}

/**
 * Simulated data point
 */
export interface SimulatedDataPoint {
  date: string
  flare: number
  volatility: number
  volume: number
  confidence: number
}

/**
 * Simulator data structure
 */
export interface SimulatorData {
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

/**
 * Internal implementation of getSimulatorData.
 * Implements scenario simulation logic for different solar activity scenarios.
 * 
 * @param options - Optional parameters for scenario type, stock symbol, and days
 * @returns Simulator data with scenario-based predictions
 * 
 * Requirements: 1.1, 1.2
 */
async function getSimulatorDataInternal(
  options?: SimulatorOptions
): Promise<SimulatorData> {
  try {
    // Use sensible defaults
    const scenario = options?.scenario || 'baseline'
    const stockSymbol = options?.stockSymbol || 'AAPL'
    const days = options?.days || 14

    logInfo('Generating simulator data', {
      function: 'getSimulatorData',
      scenario,
      stockSymbol,
      days,
    })

    // Fetch historical data for baseline calculations
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
          'NASA API call failed in getSimulatorData',
          error,
          {
            function: 'getSimulatorData',
            provider: 'NASA',
          }
        )
        return []
      }),
      stockClient.getStockData(stockSymbol, '1mo').catch(error => {
        logError(
          'Stock API call failed in getSimulatorData',
          error,
          {
            function: 'getSimulatorData',
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

    // Calculate baseline metrics
    const baselineFlare = flareData.length > 0 
      ? calculateAverage(flareData.map(d => d.flare))
      : 1.0
    const baselineVolatility = stockData.length > 0
      ? calculateAverage(stockData.map(d => d.volatility))
      : 2.0
    const baselineVolume = stockData.length > 0
      ? calculateAverage(stockData.map(d => d.volume))
      : 1000000

    // Generate simulated data based on scenario
    const simulatedData = generateScenarioData(
      scenario,
      days,
      baselineFlare,
      baselineVolatility,
      baselineVolume
    )

    // Calculate summary statistics
    const avgFlare = calculateAverage(simulatedData.map(d => d.flare))
    const avgVolatility = calculateAverage(simulatedData.map(d => d.volatility))
    const totalVolume = simulatedData.reduce((sum, d) => sum + d.volume, 0)

    // Determine risk level
    const riskLevel = determineRiskLevel(avgFlare, avgVolatility)

    // Get scenario description and assumptions
    const { description, assumptions } = getScenarioDetails(scenario)

    const simulatorData: SimulatorData = {
      scenario,
      description,
      simulatedData,
      summary: {
        avgFlare,
        avgVolatility,
        totalVolume,
        riskLevel,
      },
      assumptions,
    }

    logInfo('Successfully generated simulator data', {
      function: 'getSimulatorData',
      scenario,
      days,
      riskLevel,
    })

    return simulatorData
  } catch (error) {
    logError(
      'Unexpected error in getSimulatorData',
      error,
      {
        function: 'getSimulatorData',
        options,
      }
    )

    // Return empty simulator data
    return getEmptySimulatorData(options?.scenario || 'baseline', options?.days || 14)
  }
}

/**
 * Generate simulated data based on scenario type
 */
function generateScenarioData(
  scenario: ScenarioType,
  days: number,
  baselineFlare: number,
  baselineVolatility: number,
  baselineVolume: number
): SimulatedDataPoint[] {
  const simulatedData: SimulatedDataPoint[] = []
  const today = new Date()

  // Scenario multipliers
  const scenarioParams = getScenarioParameters(scenario)

  for (let i = 1; i <= days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]

    // Add some randomness to make it realistic
    const randomFactor = 0.8 + Math.random() * 0.4 // 0.8 to 1.2

    // Calculate simulated values
    const flare = baselineFlare * scenarioParams.flareMultiplier * randomFactor
    const volatility = baselineVolatility * scenarioParams.volatilityMultiplier * randomFactor
    const volume = Math.floor(baselineVolume * scenarioParams.volumeMultiplier * randomFactor)

    // Confidence decreases with distance
    const confidence = Math.max(0.5, 1 - (i * 0.03))

    simulatedData.push({
      date: dateStr,
      flare,
      volatility,
      volume,
      confidence,
    })
  }

  return simulatedData
}

/**
 * Get scenario parameters for simulation
 */
function getScenarioParameters(scenario: ScenarioType): {
  flareMultiplier: number
  volatilityMultiplier: number
  volumeMultiplier: number
} {
  switch (scenario) {
    case 'baseline':
      return {
        flareMultiplier: 1.0,
        volatilityMultiplier: 1.0,
        volumeMultiplier: 1.0,
      }
    case 'high_solar':
      return {
        flareMultiplier: 2.5,
        volatilityMultiplier: 1.5,
        volumeMultiplier: 1.3,
      }
    case 'low_solar':
      return {
        flareMultiplier: 0.3,
        volatilityMultiplier: 0.7,
        volumeMultiplier: 0.9,
      }
    case 'extreme_event':
      return {
        flareMultiplier: 5.0,
        volatilityMultiplier: 3.0,
        volumeMultiplier: 2.0,
      }
    default:
      return {
        flareMultiplier: 1.0,
        volatilityMultiplier: 1.0,
        volumeMultiplier: 1.0,
      }
  }
}

/**
 * Get scenario description and assumptions
 */
function getScenarioDetails(scenario: ScenarioType): {
  description: string
  assumptions: string[]
} {
  switch (scenario) {
    case 'baseline':
      return {
        description: 'Normal solar activity with typical market conditions. This scenario assumes continuation of recent historical patterns.',
        assumptions: [
          'Solar activity remains at historical average levels',
          'Market volatility follows recent trends',
          'No major external disruptions',
          'Trading volumes remain stable',
        ],
      }
    case 'high_solar':
      return {
        description: 'Elevated solar activity scenario with increased flare frequency and intensity. Markets may experience heightened volatility.',
        assumptions: [
          'Solar flare intensity increases by 2.5x',
          'Market volatility increases by 50%',
          'Trading volumes increase by 30%',
          'Correlation between solar activity and volatility holds',
        ],
      }
    case 'low_solar':
      return {
        description: 'Quiet solar period with minimal flare activity. Markets typically show reduced volatility during these periods.',
        assumptions: [
          'Solar flare intensity decreases to 30% of baseline',
          'Market volatility decreases by 30%',
          'Trading volumes decrease slightly',
          'Stable market conditions prevail',
        ],
      }
    case 'extreme_event':
      return {
        description: 'Extreme solar event scenario (X-class flares or solar storms). Significant market disruption possible.',
        assumptions: [
          'Solar flare intensity increases by 5x',
          'Market volatility triples',
          'Trading volumes double due to panic/hedging',
          'Potential infrastructure impacts',
          'Increased correlation between solar and market events',
        ],
      }
    default:
      return {
        description: 'Unknown scenario',
        assumptions: [],
      }
  }
}

/**
 * Determine risk level based on metrics
 */
function determineRiskLevel(
  avgFlare: number,
  avgVolatility: number
): 'low' | 'medium' | 'high' | 'extreme' {
  // Combined risk score
  const riskScore = avgFlare * 0.5 + avgVolatility * 0.5

  if (riskScore > 10) return 'extreme'
  if (riskScore > 5) return 'high'
  if (riskScore > 2) return 'medium'
  return 'low'
}

/**
 * Get empty simulator data structure
 */
function getEmptySimulatorData(scenario: ScenarioType, days: number): SimulatorData {
  const { description, assumptions } = getScenarioDetails(scenario)
  
  return {
    scenario,
    description,
    simulatedData: [],
    summary: {
      avgFlare: 0,
      avgVolatility: 0,
      totalVolume: 0,
      riskLevel: 'low',
    },
    assumptions,
  }
}

/**
 * Request-deduplicated version of getSimulatorData.
 * Uses React cache() to ensure simultaneous requests share results.
 * 
 * Requirements: 6.4
 */
const getSimulatorDataDeduplicated = cache(
  async (optionsKey: string): Promise<SimulatorData> => {
    const options = optionsKey ? JSON.parse(optionsKey) : undefined
    return getSimulatorDataInternal(options)
  }
)

/**
 * Get simulator data with Next.js caching and request deduplication.
 * 
 * This function combines:
 * - React cache() for request deduplication (same render cycle)
 * - unstable_cache() for persistent caching with 1800s revalidation
 * 
 * @param options - Optional parameters for scenario type, stock symbol, and days
 * @returns Simulator data with scenario-based predictions
 * 
 * Requirements: 1.1, 1.2
 */
export async function getSimulatorData(
  options?: SimulatorOptions
): Promise<SimulatorData> {
  // Create a stable key for deduplication
  const optionsKey = options ? JSON.stringify(options) : ''
  
  // Use the deduplicated version
  return getSimulatorDataDeduplicated(optionsKey)
}

/**
 * Cached version of getSimulatorData with 1800s (30 minutes) revalidation.
 * 
 * Requirements: 6.1
 */
export const getCachedSimulatorData = unstable_cache(
  async (options?: SimulatorOptions) => {
    const optionsKey = options ? JSON.stringify(options) : ''
    return getSimulatorDataDeduplicated(optionsKey)
  },
  ['simulator-data'],
  {
    revalidate: 1800, // 30 minutes (1800 seconds)
    tags: ['simulator', 'simulator-data'],
  }
)
