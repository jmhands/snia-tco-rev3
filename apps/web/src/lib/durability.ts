export type ProtectionScheme = "mirror" | "raid5" | "raid6" | "erasure"
export type FailureDomain = "drive" | "server"

export type ProtectionLayout = {
  scheme: ProtectionScheme
  dataShards: number
  parityShards: number
  totalShards: number
  protectionFactor: number
  label: string
}

export type DurabilityOptions = {
  totalDrives?: number
  serverCount?: number
  failureDomain?: FailureDomain
}

export type DurabilityEstimate = {
  annualDurability: number
  annualLossRate: number
  annualOdds: string
  nines: number
  formattedPercentage: string
  clusterAnnualDurability: number
  clusterAnnualLossRate: number
  clusterAnnualOdds: string
  clusterNines: number
  clusterFormattedPercentage: string
  protectionSetCount: number
  failureDomain: FailureDomain
  isTopologyValid: boolean
  topologyWarning: string | null
  failureThreshold: number
  failureProbabilityPerPeriod: number
  rebuildPeriodsPerYear: number
}

const clampInteger = (value: number, minimum: number, maximum: number) =>
  Math.min(
    Math.max(Math.round(Number.isFinite(value) ? value : minimum), minimum),
    maximum
  )

export function getProtectionLayout(
  scheme: ProtectionScheme,
  dataShards: number,
  configuredParityShards: number
): ProtectionLayout {
  const data = scheme === "mirror" ? 1 : clampInteger(dataShards, 2, 20)
  const parity =
    scheme === "mirror"
      ? 1
      : scheme === "raid5"
        ? 1
        : scheme === "raid6"
          ? 2
          : clampInteger(configuredParityShards, 1, 10)
  const totalShards = data + parity
  const schemeLabel =
    scheme === "mirror"
      ? "Mirror"
      : scheme === "raid5"
        ? "RAID 5"
        : scheme === "raid6"
          ? "RAID 6"
          : "Erasure code"

  return {
    scheme,
    dataShards: data,
    parityShards: parity,
    totalShards,
    protectionFactor: totalShards / data,
    label:
      scheme === "mirror"
        ? `${schemeLabel} 2-way`
        : `${schemeLabel} ${data}+${parity}`,
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

function binomialProbability(
  failures: number,
  shards: number,
  probability: number
) {
  return (
    choose(shards, failures) *
    Math.pow(probability, failures) *
    Math.pow(1 - probability, shards - failures)
  )
}

function probabilityInAnyPeriod(probability: number, periods: number) {
  if (probability <= 0 || periods <= 0) return 0
  if (probability >= 1) return 1

  return Math.min(
    1,
    Math.max(0, -Math.expm1(periods * Math.log1p(-probability)))
  )
}

function countNines(lossRate: number) {
  if (lossRate <= 0) return 15
  return Math.min(15, Math.max(0, Math.floor(-Math.log10(lossRate))))
}

export function formatDurabilityPercentage(
  lossRate: number,
  nines?: number
): string {
  const resolvedNines = nines ?? countNines(lossRate)
  if (lossRate <= 0 || resolvedNines >= 15) {
    return "99.9999999999999%+"
  }
  if (lossRate >= 1) {
    return "0.00%"
  }

  const percent = (1 - lossRate) * 100
  const fractionDigits = Math.min(13, Math.max(2, resolvedNines))
  return `${percent.toFixed(fractionDigits)}%`
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
 * Binomial rebuild-window durability model.
 * Evaluates both a single protection set and the fleet-wide cluster durability.
 */
export function calculateDurability(
  layout: ProtectionLayout,
  annualShardFailureRate: number,
  rebuildTimeHours: number,
  options: DurabilityOptions = {}
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
  const nines = countNines(annualLossRate)

  const totalDrives = Math.max(0, options.totalDrives ?? layout.totalShards)
  const serverCount = Math.max(1, options.serverCount ?? layout.totalShards)
  const failureDomain: FailureDomain = options.failureDomain ?? "drive"

  const protectionSetCount =
    totalDrives > 0 ? Math.max(1, totalDrives / layout.totalShards) : 0
  const clusterAnnualLossRate =
    totalDrives > 0
      ? probabilityInAnyPeriod(
          periodLossProbability,
          rebuildPeriodsPerYear * protectionSetCount
        )
      : 0
  const clusterNines = countNines(clusterAnnualLossRate)

  let isTopologyValid = true
  let topologyWarning: string | null = null

  if (totalDrives > 0 && totalDrives < layout.totalShards) {
    isTopologyValid = false
    topologyWarning = `Layout requires ${layout.totalShards} shards (${layout.label}), but the cluster only deploys ${totalDrives} total drives.`
  } else if (failureDomain === "server" && serverCount < layout.totalShards) {
    isTopologyValid = false
    topologyWarning = `Node-level failure domain requires at least ${layout.totalShards} servers for ${layout.label} (1 shard per node), but only ${serverCount} ${serverCount === 1 ? "server is" : "servers are"} configured.`
  }

  return {
    annualDurability: 1 - annualLossRate,
    annualLossRate,
    annualOdds: prettyProbability(annualLossRate),
    nines,
    formattedPercentage: formatDurabilityPercentage(annualLossRate, nines),
    clusterAnnualDurability: 1 - clusterAnnualLossRate,
    clusterAnnualLossRate,
    clusterAnnualOdds: prettyProbability(clusterAnnualLossRate),
    clusterNines,
    clusterFormattedPercentage: formatDurabilityPercentage(
      clusterAnnualLossRate,
      clusterNines
    ),
    protectionSetCount,
    failureDomain,
    isTopologyValid,
    topologyWarning,
    failureThreshold,
    failureProbabilityPerPeriod,
    rebuildPeriodsPerYear,
  }
}
