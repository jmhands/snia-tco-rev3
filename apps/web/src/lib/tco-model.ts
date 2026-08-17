import { getProtectionLayout, type ProtectionScheme } from "@/lib/durability"

export type SectionId =
  | "drive"
  | "server"
  | "cluster"
  | "software"
  | "workload"
  | "opex"
  | "summary"

export type DriveConfig = {
  id: string
  name: string
  medium: "HDD" | "NVMe SSD"
  interface: string
  capacityTB: number
  activeWatts: number
  idleWatts: number
  afrPercent: number
  costPerTB: number
}

export type DriveAllocation = {
  driveId: string
  count: number
}

export type NicSpeedGbps = 100 | 200 | 400 | 800

export const REFERENCE_SWITCH_PORTS = 64
export const REFERENCE_SWITCH_SPEED_GBPS = 800
const DEFAULT_DRIVE_ID = "nvme-15-36-default"

export type ServerConfig = {
  name: string
  driveAllocations: DriveAllocation[]
  cpuModel: string
  sockets: number
  coresPerSocket: number
  dramGB: number
  rackUnits: number
  basePowerWatts: number
  nicCount: number
  nicSpeedGbps: NicSpeedGbps
  portsPerNic: number
  unitCost: number
}

export type ClusterConfig = {
  serverCount: number
  rackCapacityRU: number
  networkOverheadWattsPerServer: number
  switchCount: number
  switchCostPerPort: number
  hostOpticCost: number
  switchOpticCost: number
  switchPowerWatts: number
  switchRackUnits: number
}

export type SoftwareConfig = {
  upfrontPerRawTB: number
  upfrontPerServer: number
  monthlyPerCore: number
  monthlyPerRawTB: number
}

export type WorkloadConfig = {
  termYears: number
  protectionScheme: ProtectionScheme
  dataShards: number
  parityShards: number
  rebuildTimeHours: number
  capacityUtilizationPercent: number
  activeDutyCyclePercent: number
  dataReductionRatio: number
}

export type OpexConfig = {
  electricityPerKwh: number
  pue: number
  coloPerKwMonth: number
  internetBandwidthGbps: number
  internetPerGbpsMonth: number
  annualAdminCost: number
  annualHardwareSupportPercent: number
  driveReplacementLabor: number
}

export type TcoModel = {
  drives: DriveConfig[]
  server: ServerConfig
  cluster: ClusterConfig
  software: SoftwareConfig
  workload: WorkloadConfig
  opex: OpexConfig
}

export type CostCategory = {
  name: string
  value: number
  key: "hardware" | "energy" | "facilities" | "network" | "software" | "operations"
}

export type AnnualCost = {
  period: string
  hardware: number
  software: number
  operations: number
}

export type DriveBreakdownItem = {
  drive: DriveConfig
  drivesPerServer: number
  totalDrives: number
  rawCapacityTB: number
  unitCost: number
  acquisitionCost: number
}

export type TcoResults = {
  driveBreakdown: DriveBreakdownItem[]
  drivesPerServer: number
  totalDrives: number
  totalCores: number
  hostPortsPerServer: number
  totalHostPorts: number
  hostBandwidthPerServerGbps: number
  aggregateHostBandwidthGbps: number
  switchBreakoutFactor: number
  usedSwitchPorts: number
  availableSwitchPorts: number
  minimumSwitchCount: number
  switchPortUtilizationPercent: number
  hostOpticCount: number
  switchOpticCount: number
  rawCapacityPerServerTB: number
  rawCapacityTB: number
  protectedCapacityTB: number
  dataReducedCapacityTB: number
  utilizedCapacityTB: number
  effectiveCapacityTB: number
  protectionFactor: number
  protectionDataShards: number
  protectionParityShards: number
  rackCount: number
  totalRackUnits: number
  averageItPowerWatts: number
  peakItPowerWatts: number
  provisionedPowerKw: number
  annualEnergyKwh: number
  rawMediaCostPerServer: number
  averageDrivePowerPerServerWatts: number
  peakDrivePowerPerServerWatts: number
  weightedAfrPercent: number
  driveCapex: number
  serverCapex: number
  switchHardwareCost: number
  hostOpticsTotal: number
  switchOpticsTotal: number
  networkCapex: number
  hardwareCapex: number
  upfrontSoftware: number
  recurringSoftware: number
  softwareTotal: number
  electricityTotal: number
  monthlyColoCost: number
  coloSpaceTotal: number
  networkOpexTotal: number
  replacementTotal: number
  supportTotal: number
  adminTotal: number
  operationsTotal: number
  tco: number
  tcoPerRawTB: number
  tcoPerEffectiveTB: number
  tcoPerEffectiveTBMonth: number
  hardwareCapexPerEffectiveTBMonth: number
  operationsPerEffectiveTBMonth: number
  softwarePerEffectiveTBMonth: number
  capexPercent: number
  annualizedTco: number
  categories: CostCategory[]
  annualCosts: AnnualCost[]
}

export const SECTION_META: Record<
  SectionId,
  { label: string; eyebrow: string; description: string }
> = {
  drive: {
    label: "Drive config",
    eyebrow: "01 / Media library",
    description: "Define the capacity, power, reliability, and acquisition cost of storage media.",
  },
  server: {
    label: "Server config",
    eyebrow: "02 / Node design",
    description: "Compose a storage node from configured drives, compute and memory, plus a clear physical NIC topology.",
  },
  cluster: {
    label: "Cluster config",
    eyebrow: "03 / Scale out",
    description: "Set the node count, rack envelope, and 800G switch and optics economics for the deployment.",
  },
  software: {
    label: "Software & license",
    eyebrow: "04 / Platform economics",
    description: "Model upfront and recurring licenses against raw capacity, servers, and physical cores.",
  },
  workload: {
    label: "Workload & data reduction",
    eyebrow: "05 / Effective capacity",
    description: "Translate raw media into protected, usable, workload-adjusted capacity.",
  },
  opex: {
    label: "OpEx config",
    eyebrow: "06 / Run the fleet",
    description: "Model peak-power colocation, PUE-adjusted energy, Internet bandwidth, and fleet operations.",
  },
  summary: {
    label: "TCO summary",
    eyebrow: "07 / Decision view",
    description: "See the complete deployment cost, normalized to effective capacity and time.",
  },
}

export const DEFAULT_MODEL: TcoModel = {
  drives: [
    {
      id: DEFAULT_DRIVE_ID,
      name: "15.36 TB NVMe",
      medium: "NVMe SSD",
      interface: "PCIe Gen5",
      capacityTB: 15.36,
      activeWatts: 15,
      idleWatts: 3,
      afrPercent: 0.44,
      costPerTB: 350,
    },
  ],
  server: {
    name: "Storage server",
    driveAllocations: [{ driveId: DEFAULT_DRIVE_ID, count: 24 }],
    cpuModel: "General-purpose x86",
    sockets: 1,
    coresPerSocket: 64,
    dramGB: 512,
    rackUnits: 2,
    basePowerWatts: 650,
    nicCount: 2,
    nicSpeedGbps: 200,
    portsPerNic: 2,
    unitCost: 35000,
  },
  cluster: {
    serverCount: 12,
    rackCapacityRU: 42,
    networkOverheadWattsPerServer: 90,
    switchCount: 2,
    switchCostPerPort: 781.25,
    hostOpticCost: 400,
    switchOpticCost: 800,
    switchPowerWatts: 2500,
    switchRackUnits: 2,
  },
  software: {
    upfrontPerRawTB: 0,
    upfrontPerServer: 0,
    monthlyPerCore: 0,
    monthlyPerRawTB: 3,
  },
  workload: {
    termYears: 5,
    protectionScheme: "raid6",
    dataShards: 8,
    parityShards: 2,
    rebuildTimeHours: 24,
    capacityUtilizationPercent: 90,
    activeDutyCyclePercent: 20,
    dataReductionRatio: 1.5,
  },
  opex: {
    electricityPerKwh: 0.24,
    pue: 1.3,
    coloPerKwMonth: 135,
    internetBandwidthGbps: 100,
    internetPerGbpsMonth: 100,
    annualAdminCost: 12000,
    annualHardwareSupportPercent: 3,
    driveReplacementLabor: 100,
  },
}

const positive = (value: number, fallback = 0) =>
  Number.isFinite(value) ? Math.max(value, fallback) : fallback

function calculateUsedSwitchPorts(
  totalHostPorts: number,
  switchCount: number,
  breakoutFactor: number
) {
  const baseHostPortsPerSwitch = Math.floor(totalHostPorts / switchCount)
  const switchesWithExtraHostPort = totalHostPorts % switchCount

  return (
    switchesWithExtraHostPort *
      Math.ceil((baseHostPortsPerSwitch + 1) / breakoutFactor) +
    (switchCount - switchesWithExtraHostPort) *
      Math.ceil(baseHostPortsPerSwitch / breakoutFactor)
  )
}

export function calculateTco(model: TcoModel): TcoResults {
  const termYears = positive(model.workload.termYears, 1)
  const termMonths = termYears * 12
  const serverCount = positive(model.cluster.serverCount, 1)
  const switchCount = Math.max(
    1,
    Math.round(positive(model.cluster.switchCount, 1))
  )
  const nicCount = Math.max(1, Math.round(positive(model.server.nicCount, 1)))
  const portsPerNic = Math.max(
    1,
    Math.round(positive(model.server.portsPerNic, 1))
  )
  const nicSpeedGbps = positive(model.server.nicSpeedGbps, 100)
  const hostPortsPerServer = nicCount * portsPerNic
  const totalHostPorts = serverCount * hostPortsPerServer
  const hostBandwidthPerServerGbps = hostPortsPerServer * nicSpeedGbps
  const aggregateHostBandwidthGbps = totalHostPorts * nicSpeedGbps
  const switchBreakoutFactor = Math.max(
    1,
    Math.floor(REFERENCE_SWITCH_SPEED_GBPS / nicSpeedGbps)
  )
  const usedSwitchPorts = calculateUsedSwitchPorts(
    totalHostPorts,
    switchCount,
    switchBreakoutFactor
  )
  const availableSwitchPorts = switchCount * REFERENCE_SWITCH_PORTS
  const minimumSwitchCount = Math.max(
    1,
    Math.ceil(
      totalHostPorts / (REFERENCE_SWITCH_PORTS * switchBreakoutFactor)
    )
  )
  const switchPortUtilizationPercent =
    availableSwitchPorts > 0
      ? (usedSwitchPorts / availableSwitchPorts) * 100
      : 0
  const hostOpticCount = totalHostPorts
  const switchOpticCount = usedSwitchPorts
  const driveBreakdown: DriveBreakdownItem[] = model.server.driveAllocations.flatMap(
    (allocation) => {
      const drive = model.drives.find((candidate) => candidate.id === allocation.driveId)
      if (!drive) return []

      const drivesPerServer = Math.round(positive(allocation.count))
      const totalDrives = serverCount * drivesPerServer
      const unitCost = positive(drive.capacityTB) * positive(drive.costPerTB)

      return [
        {
          drive,
          drivesPerServer,
          totalDrives,
          rawCapacityTB: totalDrives * positive(drive.capacityTB),
          unitCost,
          acquisitionCost: totalDrives * unitCost,
        },
      ]
    }
  )
  const drivesPerServer = driveBreakdown.reduce(
    (total, item) => total + item.drivesPerServer,
    0
  )
  const totalDrives = driveBreakdown.reduce((total, item) => total + item.totalDrives, 0)
  const totalCores =
    serverCount * positive(model.server.sockets, 1) * positive(model.server.coresPerSocket)
  const rawCapacityTB = driveBreakdown.reduce(
    (total, item) => total + item.rawCapacityTB,
    0
  )
  const rawCapacityPerServerTB = rawCapacityTB / serverCount
  const rawMediaCostPerServer = driveBreakdown.reduce(
    (total, item) => total + item.drivesPerServer * item.unitCost,
    0
  )
  const weightedAfrPercent = drivesPerServer
    ? driveBreakdown.reduce(
        (total, item) => total + item.drivesPerServer * positive(item.drive.afrPercent),
        0
      ) / drivesPerServer
    : 0
  const utilization = positive(model.workload.capacityUtilizationPercent) / 100
  const protectionLayout = getProtectionLayout(
    model.workload.protectionScheme,
    model.workload.dataShards,
    model.workload.parityShards
  )
  const protection = protectionLayout.protectionFactor
  const dataReduction = positive(model.workload.dataReductionRatio, 0.01)
  const protectedCapacityTB = rawCapacityTB / protection
  const dataReducedCapacityTB = protectedCapacityTB * dataReduction
  const utilizedCapacityTB = dataReducedCapacityTB * utilization
  const effectiveCapacityTB = utilizedCapacityTB

  const totalRackUnits =
    serverCount * positive(model.server.rackUnits) +
    switchCount * positive(model.cluster.switchRackUnits)
  const rackCount = Math.max(
    1,
    Math.ceil(totalRackUnits / positive(model.cluster.rackCapacityRU, 1))
  )

  const dutyCycle = Math.min(positive(model.workload.activeDutyCyclePercent) / 100, 1)
  const averageDrivePowerPerServerWatts = driveBreakdown.reduce(
    (total, item) =>
      total +
      item.drivesPerServer *
        (positive(item.drive.activeWatts) * dutyCycle +
          positive(item.drive.idleWatts) * (1 - dutyCycle)),
    0
  )
  const peakDrivePowerPerServerWatts = driveBreakdown.reduce(
    (total, item) =>
      total + item.drivesPerServer * positive(item.drive.activeWatts),
    0
  )
  const averageItPowerWatts =
    serverCount *
      (averageDrivePowerPerServerWatts +
        positive(model.server.basePowerWatts) +
        positive(model.cluster.networkOverheadWattsPerServer)) +
    switchCount * positive(model.cluster.switchPowerWatts)
  const peakItPowerWatts =
    serverCount *
      (peakDrivePowerPerServerWatts +
        positive(model.server.basePowerWatts) +
        positive(model.cluster.networkOverheadWattsPerServer)) +
    switchCount * positive(model.cluster.switchPowerWatts)
  const provisionedPowerKw = peakItPowerWatts / 1000
  const annualEnergyKwh =
    (averageItPowerWatts / 1000) * 8760 * positive(model.opex.pue, 1)

  const driveCapex = driveBreakdown.reduce(
    (total, item) => total + item.acquisitionCost,
    0
  )
  const serverCapex = serverCount * positive(model.server.unitCost)
  const switchHardwareCost =
    switchCount *
    REFERENCE_SWITCH_PORTS *
    positive(model.cluster.switchCostPerPort)
  const hostOpticsTotal = hostOpticCount * positive(model.cluster.hostOpticCost)
  const switchOpticsTotal =
    switchOpticCount * positive(model.cluster.switchOpticCost)
  const networkCapex = switchHardwareCost + hostOpticsTotal + switchOpticsTotal
  const hardwareCapex = driveCapex + serverCapex + networkCapex

  const upfrontSoftware =
    rawCapacityTB * positive(model.software.upfrontPerRawTB) +
    serverCount * positive(model.software.upfrontPerServer)
  const recurringSoftware =
    (totalCores * positive(model.software.monthlyPerCore) +
      rawCapacityTB * positive(model.software.monthlyPerRawTB)) *
    termMonths
  const softwareTotal = upfrontSoftware + recurringSoftware

  const electricityTotal =
    annualEnergyKwh * positive(model.opex.electricityPerKwh) * termYears
  const monthlyColoCost =
    provisionedPowerKw * positive(model.opex.coloPerKwMonth)
  const coloSpaceTotal = monthlyColoCost * termMonths
  const networkOpexTotal =
    positive(model.opex.internetBandwidthGbps) *
    rackCount *
    positive(model.opex.internetPerGbpsMonth) *
    termMonths
  const replacementTotal = driveBreakdown.reduce(
    (total, item) =>
      total +
      item.totalDrives *
        (positive(item.drive.afrPercent) / 100) *
        termYears *
        (item.unitCost + positive(model.opex.driveReplacementLabor)),
    0
  )
  const supportTotal =
    hardwareCapex *
    (positive(model.opex.annualHardwareSupportPercent) / 100) *
    termYears
  const adminTotal = positive(model.opex.annualAdminCost) * termYears
  const operationsTotal =
    electricityTotal +
    coloSpaceTotal +
    networkOpexTotal +
    replacementTotal +
    supportTotal +
    adminTotal
  const tco = hardwareCapex + softwareTotal + operationsTotal
  const effectiveCapacityTermMonths = effectiveCapacityTB * termMonths

  const annualSoftware = recurringSoftware / termYears
  const annualOperations = operationsTotal / termYears
  const annualCosts: AnnualCost[] = [
    {
      period: "Acquire",
      hardware: hardwareCapex,
      software: upfrontSoftware,
      operations: 0,
    },
    ...Array.from({ length: Math.ceil(termYears) }, (_, index) => ({
      period: `Year ${index + 1}`,
      hardware: 0,
      software: annualSoftware,
      operations: annualOperations,
    })),
  ]

  const categories: CostCategory[] = [
    { name: "Hardware", value: hardwareCapex, key: "hardware" },
    { name: "Energy", value: electricityTotal, key: "energy" },
    { name: "Colocation", value: coloSpaceTotal, key: "facilities" },
    { name: "Internet bandwidth", value: networkOpexTotal, key: "network" },
    { name: "Software", value: softwareTotal, key: "software" },
    {
      name: "Support & operations",
      value: replacementTotal + supportTotal + adminTotal,
      key: "operations",
    },
  ]

  return {
    driveBreakdown,
    drivesPerServer,
    totalDrives,
    totalCores,
    hostPortsPerServer,
    totalHostPorts,
    hostBandwidthPerServerGbps,
    aggregateHostBandwidthGbps,
    switchBreakoutFactor,
    usedSwitchPorts,
    availableSwitchPorts,
    minimumSwitchCount,
    switchPortUtilizationPercent,
    hostOpticCount,
    switchOpticCount,
    rawCapacityPerServerTB,
    rawCapacityTB,
    protectedCapacityTB,
    dataReducedCapacityTB,
    utilizedCapacityTB,
    effectiveCapacityTB,
    protectionFactor: protectionLayout.protectionFactor,
    protectionDataShards: protectionLayout.dataShards,
    protectionParityShards: protectionLayout.parityShards,
    rackCount,
    totalRackUnits,
    averageItPowerWatts,
    peakItPowerWatts,
    provisionedPowerKw,
    annualEnergyKwh,
    rawMediaCostPerServer,
    averageDrivePowerPerServerWatts,
    peakDrivePowerPerServerWatts,
    weightedAfrPercent,
    driveCapex,
    serverCapex,
    switchHardwareCost,
    hostOpticsTotal,
    switchOpticsTotal,
    networkCapex,
    hardwareCapex,
    upfrontSoftware,
    recurringSoftware,
    softwareTotal,
    electricityTotal,
    monthlyColoCost,
    coloSpaceTotal,
    networkOpexTotal,
    replacementTotal,
    supportTotal,
    adminTotal,
    operationsTotal,
    tco,
    tcoPerRawTB: rawCapacityTB ? tco / rawCapacityTB : 0,
    tcoPerEffectiveTB: effectiveCapacityTB ? tco / effectiveCapacityTB : 0,
    tcoPerEffectiveTBMonth:
      effectiveCapacityTB && termMonths ? tco / effectiveCapacityTB / termMonths : 0,
    hardwareCapexPerEffectiveTBMonth: effectiveCapacityTermMonths
      ? hardwareCapex / effectiveCapacityTermMonths
      : 0,
    operationsPerEffectiveTBMonth: effectiveCapacityTermMonths
      ? operationsTotal / effectiveCapacityTermMonths
      : 0,
    softwarePerEffectiveTBMonth: effectiveCapacityTermMonths
      ? softwareTotal / effectiveCapacityTermMonths
      : 0,
    capexPercent: tco ? ((hardwareCapex + upfrontSoftware) / tco) * 100 : 0,
    annualizedTco: tco / termYears,
    categories,
    annualCosts,
  }
}

export function formatCurrency(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits,
  }).format(value)
}

export function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatCapacity(tb: number) {
  if (tb >= 1000) {
    return `${(tb / 1000).toFixed(tb >= 10000 ? 1 : 2)} PB`
  }

  return `${tb.toFixed(tb >= 100 ? 0 : 1)} TB`
}

export function formatPower(watts: number) {
  return watts >= 1000 ? `${(watts / 1000).toFixed(1)} kW` : `${watts.toFixed(0)} W`
}
