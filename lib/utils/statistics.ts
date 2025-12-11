/**
 * Statistical calculation utilities for data analysis.
 * Handles floating-point precision and edge cases.
 * 
 * Requirements: 9.1, 9.2, 9.3
 */

/**
 * Checks if a value is a valid number (not null, undefined, NaN, or Infinity)
 */
function isValidNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value)
}

/**
 * Calculates the average (mean) of an array of numbers.
 * Filters out invalid values (null, undefined, NaN, Infinity).
 * 
 * @param values - Array of numbers
 * @returns Average value, or 0 if no valid values
 * 
 * Requirements: 9.1
 */
export function calculateAverage(values: number[]): number {
  if (!values || values.length === 0) {
    return 0
  }

  const validValues = values.filter(isValidNumber)

  if (validValues.length === 0) {
    return 0
  }

  const sum = validValues.reduce((acc, val) => acc + val, 0)
  return sum / validValues.length
}

/**
 * Finds the maximum value in an array of numbers.
 * Filters out invalid values (null, undefined, NaN, Infinity).
 * 
 * @param values - Array of numbers
 * @returns Maximum value, or 0 if no valid values
 * 
 * Requirements: 9.2
 */
export function calculateMax(values: number[]): number {
  if (!values || values.length === 0) {
    return 0
  }

  const validValues = values.filter(isValidNumber)

  if (validValues.length === 0) {
    return 0
  }

  return Math.max(...validValues)
}

/**
 * Calculates the sum of an array of numbers.
 * Filters out invalid values (null, undefined, NaN, Infinity).
 * 
 * @param values - Array of numbers
 * @returns Sum of all valid values, or 0 if no valid values
 * 
 * Requirements: 9.3
 */
export function calculateSum(values: number[]): number {
  if (!values || values.length === 0) {
    return 0
  }

  const validValues = values.filter(isValidNumber)

  if (validValues.length === 0) {
    return 0
  }

  return validValues.reduce((acc, val) => acc + val, 0)
}

/**
 * Categorizes a flare intensity value into a distribution range.
 * Every value maps to exactly one category.
 * 
 * Ranges:
 * - Low: 0 <= value < 2
 * - Medium: 2 <= value < 4
 * - High: 4 <= value < 6
 * - Extreme: value >= 6
 * 
 * @param intensity - Flare intensity value
 * @returns Category string: "Low", "Medium", "High", or "Extreme"
 * 
 * Requirements: 9.5
 */
export function categorizeIntensity(intensity: number): string {
  // Handle invalid values by treating them as Low
  if (!isValidNumber(intensity) || intensity < 0) {
    return 'Low'
  }

  if (intensity < 2) {
    return 'Low'
  } else if (intensity < 4) {
    return 'Medium'
  } else if (intensity < 6) {
    return 'High'
  } else {
    return 'Extreme'
  }
}
