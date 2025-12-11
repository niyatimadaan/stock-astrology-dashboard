/**
 * Calculates the Pearson correlation coefficient between two numeric arrays.
 * The result is always between -1 and 1 inclusive.
 * 
 * @param x - First numeric array
 * @param y - Second numeric array
 * @returns Pearson correlation coefficient between -1 and 1, or 0 for edge cases
 * 
 * Requirements: 4.2, 9.4
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  // Handle edge cases
  if (!x || !y || x.length === 0 || y.length === 0) {
    return 0
  }

  if (x.length !== y.length) {
    return 0
  }

  if (x.length === 1) {
    return 0
  }

  // Filter out invalid values (null, undefined, NaN)
  const validPairs: Array<[number, number]> = []
  for (let i = 0; i < x.length; i++) {
    if (
      typeof x[i] === 'number' && 
      typeof y[i] === 'number' && 
      !isNaN(x[i]) && 
      !isNaN(y[i]) &&
      isFinite(x[i]) &&
      isFinite(y[i])
    ) {
      validPairs.push([x[i], y[i]])
    }
  }

  // Need at least 2 valid pairs for correlation
  if (validPairs.length < 2) {
    return 0
  }

  const n = validPairs.length
  const validX = validPairs.map(pair => pair[0])
  const validY = validPairs.map(pair => pair[1])

  // Calculate means
  const meanX = validX.reduce((sum, val) => sum + val, 0) / n
  const meanY = validY.reduce((sum, val) => sum + val, 0) / n

  // Calculate standard deviations and covariance
  let sumXY = 0
  let sumX2 = 0
  let sumY2 = 0

  for (let i = 0; i < n; i++) {
    const dx = validX[i] - meanX
    const dy = validY[i] - meanY
    sumXY += dx * dy
    sumX2 += dx * dx
    sumY2 += dy * dy
  }

  // Handle zero variance (all values are the same)
  if (sumX2 === 0 || sumY2 === 0) {
    return 0
  }

  // Calculate Pearson correlation coefficient
  const correlation = sumXY / Math.sqrt(sumX2 * sumY2)

  // Clamp to [-1, 1] to handle floating-point precision issues
  return Math.max(-1, Math.min(1, correlation))
}
