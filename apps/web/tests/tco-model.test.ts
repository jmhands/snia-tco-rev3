import { describe, expect, it } from "bun:test"

import {
  calculateDurability,
  formatDurabilityPercentage,
  getProtectionLayout,
} from "../src/lib/durability"
import {
  DEFAULT_MODEL,
  REFERENCE_SCENARIOS,
  calculateTco,
  decodeModelFromUrlParam,
  encodeModelToUrlParam,
  sanitizeModel,
} from "../src/lib/tco-model"

describe("SNIA TCO Model & Durability Engine", () => {
  it("calculates the exact Rev 1 baseline TCO and capacity bridge", () => {
    const results = calculateTco(DEFAULT_MODEL)

    // 12 servers * 24 drives * 15.36 TB = 4423.68 TB raw
    expect(results.totalDrives).toBe(288)
    expect(results.nvmeDriveCount).toBe(288)
    expect(results.hddDriveCount).toBe(0)
    expect(results.rawCapacityTB).toBeCloseTo(4423.68, 2)

    // RAID 6 (8+2) -> protection factor 1.25 -> 3538.944 TB protected
    expect(results.protectionFactor).toBeCloseTo(1.25, 4)
    expect(results.protectedCapacityTB).toBeCloseTo(3538.944, 3)

    // 1.5x reduction -> 5308.416 TBe; 90% utilization -> 4777.5744 TBe
    expect(results.dataReducedCapacityTB).toBeCloseTo(5308.416, 3)
    expect(results.effectiveCapacityTB).toBeCloseTo(4777.5744, 3)

    // 800G switch breakout for 12 * 4 = 48 host 200G ports (4:1 breakout -> 12 switch ports across 2 switches)
    expect(results.totalHostPorts).toBe(48)
    expect(results.switchBreakoutFactor).toBe(4)
    expect(results.usedSwitchPorts).toBe(12)
    expect(results.availableSwitchPorts).toBe(128)

    // Nominal TCO equals NPV TCO when discount rate and residual value are 0%
    expect(results.npvTco).toBeCloseTo(results.tco, 2)
    expect(results.annualCosts).toHaveLength(6) // Acquire + Years 1..5
  })

  it("models Nearline Hard Drives (HDD) and hybrid NVMe + HDD configurations accurately", () => {
    const hddScenario = REFERENCE_SCENARIOS.find(
      (s) => s.id === "preset-nearline-hdd-24tb"
    )!
    const hddResults = calculateTco(hddScenario.model)

    expect(hddResults.hddDriveCount).toBe(720) // 12 servers * 60 drives
    expect(hddResults.nvmeDriveCount).toBe(0)
    expect(hddResults.rawCapacityTB).toBe(17280) // 720 * 24 TB
    expect(hddResults.hddCapex).toBe(17280 * 18)

    const hybridScenario = REFERENCE_SCENARIOS.find(
      (s) => s.id === "preset-hybrid-nvme-hdd"
    )!
    const hybridResults = calculateTco(hybridScenario.model)

    expect(hybridResults.nvmeDriveCount).toBe(96) // 12 * 8
    expect(hybridResults.hddDriveCount).toBe(432) // 12 * 36
    expect(hybridResults.totalDrives).toBe(528)
    expect(hybridResults.rawCapacityTB).toBeCloseTo(
      hybridResults.nvmeRawCapacityTB + hybridResults.hddRawCapacityTB,
      4
    )
  })

  it("applies NPV discount rate (WACC) and hardware residual value credit", () => {
    const discountedModel = sanitizeModel({
      ...structuredClone(DEFAULT_MODEL),
      opex: {
        ...DEFAULT_MODEL.opex,
        discountRatePercent: 8,
        residualValuePercent: 10,
      },
    })
    const results = calculateTco(discountedModel)

    expect(results.residualValueCredit).toBeCloseTo(
      results.hardwareCapex * 0.1,
      2
    )
    expect(results.netHardwareCapex).toBeCloseTo(results.hardwareCapex * 0.9, 2)
    expect(results.npvTco).toBeLessThan(results.tco)
    expect(results.npvPerEffectiveTBMonth).toBeLessThan(
      results.tcoPerEffectiveTBMonth
    )
  })

  it("sanitizes malformed or partial models safely and round-trips URL encoding", () => {
    const fallback = sanitizeModel(null)
    expect(fallback.cluster.serverCount).toBe(DEFAULT_MODEL.cluster.serverCount)

    const partial = sanitizeModel({
      drives: [{ medium: "HDD", capacityTB: 30, costPerTB: 20 }],
      cluster: { serverCount: -5, switchPorts: 32, switchSpeedGbps: 400 },
    })
    expect(partial.drives[0]?.medium).toBe("HDD")
    expect(partial.cluster.serverCount).toBe(1)
    expect(partial.cluster.switchPorts).toBe(32)
    expect(partial.cluster.switchSpeedGbps).toBe(400)

    const encoded = encodeModelToUrlParam(partial)
    const decoded = decodeModelFromUrlParam(encoded)
    expect(decoded).not.toBeNull()
    expect(decoded?.drives[0]?.capacityTB).toBe(30)
    expect(decoded?.cluster.switchPorts).toBe(32)
  })

  it("computes single-set and fleet-wide durability and validates failure domains", () => {
    const layout = getProtectionLayout("raid6", 8, 2)
    expect(layout.totalShards).toBe(10)

    // Valid topology: 12 servers, 288 drives
    const valid = calculateDurability(layout, 0.0044, 24, {
      totalDrives: 288,
      serverCount: 12,
      failureDomain: "server",
    })
    expect(valid.isTopologyValid).toBe(true)
    expect(valid.topologyWarning).toBeNull()
    expect(valid.protectionSetCount).toBeCloseTo(28.8, 2)
    expect(valid.clusterAnnualLossRate).toBeGreaterThan(valid.annualLossRate)
    expect(valid.formattedPercentage.endsWith("%")).toBe(true)

    // Invalid server failure domain: 6 servers < 10 shards
    const invalidNodes = calculateDurability(layout, 0.0044, 24, {
      totalDrives: 144,
      serverCount: 6,
      failureDomain: "server",
    })
    expect(invalidNodes.isTopologyValid).toBe(false)
    expect(invalidNodes.topologyWarning).toContain("at least 10 servers")

    // Accurate percentage formatting even for low nines
    expect(formatDurabilityPercentage(0.015, 1)).toBe("98.50%")
  })
})
