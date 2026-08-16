import * as React from "react"

import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"

import { AppSidebar } from "@/components/app-sidebar"
import { ModelPages } from "@/components/model-pages"
import { SiteHeader } from "@/components/site-header"
import {
  DEFAULT_MODEL,
  calculateTco,
  type SectionId,
  type TcoModel,
} from "@/lib/tco-model"

const STORAGE_KEY = "snia-tco-model-v14"

function cloneDefaultModel() {
  return structuredClone(DEFAULT_MODEL)
}

function loadInitialModel(): TcoModel {
  try {
    const storedModel = localStorage.getItem(STORAGE_KEY)
    return storedModel ? (JSON.parse(storedModel) as TcoModel) : cloneDefaultModel()
  } catch {
    return cloneDefaultModel()
  }
}

function escapeCsv(value: string | number) {
  const serialized = String(value)
  return /[",\n]/.test(serialized) ? `"${serialized.replaceAll('"', '""')}"` : serialized
}

export function App() {
  const [activeSection, setActiveSection] = React.useState<SectionId>("summary")
  const [model, setModel] = React.useState<TcoModel>(loadInitialModel)
  const results = React.useMemo(() => calculateTco(model), [model])

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(model))
  }, [model])

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [activeSection])

  const resetModel = React.useCallback(() => {
    if (window.confirm("Reset every assumption to the enhanced SNIA baseline?")) {
      setModel(cloneDefaultModel())
      setActiveSection("summary")
    }
  }, [])

  const exportSummary = React.useCallback(() => {
    const rows: Array<[string, string | number]> = [
      ["SNIA Storage TCO Lab", "Enhanced SNIA 2.0 model"],
      [
        "Drive profiles",
        model.drives.length ? model.drives.map((drive) => drive.name).join("; ") : "None",
      ],
      [
        "Server drive mix",
        results.driveBreakdown.length
          ? results.driveBreakdown
              .map((item) => `${item.drive.name} × ${item.drivesPerServer}`)
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
      ["64-port 800G switches", model.cluster.switchCount],
      ["800G switch-port breakout factor", results.switchBreakoutFactor],
      ["800G switch ports used", results.usedSwitchPorts],
      ["800G switch ports installed", results.availableSwitchPorts],
      ["Average switch cost per 800G port ($)", model.cluster.switchCostPerPort],
      ["Switch hardware ($)", results.switchHardwareCost],
      ["Host optics", results.hostOpticCount],
      ["Host optics ($)", results.hostOpticsTotal],
      ["Switch-side 800G optics", results.switchOpticCount],
      ["Switch-side optics ($)", results.switchOpticsTotal],
      ["Network acquisition ($)", results.networkCapex],
      ["Drives per server", results.drivesPerServer],
      ["Total drives", results.totalDrives],
      ["Weighted drive AFR (%)", results.weightedAfrPercent],
      ["Deployment term (years)", model.workload.termYears],
      [
        "Protection layout",
        `${results.protectionDataShards}+${results.protectionParityShards}`,
      ],
      ["Protection overhead factor", results.protectionFactor],
      ["Raw capacity (TB)", results.rawCapacityTB],
      ["Capacity after utilization (TB)", results.utilizedCapacityTB],
      ["Capacity after protection (TB)", results.protectedCapacityTB],
      ["Effective capacity (TB)", results.effectiveCapacityTB],
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
      ["Internet bandwidth (Gbps)", model.opex.internetBandwidthGbps],
      ["Internet bandwidth ($ / Gbps / month)", model.opex.internetPerGbpsMonth],
      ["Internet bandwidth term total ($)", results.networkOpexTotal],
      ["Hardware CapEx ($)", results.hardwareCapex],
      ["Software capacity basis", "Raw TB"],
      ["Upfront software ($ / raw TB)", model.software.upfrontPerRawTB],
      ["Upfront software ($ / server)", model.software.upfrontPerServer],
      ["Monthly software ($ / raw TB)", model.software.monthlyPerRawTB],
      ["Monthly software ($ / core)", model.software.monthlyPerCore],
      ["Software total ($)", results.softwareTotal],
      ["Operating cost ($)", results.operationsTotal],
      ["Total cost of ownership ($)", results.tco],
      ["TCO / raw TB ($)", results.tcoPerRawTB],
      ["TCO / effective TB ($)", results.tcoPerEffectiveTB],
      ["TCO / effective TB / month ($)", results.tcoPerEffectiveTBMonth],
    ]
    const csv = ["Metric,Value", ...rows.map((row) => row.map(escapeCsv).join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "snia-tco-summary.csv"
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
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
          onExport={exportSummary}
          onReset={resetModel}
        />
        <main className="tco-grid min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[96rem] p-4 sm:p-6 lg:p-8">
            <ModelPages
              activeSection={activeSection}
              model={model}
              results={results}
              onModelChange={setModel}
              onSectionChange={setActiveSection}
            />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
