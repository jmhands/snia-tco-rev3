import * as React from "react"

import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"
import { Toaster, toast } from "@workspace/ui/components/sonner"

import { AppSidebar } from "@/components/app-sidebar"
import { ModelPages } from "@/components/model-pages"
import { SiteHeader } from "@/components/site-header"
import { useTheme } from "@/components/theme-provider"
import {
  DEFAULT_MODEL,
  REFERENCE_SCENARIOS,
  SECTION_META,
  calculateTco,
  decodeModelFromUrlParam,
  encodeModelToUrlParam,
  formatCapacity,
  sanitizeModel,
  type SavedScenario,
  type SectionId,
  type TcoModel,
} from "@/lib/tco-model"

const STORAGE_KEY = "snia-tco-model-v20"
const SCENARIOS_STORAGE_KEY = "snia-tco-saved-scenarios-v1"

const VALID_SECTIONS = new Set<SectionId>(
  Object.keys(SECTION_META) as SectionId[]
)

function cloneDefaultModel() {
  return structuredClone(DEFAULT_MODEL)
}

function getSectionFromHash(): SectionId {
  const rawHash = window.location.hash.replace(/^#/, "")
  return VALID_SECTIONS.has(rawHash as SectionId)
    ? (rawHash as SectionId)
    : "summary"
}

function loadInitialModel(): TcoModel {
  try {
    const params = new URLSearchParams(window.location.search)
    const sharedParam = params.get("s")
    if (sharedParam) {
      const decoded = decodeModelFromUrlParam(sharedParam)
      if (decoded) {
        return decoded
      }
    }

    const storedModel = localStorage.getItem(STORAGE_KEY)
    return storedModel
      ? sanitizeModel(JSON.parse(storedModel))
      : cloneDefaultModel()
  } catch {
    return cloneDefaultModel()
  }
}

function loadSavedScenarios(): SavedScenario[] {
  try {
    const raw = localStorage.getItem(SCENARIOS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return []
      const candidate = item as Partial<SavedScenario>
      if (
        typeof candidate.id !== "string" ||
        typeof candidate.name !== "string"
      )
        return []
      return [
        {
          id: candidate.id,
          name: candidate.name,
          description:
            typeof candidate.description === "string"
              ? candidate.description
              : "Custom saved scenario",
          isPreset: false,
          updatedAt:
            typeof candidate.updatedAt === "string"
              ? candidate.updatedAt
              : new Date().toISOString(),
          model: sanitizeModel(candidate.model),
        },
      ]
    })
  } catch {
    return []
  }
}

function escapeCsv(value: string | number) {
  const serialized = String(value)
  return /[",\n]/.test(serialized)
    ? `"${serialized.replaceAll('"', '""')}"`
    : serialized
}

export function App() {
  const { resolvedTheme } = useTheme()
  const [activeSection, setActiveSectionState] =
    React.useState<SectionId>(getSectionFromHash)
  const [model, setModel] = React.useState<TcoModel>(loadInitialModel)
  const [customScenarios, setCustomScenarios] =
    React.useState<SavedScenario[]>(loadSavedScenarios)
  const [comparisonScenarioId, setComparisonScenarioId] = React.useState<
    string | null
  >(null)

  const results = React.useMemo(() => calculateTco(model), [model])
  const allScenarios = React.useMemo(
    () => [...REFERENCE_SCENARIOS, ...customScenarios],
    [customScenarios]
  )
  const comparisonScenario = React.useMemo(
    () =>
      allScenarios.find((scenario) => scenario.id === comparisonScenarioId) ??
      null,
    [allScenarios, comparisonScenarioId]
  )

  const setActiveSection = React.useCallback((section: SectionId) => {
    setActiveSectionState(section)
    const url = new URL(window.location.href)
    url.hash = section
    window.history.replaceState(null, "", url.toString())
  }, [])

  React.useEffect(() => {
    const handleHashChange = () => {
      setActiveSectionState(getSectionFromHash())
    }
    window.addEventListener("hashchange", handleHashChange)
    window.addEventListener("popstate", handleHashChange)
    return () => {
      window.removeEventListener("hashchange", handleHashChange)
      window.removeEventListener("popstate", handleHashChange)
    }
  }, [])

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(model))
  }, [model])

  React.useEffect(() => {
    localStorage.setItem(SCENARIOS_STORAGE_KEY, JSON.stringify(customScenarios))
  }, [customScenarios])

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [activeSection])

  const resetModel = React.useCallback(() => {
    const previousModel = structuredClone(model)
    setModel(cloneDefaultModel())
    setActiveSection("summary")
    toast.success("Model reset to SNIA Rev 1 baseline", {
      action: {
        label: "Undo",
        onClick: () => setModel(previousModel),
      },
    })
  }, [model, setActiveSection])

  const handleLoadScenario = React.useCallback(
    (scenario: SavedScenario) => {
      const previousModel = structuredClone(model)
      setModel(structuredClone(scenario.model))
      toast.success(`Loaded scenario: ${scenario.name}`, {
        action: {
          label: "Undo",
          onClick: () => setModel(previousModel),
        },
      })
    },
    [model]
  )

  const defaultScenarioName = React.useMemo(() => {
    const mediaTag =
      results.nvmeDriveCount > 0 && results.hddDriveCount > 0
        ? "Hybrid NVMe+HDD"
        : results.hddDriveCount > 0
          ? "HDD"
          : "NVMe"
    return `${model.cluster.serverCount}-node ${mediaTag} (${formatCapacity(results.rawCapacityTB)} raw)`
  }, [
    model.cluster.serverCount,
    results.hddDriveCount,
    results.nvmeDriveCount,
    results.rawCapacityTB,
  ])

  const handleSaveScenario = React.useCallback(
    (customName?: string) => {
      const resolvedName = customName?.trim() || defaultScenarioName
      const id = `scenario-${Date.now()}`
      const description = `${model.cluster.serverCount} servers · ${results.totalDrives} drives · ${formatCapacity(results.rawCapacityTB)} raw · ${model.workload.termYears}y`
      const nextScenario: SavedScenario = {
        id,
        name: resolvedName,
        description,
        isPreset: false,
        updatedAt: new Date().toISOString(),
        model: structuredClone(model),
      }

      setCustomScenarios((prev) => [nextScenario, ...prev])
      toast.success(`Saved scenario "${nextScenario.name}"`)
    },
    [defaultScenarioName, model, results]
  )

  const handleDeleteScenario = React.useCallback(
    (id: string) => {
      setCustomScenarios((prev) =>
        prev.filter((scenario) => scenario.id !== id)
      )
      if (comparisonScenarioId === id) {
        setComparisonScenarioId(null)
      }
      toast.info("Deleted saved scenario")
    },
    [comparisonScenarioId]
  )

  const handleShareLink = React.useCallback(() => {
    const encoded = encodeModelToUrlParam(model)
    const url = new URL(window.location.href)
    url.searchParams.set("s", encoded)
    url.hash = activeSection
    window.history.replaceState(null, "", url.toString())

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url.toString()).then(
        () => toast.success("Shareable scenario URL copied to clipboard"),
        () => toast.info("Scenario encoded in browser address bar")
      )
    } else {
      toast.info("Scenario encoded in browser address bar")
    }
  }, [activeSection, model])

  const handleExportJson = React.useCallback(() => {
    const payload = JSON.stringify(model, null, 2)
    const blob = new Blob([payload], {
      type: "application/json;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "snia-tco-scenario.json"
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    toast.success("Exported scenario JSON")
  }, [model])

  const handleImportJson = React.useCallback(
    (file: File) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result))
          const sanitized = sanitizeModel(parsed)
          const previousModel = structuredClone(model)
          setModel(sanitized)
          toast.success(`Imported scenario from ${file.name}`, {
            action: {
              label: "Undo",
              onClick: () => setModel(previousModel),
            },
          })
        } catch {
          toast.error("Invalid scenario JSON file")
        }
      }
      reader.readAsText(file)
    },
    [model]
  )

  const exportSummary = React.useCallback(() => {
    const rows: Array<[string, string | number]> = [
      ["SNIA Storage TCO Lab", "Enhanced SNIA 2.0 model"],
      [
        "Drive profiles",
        model.drives.length
          ? model.drives
              .map((drive) => `${drive.name} (${drive.medium})`)
              .join("; ")
          : "None",
      ],
      [
        "Server drive mix",
        results.driveBreakdown.length
          ? results.driveBreakdown
              .map(
                (item) =>
                  `${item.drive.name} [${item.drive.medium}] × ${item.drivesPerServer}`
              )
              .join("; ")
          : "None",
      ],
      ["Servers", model.cluster.serverCount],
      ["NICs per server", model.server.nicCount],
      ["Ports per NIC", model.server.portsPerNic],
      ["NIC port speed (Gbps)", model.server.nicSpeedGbps],
      ["Host ports per server", results.hostPortsPerServer],
      ["Total host ports", results.totalHostPorts],
      ["Aggregate host bandwidth (Gbps)", results.aggregateHostBandwidthGbps],
      [
        `${results.switchPortsPerSwitch}-port ${results.switchSpeedGbps}G switches`,
        model.cluster.switchCount,
      ],
      [
        `${results.switchSpeedGbps}G switch-port breakout factor`,
        results.switchBreakoutFactor,
      ],
      [
        `${results.switchSpeedGbps}G switch ports used`,
        results.usedSwitchPorts,
      ],
      [
        `${results.switchSpeedGbps}G switch ports installed`,
        results.availableSwitchPorts,
      ],
      [
        `Average switch cost per ${results.switchSpeedGbps}G port ($)`,
        model.cluster.switchCostPerPort,
      ],
      ["Switch hardware ($)", results.switchHardwareCost],
      ["Host optics / links", results.hostOpticCount],
      ["Host optics ($)", results.hostOpticsTotal],
      [
        `Switch-side ${results.switchSpeedGbps}G optics`,
        results.switchOpticCount,
      ],
      ["Switch-side optics ($)", results.switchOpticsTotal],
      ["Network acquisition ($)", results.networkCapex],
      ["Drives per server", results.drivesPerServer],
      ["Total drives", results.totalDrives],
      ["NVMe SSD drives deployed", results.nvmeDriveCount],
      ["HDD drives deployed", results.hddDriveCount],
      ["NVMe raw capacity (TB)", results.nvmeRawCapacityTB],
      ["HDD raw capacity (TB)", results.hddRawCapacityTB],
      ["Weighted drive AFR (%)", results.weightedAfrPercent],
      ["Deployment term (years)", model.workload.termYears],
      [
        "Protection layout",
        `${results.protectionDataShards}+${results.protectionParityShards}`,
      ],
      ["Protection failure domain", model.workload.failureDomain ?? "drive"],
      ["Protection overhead factor", results.protectionFactor],
      ["Raw capacity (TB)", results.rawCapacityTB],
      ["Capacity after protection (TB)", results.protectedCapacityTB],
      ["Capacity after data reduction (TBe)", results.dataReducedCapacityTB],
      ["Utilized effective capacity (TBe)", results.utilizedCapacityTB],
      ["Rack count", results.rackCount],
      ["Average IT power (W)", results.averageItPowerWatts],
      ["Peak provisioned IT power (kW)", results.provisionedPowerKw],
      ["Colocation ($ / kW / month)", model.opex.coloPerKwMonth],
      ["Colocation monthly total ($)", results.monthlyColoCost],
      ["Colocation term total ($)", results.coloSpaceTotal],
      ["PUE", model.opex.pue],
      ["Electricity ($ / kWh)", model.opex.electricityPerKwh],
      ["Annual energy (kWh)", results.annualEnergyKwh],
      ["Electricity term total ($)", results.electricityTotal],
      ["Internet bandwidth per rack (Gbps)", model.opex.internetBandwidthGbps],
      ["Internet bandwidth rack count", results.rackCount],
      [
        "Internet bandwidth ($ / Gbps / month)",
        model.opex.internetPerGbpsMonth,
      ],
      ["Internet bandwidth term total ($)", results.networkOpexTotal],
      ["Hardware CapEx ($)", results.hardwareCapex],
      ["Hardware residual value (%)", model.opex.residualValuePercent ?? 0],
      ["Hardware residual credit ($)", results.residualValueCredit],
      ["Software capacity basis", "Raw TB"],
      ["Upfront software ($ / raw TB)", model.software.upfrontPerRawTB],
      ["Upfront software ($ / server)", model.software.upfrontPerServer],
      ["Monthly software ($ / raw TB)", model.software.monthlyPerRawTB],
      ["Monthly software ($ / core)", model.software.monthlyPerCore],
      ["Software total ($)", results.softwareTotal],
      ["Operating cost ($)", results.operationsTotal],
      ["Total cost of ownership ($)", results.tco],
      ["Discount rate / WACC (%)", model.opex.discountRatePercent ?? 0],
      ["Net present value TCO ($)", results.npvTco],
      ["TCO / raw TB ($)", results.tcoPerRawTB],
      ["TCO / effective TB ($)", results.tcoPerEffectiveTB],
      ["TCO / effective TB / month ($)", results.tcoPerEffectiveTBMonth],
      ["NPV / effective TB / month ($)", results.npvPerEffectiveTBMonth],
      [
        "Depreciated hardware CapEx / effective TB / month ($)",
        results.hardwareCapexPerEffectiveTBMonth,
      ],
      [
        "Operating cost / effective TB / month ($)",
        results.operationsPerEffectiveTBMonth,
      ],
      [
        "Software / effective TB / month ($)",
        results.softwarePerEffectiveTBMonth,
      ],
      ...results.annualCosts.map((period): [string, number] => [
        `Cash flow - ${period.period} Nominal ($)`,
        period.total,
      ]),
      ...results.annualCosts.map((period): [string, number] => [
        `Cash flow - ${period.period} Discounted PV ($)`,
        period.discountedTotal,
      ]),
    ]
    const csv = [
      "Metric,Value",
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "snia-tco-summary.csv"
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    toast.success("Exported TCO summary CSV")
  }, [model, results])

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 64)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        tcoResults={results}
        variant="inset"
      />
      <SidebarInset className="min-w-0 overflow-hidden">
        <SiteHeader
          activeSection={activeSection}
          scenarios={allScenarios}
          comparisonScenarioId={comparisonScenarioId}
          defaultScenarioName={defaultScenarioName}
          onLoadScenario={handleLoadScenario}
          onSaveScenario={handleSaveScenario}
          onDeleteScenario={handleDeleteScenario}
          onCompareScenario={setComparisonScenarioId}
          onShareLink={handleShareLink}
          onExport={exportSummary}
          onExportJson={handleExportJson}
          onImportJson={handleImportJson}
          onReset={resetModel}
        />
        <main className="tco-grid min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[96rem] p-4 sm:p-6 lg:p-8">
            <ModelPages
              activeSection={activeSection}
              model={model}
              results={results}
              scenarios={allScenarios}
              comparisonScenario={comparisonScenario}
              onCompareScenario={setComparisonScenarioId}
              onLoadScenario={handleLoadScenario}
              onSaveScenario={handleSaveScenario}
              onModelChange={setModel}
              onSectionChange={setActiveSection}
            />
          </div>
        </main>
      </SidebarInset>
      <Toaster theme={resolvedTheme} position="bottom-right" />
    </SidebarProvider>
  )
}
