export type ProtectionScheme = "raid5" | "raid6" | "erasure"

export type ProtectionLayout = {
  scheme: ProtectionScheme
  dataShards: number
  parityShards: number
  totalShards: number
  protectionFactor: number
  label: string
}

export type DurabilityEstimate = {
  annualDurability: number
  annualLossRate: number
  annualOdds: string
  nines: number
  failureThreshold: number
  failureProbabilityPerPeriod: number
  rebuildPeriodsPerYear: number
}

const clampInteger = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(Math.round(Number.isFinite(value) ? value : minimum), minimum), maximum)

export function getProtectionLayout(
  scheme: ProtectionScheme,
  dataShards: number,
  configuredParityShards: number
): ProtectionLayout {
  const data = clampInteger(dataShards, 2, 20)
  const parity =
    scheme === "raid5"
      ? 1
      : scheme === "raid6"
        ? 2
        : clampInteger(configuredParityShards, 1, 10)
  const totalShards = data + parity
  const schemeLabel =
    scheme === "raid5" ? "RAID 5" : scheme === "raid6" ? "RAID 6" : "Erasure code"

  return {
    scheme,
    dataShards: data,
    parityShards: parity,
    totalShards,
    protectionFactor: totalShards / data,
    label: `${schemeLabel} ${data}+${parity}`,
  }
}

function choose(n: number, k: number) {
  if (k < 0 || k > n) return 0
  if (k === 0 || k === n) return 1

  const smallerK = Math.min(k, n - k)
  let result = 1
  for (let index = 1; index <= smallerK; index += 1) {
    result *= n - (smallerK - index)
    result /= index
  }
  return result
}

function binomialProbability(failures: number, shards: number, probability: number) {
  return (
    choose(shards, failures) *
    Math.pow(probability, failures) *
    Math.pow(1 - probability, shards - failures)
  )
}

function probabilityInAnyPeriod(probability: number, periods: number) {
  if (probability <= 0) return 0
  if (probability >= 1) return 1

  return Math.min(1, Math.max(0, -Math.expm1(periods * Math.log1p(-probability))))
}

function countNines(lossRate: number) {
  if (lossRate <= 0) return 15
  return Math.min(15, Math.max(0, Math.floor(-Math.log10(lossRate))))
}

function prettyProbability(probability: number) {
  if (probability <= 0) return "Less than 1 in an octillion"
  if (Math.abs(probability - 1) < 0.01) return "Always"

  const scaleTable: Array<[number, string]> = [
    [1, "ten"],
    [2, "a hundred"],
    [3, "a thousand"],
    [6, "a million"],
    [9, "a billion"],
    [12, "a trillion"],
    [15, "a quadrillion"],
    [18, "a quintillion"],
    [21, "a sextillion"],
    [24, "a septillion"],
    [27, "an octillion"],
  ]

  for (const [power, name] of scaleTable) {
    const count = probability * Math.pow(10, power)
    if (count >= 0.9) return `${Math.round(count)} in ${name}`
  }

  return "Less than 1 in an octillion"
}

/**
 * Binomial rebuild-window durability model adapted from jmhands/durability-calc.
 * A protection set is lost when failures within one rebuild window exceed parity.
 */
export function calculateDurability(
  layout: ProtectionLayout,
  annualShardFailureRate: number,
  rebuildTimeHours: number
): DurabilityEstimate {
  const rebuildDays = Math.max(rebuildTimeHours, 1) / 24
  const rebuildPeriodsPerYear = 365 / rebuildDays
  const annualFailureRate = Math.max(annualShardFailureRate, 0)
  const failureRatePerPeriod = annualFailureRate / rebuildPeriodsPerYear
  const failureProbabilityPerPeriod = 1 - Math.exp(-failureRatePerPeriod)
  const failureThreshold = layout.parityShards + 1

  let periodLossProbability = 0
  for (
    let failedShards = layout.totalShards;
    failedShards >= failureThreshold;
    failedShards -= 1
  ) {
    periodLossProbability += binomialProbability(
      failedShards,
      layout.totalShards,
      failureProbabilityPerPeriod
    )
  }

  const annualLossRate = probabilityInAnyPeriod(
    periodLossProbability,
    rebuildPeriodsPerYear
  )

  return {
    annualDurability: 1 - annualLossRate,
    annualLossRate,
    annualOdds: prettyProbability(annualLossRate),
    nines: countNines(annualLossRate),
    failureThreshold,
    failureProbabilityPerPeriod,
    rebuildPeriodsPerYear,
  }
}
