import {
  getProtectionLayout,
  type FailureDomain,
  type ProtectionScheme,
} from "@/lib/durability"

export type SectionId =
  "drive" | "server" | "cluster" | "software" | "workload" | "opex" | "summary"

export type DriveMedium = "HDD" | "NVMe SSD"

export type DriveConfig = {
  id: string
  name: string
  medium: DriveMedium
  interface: string
  capacityTB: number
  activeWatts: number
  idleWatts: number
  afrPercent: number
  costPerTB: number
}

export type DrivePreset = Omit<DriveConfig, "id"> & {
  presetKey: string
  summary: string
}

export const NVME_CAPACITY_STEPS = [
  0.96, 1.92, 3.84, 7.68, 15.36, 30.72, 61.44, 122.88, 245.76,
]
export const HDD_CAPACITY_STEPS = [
  4, 8, 12, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36,
]

export const DRIVE_INTERFACES: Record<DriveMedium, string[]> = {
  "NVMe SSD": ["PCIe Gen5", "PCIe Gen4", "NVMe-oF"],
  HDD: ["SATA 6G", "SAS 12G", "SAS 24G (Dual-Actuator)"],
}

export const DRIVE_PRESETS: DrivePreset[] = [
  {
    presetKey: "tlc-nvme-15",
    name: "15.36 TB NVMe",
    medium: "NVMe SSD",
    interface: "PCIe Gen5",
    capacityTB: 15.36,
    activeWatts: 15,
    idleWatts: 3,
    afrPercent: 0.44,
    costPerTB: 350,
    summary: "Enterprise TLC PCIe Gen5 NVMe SSD (Rev 1 baseline)",
  },
  {
    presetKey: "qlc-nvme-61",
    name: "61.44 TB QLC NVMe",
    medium: "NVMe SSD",
    interface: "PCIe Gen5",
    capacityTB: 61.44,
    activeWatts: 18,
    idleWatts: 4,
    afrPercent: 0.5,
    costPerTB: 160,
    summary: "High-density read-intensive QLC PCIe Gen5 SSD",
  },
  {
    presetKey: "qlc-nvme-122",
    name: "122.88 TB QLC NVMe",
    medium: "NVMe SSD",
    interface: "PCIe Gen5",
    capacityTB: 122.88,
    activeWatts: 22,
    idleWatts: 4.5,
    afrPercent: 0.55,
    costPerTB: 145,
    summary: "Ultra-dense 122.88 TB QLC NVMe flash media",
  },
  {
    presetKey: "hdd-sata-24",
    name: "24 TB Nearline HDD",
    medium: "HDD",
    interface: "SATA 6G",
    capacityTB: 24,
    activeWatts: 9.5,
    idleWatts: 5.5,
    afrPercent: 0.95,
    costPerTB: 18,
    summary: "7.2K RPM CMR Helium Nearline SATA 6G hard drive",
  },
  {
    presetKey: "hdd-sas-30",
    name: "30 TB HAMR HDD",
    medium: "HDD",
    interface: "SAS 12G",
    capacityTB: 30,
    activeWatts: 10,
    idleWatts: 6,
    afrPercent: 1.0,
    costPerTB: 20,
    summary: "High-capacity 30 TB HAMR enterprise SAS 12G hard drive",
  },
  {
    presetKey: "hdd-dual-28",
    name: "28 TB Dual-Actuator HDD",
    medium: "HDD",
    interface: "SAS 24G (Dual-Actuator)",
    capacityTB: 28,
    activeWatts: 11.5,
    idleWatts: 6.5,
    afrPercent: 1.05,
    costPerTB: 24,
    summary: "2× IOPS dual-actuator SAS 24G nearline hard drive",
  },
]

export type DriveAllocation = {
  driveId: string
  count: number
}

export type NicSpeedGbps = 100 | 200 | 400 | 800
export type SwitchSpeedGbps = 400 | 800
export type SwitchPortCount = 32 | 64
export type CableType = "optics" | "aoc" | "dac"

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
  switchPorts?: SwitchPortCount
  switchSpeedGbps?: SwitchSpeedGbps
  cableType?: CableType
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
  failureDomain?: FailureDomain
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
  discountRatePercent?: number
  residualValuePercent?: number
}

export type TcoModel = {
  drives: DriveConfig[]
  server: ServerConfig
  cluster: ClusterConfig
  software: SoftwareConfig
  workload: WorkloadConfig
  opex: OpexConfig
}

export type SavedScenario = {
  id: string
  name: string
  description: string
  isPreset?: boolean
  updatedAt: string
  model: TcoModel
}

export type CostCategory = {
  name: string
  value: number
  key:
    "hardware" | "energy" | "facilities" | "network" | "software" | "operations"
}

export type AnnualCost = {
  period: string
  yearIndex: number
  hardware: number
  software: number
  operations: number
  residualCredit: number
  total: number
  discountedTotal: number
  cumulativeTotal: number
  cumulativeDiscountedTotal: number
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
  nvmeDriveCount: number
  hddDriveCount: number
  nvmeRawCapacityTB: number
  hddRawCapacityTB: number
  nvmeCapex: number
  hddCapex: number
  totalCores: number
  hostPortsPerServer: number
  totalHostPorts: number
  hostBandwidthPerServerGbps: number
  aggregateHostBandwidthGbps: number
  switchPortsPerSwitch: number
  switchSpeedGbps: number
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
  residualValueCredit: number
  netHardwareCapex: number
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
  netTco: number
  npvTco: number
  tcoPerRawTB: number
  tcoPerEffectiveTB: number
  tcoPerEffectiveTBMonth: number
  npvPerEffectiveTBMonth: number
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
    description:
      "Define NVMe SSD and hard drive (HDD) profiles, capacities, power, reliability, and acquisition cost.",
  },
  server: {
    label: "Server config",
    eyebrow: "02 / Node design",
    description:
      "Compose a storage node from configured NVMe/HDD media, compute and memory, plus a clear physical NIC topology.",
  },
  cluster: {
    label: "Cluster config",
    eyebrow: "03 / Scale out",
    description:
      "Set the node count, rack envelope, and switch fabric and optics/cabling economics for the deployment.",
  },
  software: {
    label: "Software & license",
    eyebrow: "04 / Platform economics",
    description:
      "Model upfront and recurring licenses against raw capacity, servers, and physical cores.",
  },
  workload: {
    label: "Workload & data reduction",
    eyebrow: "05 / Effective capacity",
    description:
      "Translate raw media into protected, usable, workload-adjusted capacity with fleet and failure-domain durability.",
  },
  opex: {
    label: "OpEx config",
    eyebrow: "06 / Run the fleet",
    description:
      "Model peak-power colocation, PUE-adjusted energy, Internet bandwidth, fleet operations, and NPV discount rates.",
  },
  summary: {
    label: "TCO summary",
    eyebrow: "07 / Decision view",
    description:
      "See the complete deployment cost, cash-flow timeline, and scenario comparisons normalized to effective capacity and time.",
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
    switchPorts: 64,
    switchSpeedGbps: 800,
    cableType: "optics",
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
    failureDomain: "drive",
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
    discountRatePercent: 0,
    residualValuePercent: 0,
  },
}

export const REFERENCE_SCENARIOS: SavedScenario[] = [
  {
    id: "preset-rev1-nvme",
    name: "Rev 1 Baseline (15.36 TB NVMe)",
    description:
      "12 × 2U servers with 24 × 15.36 TB TLC NVMe, RAID 6 (8+2), 1.5× reduction",
    isPreset: true,
    updatedAt: "2026-01-01T00:00:00.000Z",
    model: structuredClone(DEFAULT_MODEL),
  },
  {
    id: "preset-qlc-61tb",
    name: "Ultra-Dense QLC (61.44 TB NVMe)",
    description:
      "8 × 2U servers with 24 × 61.44 TB QLC NVMe, Erasure Code 6+2, 1.5× reduction",
    isPreset: true,
    updatedAt: "2026-01-01T00:00:00.000Z",
    model: {
      ...structuredClone(DEFAULT_MODEL),
      drives: [
        {
          id: "qlc-61-44-preset",
          name: "61.44 TB QLC NVMe",
          medium: "NVMe SSD",
          interface: "PCIe Gen5",
          capacityTB: 61.44,
          activeWatts: 18,
          idleWatts: 4,
          afrPercent: 0.5,
          costPerTB: 160,
        },
      ],
      server: {
        ...structuredClone(DEFAULT_MODEL.server),
        name: "Dense QLC flash node",
        driveAllocations: [{ driveId: "qlc-61-44-preset", count: 24 }],
      },
      cluster: {
        ...structuredClone(DEFAULT_MODEL.cluster),
        serverCount: 8,
      },
      workload: {
        ...structuredClone(DEFAULT_MODEL.workload),
        protectionScheme: "erasure",
        dataShards: 6,
        parityShards: 2,
        rebuildTimeHours: 36,
      },
    },
  },
  {
    id: "preset-nearline-hdd-24tb",
    name: "Nearline HDD Archive (24 TB HDD)",
    description:
      "12 × 4U 60-bay servers with 24 TB SATA Nearline HDDs, Erasure Code 8+3, 1.2× reduction",
    isPreset: true,
    updatedAt: "2026-01-01T00:00:00.000Z",
    model: {
      ...structuredClone(DEFAULT_MODEL),
      drives: [
        {
          id: "hdd-24tb-preset",
          name: "24 TB Nearline HDD",
          medium: "HDD",
          interface: "SATA 6G",
          capacityTB: 24,
          activeWatts: 9.5,
          idleWatts: 5.5,
          afrPercent: 0.95,
          costPerTB: 18,
        },
      ],
      server: {
        ...structuredClone(DEFAULT_MODEL.server),
        name: "High-density 4U HDD server",
        driveAllocations: [{ driveId: "hdd-24tb-preset", count: 60 }],
        rackUnits: 4,
        basePowerWatts: 550,
        nicCount: 1,
        portsPerNic: 2,
        nicSpeedGbps: 100,
        unitCost: 28000,
      },
      cluster: {
        ...structuredClone(DEFAULT_MODEL.cluster),
        serverCount: 12,
        networkOverheadWattsPerServer: 40,
      },
      software: {
        ...structuredClone(DEFAULT_MODEL.software),
        monthlyPerRawTB: 1.5,
      },
      workload: {
        ...structuredClone(DEFAULT_MODEL.workload),
        protectionScheme: "erasure",
        dataShards: 8,
        parityShards: 3,
        rebuildTimeHours: 96,
        dataReductionRatio: 1.2,
      },
    },
  },
  {
    id: "preset-hybrid-nvme-hdd",
    name: "Hybrid Tiered (NVMe + 24 TB HDD)",
    description:
      "12 × 4U servers mixing 8 × 15.36 TB NVMe cache/metadata with 36 × 24 TB Nearline HDDs",
    isPreset: true,
    updatedAt: "2026-01-01T00:00:00.000Z",
    model: {
      ...structuredClone(DEFAULT_MODEL),
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
        {
          id: "hdd-24tb-hybrid",
          name: "24 TB Nearline HDD",
          medium: "HDD",
          interface: "SATA 6G",
          capacityTB: 24,
          activeWatts: 9.5,
          idleWatts: 5.5,
          afrPercent: 0.95,
          costPerTB: 18,
        },
      ],
      server: {
        ...structuredClone(DEFAULT_MODEL.server),
        name: "Hybrid 4U storage server",
        driveAllocations: [
          { driveId: DEFAULT_DRIVE_ID, count: 8 },
          { driveId: "hdd-24tb-hybrid", count: 36 },
        ],
        rackUnits: 4,
        basePowerWatts: 600,
        nicCount: 1,
        portsPerNic: 2,
        nicSpeedGbps: 200,
        unitCost: 32000,
      },
      cluster: {
        ...structuredClone(DEFAULT_MODEL.cluster),
        serverCount: 12,
      },
      software: {
        ...structuredClone(DEFAULT_MODEL.software),
        monthlyPerRawTB: 2,
      },
      workload: {
        ...structuredClone(DEFAULT_MODEL.workload),
        protectionScheme: "erasure",
        dataShards: 8,
        parityShards: 2,
        rebuildTimeHours: 72,
        dataReductionRatio: 1.4,
      },
    },
  },
]

const positive = (value: number, fallback = 0) =>
  Number.isFinite(value) ? Math.max(value, fallback) : fallback

const finiteOr = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback

export function sanitizeModel(input: unknown): TcoModel {
  const base = structuredClone(DEFAULT_MODEL)
  if (!input || typeof input !== "object") {
    return base
  }

  const raw = input as Partial<Record<keyof TcoModel, unknown>>

  const drives: DriveConfig[] = Array.isArray(raw.drives)
    ? raw.drives.flatMap((item, index) => {
        if (!item || typeof item !== "object") return []
        const candidate = item as Partial<DriveConfig>
        const medium: DriveMedium =
          candidate.medium === "HDD" ? "HDD" : "NVMe SSD"
        const defaultCapacity = medium === "HDD" ? 24 : 15.36
        return [
          {
            id:
              typeof candidate.id === "string" && candidate.id.trim()
                ? candidate.id
                : `drive-${index + 1}`,
            name:
              typeof candidate.name === "string" && candidate.name.trim()
                ? candidate.name
                : `${defaultCapacity} TB ${medium}`,
            medium,
            interface:
              typeof candidate.interface === "string" &&
              candidate.interface.trim()
                ? candidate.interface
                : medium === "HDD"
                  ? "SATA 6G"
                  : "PCIe Gen5",
            capacityTB: positive(
              finiteOr(candidate.capacityTB, defaultCapacity),
              0.1
            ),
            activeWatts: positive(finiteOr(candidate.activeWatts, 15), 0),
            idleWatts: positive(finiteOr(candidate.idleWatts, 3), 0),
            afrPercent: positive(finiteOr(candidate.afrPercent, 0.44), 0),
            costPerTB: positive(finiteOr(candidate.costPerTB, 350), 0),
          },
        ]
      })
    : base.drives

  const rawServer =
    raw.server && typeof raw.server === "object"
      ? (raw.server as Partial<ServerConfig>)
      : {}
  const driveAllocations: DriveAllocation[] = Array.isArray(
    rawServer.driveAllocations
  )
    ? rawServer.driveAllocations.flatMap((item) => {
        if (!item || typeof item !== "object") return []
        const candidate = item as Partial<DriveAllocation>
        if (typeof candidate.driveId !== "string") return []
        return [
          {
            driveId: candidate.driveId,
            count: Math.max(
              1,
              Math.round(positive(finiteOr(candidate.count, 1), 1))
            ),
          },
        ]
      })
    : base.server.driveAllocations

  const nicSpeedCandidate = finiteOr(
    rawServer.nicSpeedGbps,
    base.server.nicSpeedGbps
  )
  const nicSpeedGbps: NicSpeedGbps = [100, 200, 400, 800].includes(
    nicSpeedCandidate
  )
    ? (nicSpeedCandidate as NicSpeedGbps)
    : base.server.nicSpeedGbps

  const rawCluster =
    raw.cluster && typeof raw.cluster === "object"
      ? (raw.cluster as Partial<ClusterConfig>)
      : {}
  const switchPortsCandidate = finiteOr(
    rawCluster.switchPorts,
    REFERENCE_SWITCH_PORTS
  )
  const switchPorts: SwitchPortCount = switchPortsCandidate === 32 ? 32 : 64
  const switchSpeedCandidate = finiteOr(
    rawCluster.switchSpeedGbps,
    REFERENCE_SWITCH_SPEED_GBPS
  )
  const switchSpeedGbps: SwitchSpeedGbps =
    switchSpeedCandidate === 400 ? 400 : 800
  const cableType: CableType =
    rawCluster.cableType === "dac" || rawCluster.cableType === "aoc"
      ? rawCluster.cableType
      : "optics"

  const rawSoftware =
    raw.software && typeof raw.software === "object"
      ? (raw.software as Partial<SoftwareConfig>)
      : {}

  const rawWorkload =
    raw.workload && typeof raw.workload === "object"
      ? (raw.workload as Partial<WorkloadConfig>)
      : {}
  const protectionScheme: ProtectionScheme =
    rawWorkload.protectionScheme === "mirror" ||
    rawWorkload.protectionScheme === "raid5" ||
    rawWorkload.protectionScheme === "raid6" ||
    rawWorkload.protectionScheme === "erasure"
      ? rawWorkload.protectionScheme
      : base.workload.protectionScheme
  const failureDomain: FailureDomain =
    rawWorkload.failureDomain === "server" ? "server" : "drive"

  const rawOpex =
    raw.opex && typeof raw.opex === "object"
      ? (raw.opex as Partial<OpexConfig>)
      : {}

  return {
    drives,
    server: {
      name:
        typeof rawServer.name === "string" && rawServer.name.trim()
          ? rawServer.name
          : base.server.name,
      driveAllocations,
      cpuModel:
        typeof rawServer.cpuModel === "string"
          ? rawServer.cpuModel
          : base.server.cpuModel,
      sockets: Math.max(
        1,
        Math.round(
          positive(finiteOr(rawServer.sockets, base.server.sockets), 1)
        )
      ),
      coresPerSocket: Math.max(
        1,
        Math.round(
          positive(
            finiteOr(rawServer.coresPerSocket, base.server.coresPerSocket),
            1
          )
        )
      ),
      dramGB: positive(finiteOr(rawServer.dramGB, base.server.dramGB), 1),
      rackUnits: Math.max(
        1,
        Math.round(
          positive(finiteOr(rawServer.rackUnits, base.server.rackUnits), 1)
        )
      ),
      basePowerWatts: positive(
        finiteOr(rawServer.basePowerWatts, base.server.basePowerWatts),
        0
      ),
      nicCount: Math.max(
        1,
        Math.round(
          positive(finiteOr(rawServer.nicCount, base.server.nicCount), 1)
        )
      ),
      nicSpeedGbps,
      portsPerNic: Math.max(
        1,
        Math.round(
          positive(finiteOr(rawServer.portsPerNic, base.server.portsPerNic), 1)
        )
      ),
      unitCost: positive(finiteOr(rawServer.unitCost, base.server.unitCost), 0),
    },
    cluster: {
      serverCount: Math.max(
        1,
        Math.round(
          positive(
            finiteOr(rawCluster.serverCount, base.cluster.serverCount),
            1
          )
        )
      ),
      rackCapacityRU: Math.max(
        1,
        Math.round(
          positive(
            finiteOr(rawCluster.rackCapacityRU, base.cluster.rackCapacityRU),
            1
          )
        )
      ),
      networkOverheadWattsPerServer: positive(
        finiteOr(
          rawCluster.networkOverheadWattsPerServer,
          base.cluster.networkOverheadWattsPerServer
        ),
        0
      ),
      switchCount: Math.max(
        1,
        Math.round(
          positive(
            finiteOr(rawCluster.switchCount, base.cluster.switchCount),
            1
          )
        )
      ),
      switchPorts,
      switchSpeedGbps,
      cableType,
      switchCostPerPort: positive(
        finiteOr(rawCluster.switchCostPerPort, base.cluster.switchCostPerPort),
        0
      ),
      hostOpticCost: positive(
        finiteOr(rawCluster.hostOpticCost, base.cluster.hostOpticCost),
        0
      ),
      switchOpticCost: positive(
        finiteOr(rawCluster.switchOpticCost, base.cluster.switchOpticCost),
        0
      ),
      switchPowerWatts: positive(
        finiteOr(rawCluster.switchPowerWatts, base.cluster.switchPowerWatts),
        0
      ),
      switchRackUnits: Math.max(
        1,
        Math.round(
          positive(
            finiteOr(rawCluster.switchRackUnits, base.cluster.switchRackUnits),
            1
          )
        )
      ),
    },
    software: {
      upfrontPerRawTB: positive(
        finiteOr(rawSoftware.upfrontPerRawTB, base.software.upfrontPerRawTB),
        0
      ),
      upfrontPerServer: positive(
        finiteOr(rawSoftware.upfrontPerServer, base.software.upfrontPerServer),
        0
      ),
      monthlyPerCore: positive(
        finiteOr(rawSoftware.monthlyPerCore, base.software.monthlyPerCore),
        0
      ),
      monthlyPerRawTB: positive(
        finiteOr(rawSoftware.monthlyPerRawTB, base.software.monthlyPerRawTB),
        0
      ),
    },
    workload: {
      termYears: Math.max(
        1,
        Math.round(
          positive(finiteOr(rawWorkload.termYears, base.workload.termYears), 1)
        )
      ),
      protectionScheme,
      dataShards: Math.max(
        1,
        Math.round(
          positive(
            finiteOr(rawWorkload.dataShards, base.workload.dataShards),
            1
          )
        )
      ),
      parityShards: Math.max(
        1,
        Math.round(
          positive(
            finiteOr(rawWorkload.parityShards, base.workload.parityShards),
            1
          )
        )
      ),
      rebuildTimeHours: Math.max(
        1,
        Math.round(
          positive(
            finiteOr(
              rawWorkload.rebuildTimeHours,
              base.workload.rebuildTimeHours
            ),
            1
          )
        )
      ),
      capacityUtilizationPercent: Math.min(
        100,
        positive(
          finiteOr(
            rawWorkload.capacityUtilizationPercent,
            base.workload.capacityUtilizationPercent
          ),
          1
        )
      ),
      activeDutyCyclePercent: Math.min(
        100,
        positive(
          finiteOr(
            rawWorkload.activeDutyCyclePercent,
            base.workload.activeDutyCyclePercent
          ),
          0
        )
      ),
      dataReductionRatio: positive(
        finiteOr(
          rawWorkload.dataReductionRatio,
          base.workload.dataReductionRatio
        ),
        0.1
      ),
      failureDomain,
    },
    opex: {
      electricityPerKwh: positive(
        finiteOr(rawOpex.electricityPerKwh, base.opex.electricityPerKwh),
        0
      ),
      pue: positive(finiteOr(rawOpex.pue, base.opex.pue), 1),
      coloPerKwMonth: positive(
        finiteOr(rawOpex.coloPerKwMonth, base.opex.coloPerKwMonth),
        0
      ),
      internetBandwidthGbps: positive(
        finiteOr(
          rawOpex.internetBandwidthGbps,
          base.opex.internetBandwidthGbps
        ),
        0
      ),
      internetPerGbpsMonth: positive(
        finiteOr(rawOpex.internetPerGbpsMonth, base.opex.internetPerGbpsMonth),
        0
      ),
      annualAdminCost: positive(
        finiteOr(rawOpex.annualAdminCost, base.opex.annualAdminCost),
        0
      ),
      annualHardwareSupportPercent: positive(
        finiteOr(
          rawOpex.annualHardwareSupportPercent,
          base.opex.annualHardwareSupportPercent
        ),
        0
      ),
      driveReplacementLabor: positive(
        finiteOr(
          rawOpex.driveReplacementLabor,
          base.opex.driveReplacementLabor
        ),
        0
      ),
      discountRatePercent: Math.min(
        30,
        positive(finiteOr(rawOpex.discountRatePercent, 0), 0)
      ),
      residualValuePercent: Math.min(
        50,
        positive(finiteOr(rawOpex.residualValuePercent, 0), 0)
      ),
    },
  }
}

export function encodeModelToUrlParam(model: TcoModel): string {
  const json = JSON.stringify(model)
  const bytes = new TextEncoder().encode(json)
  let binary = ""
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export function decodeModelFromUrlParam(encoded: string): TcoModel | null {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    )
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    const json = new TextDecoder().decode(bytes)
    return sanitizeModel(JSON.parse(json))
  } catch {
    return null
  }
}

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
  const switchPortsPerSwitch =
    model.cluster.switchPorts === 32 ? 32 : REFERENCE_SWITCH_PORTS
  const switchSpeedGbps =
    model.cluster.switchSpeedGbps === 400 ? 400 : REFERENCE_SWITCH_SPEED_GBPS
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
    Math.floor(switchSpeedGbps / nicSpeedGbps)
  )
  const usedSwitchPorts = calculateUsedSwitchPorts(
    totalHostPorts,
    switchCount,
    switchBreakoutFactor
  )
  const availableSwitchPorts = switchCount * switchPortsPerSwitch
  const minimumSwitchCount = Math.max(
    1,
    Math.ceil(totalHostPorts / (switchPortsPerSwitch * switchBreakoutFactor))
  )
  const switchPortUtilizationPercent =
    availableSwitchPorts > 0
      ? (usedSwitchPorts / availableSwitchPorts) * 100
      : 0
  const hostOpticCount = totalHostPorts
  const switchOpticCount = usedSwitchPorts
  const driveBreakdown: DriveBreakdownItem[] =
    model.server.driveAllocations.flatMap((allocation) => {
      const drive = model.drives.find(
        (candidate) => candidate.id === allocation.driveId
      )
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
    })
  const drivesPerServer = driveBreakdown.reduce(
    (total, item) => total + item.drivesPerServer,
    0
  )
  const totalDrives = driveBreakdown.reduce(
    (total, item) => total + item.totalDrives,
    0
  )
  const nvmeItems = driveBreakdown.filter(
    (item) => item.drive.medium === "NVMe SSD"
  )
  const hddItems = driveBreakdown.filter((item) => item.drive.medium === "HDD")
  const nvmeDriveCount = nvmeItems.reduce(
    (total, item) => total + item.totalDrives,
    0
  )
  const hddDriveCount = hddItems.reduce(
    (total, item) => total + item.totalDrives,
    0
  )
  const nvmeRawCapacityTB = nvmeItems.reduce(
    (total, item) => total + item.rawCapacityTB,
    0
  )
  const hddRawCapacityTB = hddItems.reduce(
    (total, item) => total + item.rawCapacityTB,
    0
  )
  const nvmeCapex = nvmeItems.reduce(
    (total, item) => total + item.acquisitionCost,
    0
  )
  const hddCapex = hddItems.reduce(
    (total, item) => total + item.acquisitionCost,
    0
  )

  const totalCores =
    serverCount *
    positive(model.server.sockets, 1) *
    positive(model.server.coresPerSocket)
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
        (total, item) =>
          total + item.drivesPerServer * positive(item.drive.afrPercent),
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

  const dutyCycle = Math.min(
    positive(model.workload.activeDutyCyclePercent) / 100,
    1
  )
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
    switchPortsPerSwitch *
    positive(model.cluster.switchCostPerPort)
  const hostOpticsTotal = hostOpticCount * positive(model.cluster.hostOpticCost)
  const switchOpticsTotal =
    switchOpticCount * positive(model.cluster.switchOpticCost)
  const networkCapex = switchHardwareCost + hostOpticsTotal + switchOpticsTotal
  const hardwareCapex = driveCapex + serverCapex + networkCapex

  const residualValuePercent = Math.min(
    50,
    positive(model.opex.residualValuePercent ?? 0, 0)
  )
  const residualValueCredit = hardwareCapex * (residualValuePercent / 100)
  const netHardwareCapex = Math.max(0, hardwareCapex - residualValueCredit)

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
  const netTco = netHardwareCapex + softwareTotal + operationsTotal
  const effectiveCapacityTermMonths = effectiveCapacityTB * termMonths

  const discountRate =
    Math.min(30, positive(model.opex.discountRatePercent ?? 0, 0)) / 100
  const annualSoftware = recurringSoftware / termYears
  const annualOperations = operationsTotal / termYears
  const totalYears = Math.ceil(termYears)

  let cumulativeTotal = hardwareCapex + upfrontSoftware
  let cumulativeDiscountedTotal = hardwareCapex + upfrontSoftware

  const annualCosts: AnnualCost[] = [
    {
      period: "Acquire",
      yearIndex: 0,
      hardware: hardwareCapex,
      software: upfrontSoftware,
      operations: 0,
      residualCredit: 0,
      total: hardwareCapex + upfrontSoftware,
      discountedTotal: hardwareCapex + upfrontSoftware,
      cumulativeTotal,
      cumulativeDiscountedTotal,
    },
    ...Array.from({ length: totalYears }, (_, index) => {
      const yearNumber = index + 1
      const isFinalYear = yearNumber === totalYears
      const residualCredit = isFinalYear ? residualValueCredit : 0
      const periodTotal = annualSoftware + annualOperations - residualCredit
      const discountFactor = Math.pow(1 + discountRate, yearNumber)
      const discountedTotal = periodTotal / discountFactor
      cumulativeTotal += periodTotal
      cumulativeDiscountedTotal += discountedTotal

      return {
        period: `Year ${yearNumber}`,
        yearIndex: yearNumber,
        hardware: 0,
        software: annualSoftware,
        operations: annualOperations,
        residualCredit,
        total: periodTotal,
        discountedTotal,
        cumulativeTotal,
        cumulativeDiscountedTotal,
      }
    }),
  ]

  const npvTco = cumulativeDiscountedTotal

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
    nvmeDriveCount,
    hddDriveCount,
    nvmeRawCapacityTB,
    hddRawCapacityTB,
    nvmeCapex,
    hddCapex,
    totalCores,
    hostPortsPerServer,
    totalHostPorts,
    hostBandwidthPerServerGbps,
    aggregateHostBandwidthGbps,
    switchPortsPerSwitch,
    switchSpeedGbps,
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
    residualValueCredit,
    netHardwareCapex,
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
    netTco,
    npvTco,
    tcoPerRawTB: rawCapacityTB ? tco / rawCapacityTB : 0,
    tcoPerEffectiveTB: effectiveCapacityTB ? tco / effectiveCapacityTB : 0,
    tcoPerEffectiveTBMonth:
      effectiveCapacityTB && termMonths
        ? tco / effectiveCapacityTB / termMonths
        : 0,
    npvPerEffectiveTBMonth: effectiveCapacityTermMonths
      ? npvTco / effectiveCapacityTermMonths
      : 0,
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
  return watts >= 1000
    ? `${(watts / 1000).toFixed(1)} kW`
    : `${watts.toFixed(0)} W`
}
