import { NASAClientConfig, NASAFlareEvent, FlareData, APIError } from './types'
import { logError, logWarning, logInfo, getEmptyNASAFlareEvents } from '../utils/error-handling'

/**
 * NASA DONKI API Client
 * Fetches solar flare event data from NASA's Space Weather Database
 */
export class NASAClient {
  private config: NASAClientConfig

  constructor(config?: Partial<NASAClientConfig>) {
    // Default configuration with environment variable fallbacks
    const defaultApiKey = process.env.NASA_API_KEY || 'DEMO_KEY'
    const defaultBaseUrl = process.env.NASA_BASE_URL || 'https://api.nasa.gov/DONKI'
    
    this.config = {
      apiKey: config?.apiKey || defaultApiKey,
      baseUrl: config?.baseUrl || defaultBaseUrl,
      timeout: config?.timeout || 10000, // 10 seconds default
    }
  }

  /**
   * Fetch solar flare events from NASA DONKI API
   * @param startDate - Start date in YYYY-MM-DD format
   * @param endDate - End date in YYYY-MM-DD format
   * @returns Array of NASA flare events
   */
  async getFlareEvents(
    startDate: string,
    endDate: string
  ): Promise<NASAFlareEvent[]> {
    try {
      // Construct the API URL
      const url = new URL(`${this.config.baseUrl}/FLR`)
      url.searchParams.append('startDate', startDate)
      url.searchParams.append('endDate', endDate)
      url.searchParams.append('api_key', this.config.apiKey)

      logInfo('Fetching flare events', {
        function: 'getFlareEvents',
        provider: 'NASA',
        startDate,
        endDate,
        url: url.toString().replace(this.config.apiKey, '***'),
      })

      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      try {
        const response = await fetch(url.toString(), {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          },
        })

        clearTimeout(timeoutId)

        // Handle rate limiting (429 status code)
        if (response.status === 429) {
          logError(
            'NASA API rate limit exceeded',
            new APIError('Rate limit exceeded', 429, 'NASA'),
            {
              function: 'getFlareEvents',
              provider: 'NASA',
              statusCode: 429,
              startDate,
              endDate,
            }
          )
          return getEmptyNASAFlareEvents()
        }

        // Handle non-200 responses
        if (!response.ok) {
          const error = new APIError(
            `NASA API returned status ${response.status}`,
            response.status,
            'NASA'
          )
          
          logError(
            'NASA API returned error status',
            error,
            {
              function: 'getFlareEvents',
              provider: 'NASA',
              statusCode: response.status,
              startDate,
              endDate,
            }
          )
          
          return getEmptyNASAFlareEvents()
        }

        const data = await response.json()

        // NASA API returns an array of flare events
        if (!Array.isArray(data)) {
          logWarning('Unexpected response format from NASA API, expected array', {
            function: 'getFlareEvents',
            provider: 'NASA',
            startDate,
            endDate,
          })
          return getEmptyNASAFlareEvents()
        }

        logInfo('Successfully fetched flare events', {
          function: 'getFlareEvents',
          provider: 'NASA',
          count: data.length,
        })

        return data as NASAFlareEvent[]
      } catch (fetchError) {
        clearTimeout(timeoutId)
        throw fetchError
      }
    } catch (error) {
      // Handle timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        logError(
          'NASA API request timed out',
          error,
          {
            function: 'getFlareEvents',
            provider: 'NASA',
            timeout: this.config.timeout,
            startDate,
            endDate,
          }
        )
        return getEmptyNASAFlareEvents()
      }

      // Handle API errors
      if (error instanceof APIError) {
        logError(
          'NASA API error',
          error,
          {
            function: 'getFlareEvents',
            provider: 'NASA',
            statusCode: error.statusCode,
            startDate,
            endDate,
          }
        )
        return getEmptyNASAFlareEvents()
      }

      // Handle network errors
      logError(
        'Network error while fetching NASA data',
        error,
        {
          function: 'getFlareEvents',
          provider: 'NASA',
          startDate,
          endDate,
        }
      )
      
      return getEmptyNASAFlareEvents()
    }
  }

  /**
   * Transform raw NASA flare events into standardized FlareData format
   * @param events - Raw NASA flare events
   * @returns Array of transformed flare data
   */
  transformFlareData(events: NASAFlareEvent[]): FlareData[] {
    const results: FlareData[] = []
    
    for (const event of events) {
      try {
        // Extract flare intensity from classType (e.g., "M2.5" -> 2.5)
        const flareIntensity = this.extractFlareIntensity(event.classType)

        // Normalize peak time to YYYY-MM-DD format
        const normalizedDate = this.normalizeDate(event.peakTime)

        const flareData: FlareData = {
          date: normalizedDate,
          flare: flareIntensity,
          class: event.classType,
          peakTime: event.peakTime,
        }

        // Add sourceRegion only if it exists
        if (event.activeRegionNum) {
          flareData.sourceRegion = event.activeRegionNum
        }

        results.push(flareData)
      } catch (error) {
        // Handle malformed events gracefully
        console.warn('[NASAClient] Skipping malformed flare event:', {
          flrID: event.flrID,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
    
    return results
  }

  /**
   * Extract numeric intensity from flare class string
   * @param classType - Flare class (e.g., "M2.5", "X1.0", "C5.3")
   * @returns Numeric intensity value
   */
  private extractFlareIntensity(classType: string): number {
    if (!classType || typeof classType !== 'string') {
      throw new Error('Invalid classType')
    }

    // Flare classes: C (weakest), M (medium), X (strongest)
    // Format: Letter followed by number (e.g., "M2.5")
    const match = classType.match(/^([CMX])(\d+\.?\d*)$/i)

    if (!match) {
      throw new Error(`Unable to parse flare class: ${classType}`)
    }

    const [, classLetter, magnitude] = match
    const numericMagnitude = parseFloat(magnitude)

    if (isNaN(numericMagnitude)) {
      throw new Error(`Invalid magnitude in flare class: ${classType}`)
    }

    // Scale based on class letter
    // C-class: 0-1, M-class: 1-10, X-class: 10+
    const classMultiplier: Record<string, number> = {
      C: 0.1,
      M: 1,
      X: 10,
    }

    const multiplier = classMultiplier[classLetter.toUpperCase()]
    if (multiplier === undefined) {
      throw new Error(`Unknown flare class letter: ${classLetter}`)
    }

    return numericMagnitude * multiplier
  }

  /**
   * Normalize various date formats to YYYY-MM-DD
   * @param dateString - Date string in various formats
   * @returns Normalized date string in YYYY-MM-DD format
   */
  private normalizeDate(dateString: string): string {
    if (!dateString || typeof dateString !== 'string') {
      throw new Error('Invalid date string')
    }

    try {
      // Parse the date string
      const date = new Date(dateString)

      // Check if date is valid
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date')
      }

      // Format as YYYY-MM-DD
      const year = date.getUTCFullYear()
      const month = String(date.getUTCMonth() + 1).padStart(2, '0')
      const day = String(date.getUTCDate()).padStart(2, '0')

      return `${year}-${month}-${day}`
    } catch (error) {
      throw new Error(`Failed to normalize date: ${dateString}`)
    }
  }
}
