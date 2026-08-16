import { useState, type ReactNode } from "react"
import {
  ActivityIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  Clock3Icon,
  DatabaseIcon,
  GaugeIcon,
  HardDriveIcon,
  Layers3Icon,
  NetworkIcon,
  PlusIcon,
  ReceiptTextIcon,
  ServerIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Trash2Icon,
  ZapIcon,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Progress } from "@workspace/ui/components/progress"
import { Separator } from "@workspace/ui/components/separator"
import { Slider } from "@workspace/ui/components/slider"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import {
  REFERENCE_SWITCH_PORTS,
  REFERENCE_SWITCH_SPEED_GBPS,
  SECTION_META,
  formatCapacity,
  formatCompactCurrency,
  formatCurrency,
  formatPower,
  type DriveConfig,
  type NicSpeedGbps,
  type SectionId,
  type TcoModel,
  type TcoResults,
} from "@/lib/tco-model"
import {
  calculateDurability,
  getProtectionLayout,
  type ProtectionScheme,
} from "@/lib/durability"

type ModelPagesProps = {
  activeSection: SectionId
  model: TcoModel
  results: TcoResults
  onModelChange: (model: TcoModel) => void
  onSectionChange: (section: SectionId) => void
}

const DRIVE_CAPACITY_STEPS = [0.96, 1.92, 3.84, 7.68, 15.36, 30.72, 61.44, 122.88, 245.76]

function formatDriveCapacity(value: number) {
  return value < 1 ? `${Math.round(value * 1000)} GB` : `${value.toFixed(2)} TB`
}

function formatEffectiveCapacity(tb: number) {
  return formatCapacity(tb).replace(" PB", " PBe").replace(" TB", " TBe")
}

function formatBandwidth(gbps: number) {
  return gbps >= 1000
    ? `${(gbps / 1000).toFixed(gbps % 1000 ? 1 : 0)} Tb/s`
    : `${gbps.toLocaleString()} Gb/s`
}

function PageIntro({ section, action }: { section: SectionId; action?: ReactNode }) {
  const meta = SECTION_META[section]

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex max-w-3xl flex-col gap-2">
        <div className="font-mono text-[0.625rem] tracking-[0.2em] text-primary uppercase">
          {meta.eyebrow}
        </div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          {meta.label}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {meta.description}
        </p>
      </div>
      {action}
    </div>
  )
}

function SliderField({
  label,
  description,
  value,
  min,
  max,
  step = 1,
  suffix = "%",
  formatValue,
  disabled = false,
  onChange,
}: {
  label: string
  description: string
  value: number
  min: number
  max: number
  step?: number
  suffix?: string
  formatValue?: (value: number) => string
  disabled?: boolean
  onChange: (value: number) => void
}) {
  return (
    <Field>
      <div className="flex items-center justify-between gap-3">
        <FieldLabel>{label}</FieldLabel>
        <Badge variant="outline" className="font-mono">
          {formatValue ? formatValue(value) : `${value}${suffix}`}
        </Badge>
      </div>
      <Slider
        aria-label={label}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        value={[value]}
        onValueChange={(nextValue) =>
          onChange(Array.isArray(nextValue) ? (nextValue[0] ?? value) : nextValue)
        }
      />
      <FieldDescription>{description}</FieldDescription>
    </Field>
  )
}

function ChoiceSliderField({
  label,
  description,
  value,
  choices,
  formatValue,
  onChange,
}: {
  label: string
  description: string
  value: number
  choices: number[]
  formatValue: (value: number) => string
  onChange: (value: number) => void
}) {
  const selectedIndex = choices.reduce((nearestIndex, choice, index) => {
    return Math.abs(choice - value) < Math.abs(choices[nearestIndex]! - value)
      ? index
      : nearestIndex
  }, 0)

  return (
    <Field>
      <div className="flex items-center justify-between gap-3">
        <FieldLabel>{label}</FieldLabel>
        <Badge variant="outline" className="font-mono">
          {formatValue(choices[selectedIndex] ?? value)}
        </Badge>
      </div>
      <Slider
        aria-label={label}
        min={0}
        max={choices.length - 1}
        step={1}
        value={[selectedIndex]}
        onValueChange={(nextValue) => {
          const index = Array.isArray(nextValue) ? (nextValue[0] ?? selectedIndex) : nextValue
          onChange(choices[Math.round(index)] ?? value)
        }}
      />
      <FieldDescription>{description}</FieldDescription>
    </Field>
  )
}

function ImpactCard({
  title = "Live impact",
  description = "Derived from the current model",
  items,
  footer,
}: {
  title?: string
  description?: string
  items: Array<{ label: string; value: string; hint?: string }>
  footer?: ReactNode
}) {
  return (
    <Card className="h-fit xl:sticky xl:top-20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ActivityIcon />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {items.map((item, index) => (
          <div className="flex flex-col gap-3" key={item.label}>
            {index ? <Separator /> : null}
            <div className="flex items-start justify-between gap-4">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="text-right font-mono text-sm font-semibold tabular-nums">
                {item.value}
              </span>
            </div>
            {item.hint ? (
              <p className="-mt-2 text-[0.625rem] leading-relaxed text-muted-foreground">
                {item.hint}
              </p>
            ) : null}
          </div>
        ))}
      </CardContent>
      {footer ? <CardFooter className="border-t">{footer}</CardFooter> : null}
    </Card>
  )
}

function SummaryMetric({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string
  value: string
  hint: string
  icon: typeof DatabaseIcon
}) {
  return (
    <Card className="transition-transform duration-200 hover:-translate-y-0.5">
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <Icon />
          {label}
        </CardDescription>
        <CardTitle className="font-mono text-xl font-semibold tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-[0.625rem] leading-relaxed text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
}

function DrivePage({ model, results, onModelChange }: Omit<ModelPagesProps, "activeSection" | "onSectionChange">) {
  const [selectedDriveId, setSelectedDriveId] = useState<string | null>(
    model.drives[0]?.id ?? null
  )
  const selectedDrive =
    model.drives.find((drive) => drive.id === selectedDriveId) ?? model.drives[0]

  const updateDrive = (patch: Partial<DriveConfig>) => {
    if (!selectedDrive) return

    onModelChange({
      ...model,
      drives: model.drives.map((drive) =>
        drive.id === selectedDrive.id ? { ...drive, ...patch } : drive
      ),
    })
  }

  const addDrive = () => {
    const id = `nvme-${Date.now()}`
    const sequence = model.drives.length + 1
    const newDrive: DriveConfig = {
      id,
      name:
        sequence === 1
          ? "15.36 TB NVMe"
          : `15.36 TB NVMe ${String(sequence).padStart(2, "0")}`,
      medium: "NVMe SSD",
      interface: "PCIe Gen5",
      capacityTB: 15.36,
      activeWatts: 15,
      idleWatts: 3,
      afrPercent: 0.44,
      costPerTB: 350,
    }
    setSelectedDriveId(id)
    onModelChange({ ...model, drives: [...model.drives, newDrive] })
  }

  const selectedDrivesPerServer = selectedDrive
    ? (model.server.driveAllocations.find(
        (allocation) => allocation.driveId === selectedDrive.id
      )?.count ?? 0)
    : 0
  const selectedTotalDrives = selectedDrivesPerServer * model.cluster.serverCount
  const selectedUnitCost = selectedDrive
    ? selectedDrive.capacityTB * selectedDrive.costPerTB
    : 0
  const selectedRawCapacityTB = selectedDrive
    ? selectedTotalDrives * selectedDrive.capacityTB
    : 0
  const selectedAcquisitionCost = selectedTotalDrives * selectedUnitCost

  return (
    <div className="flex flex-col gap-6">
      <PageIntro
        section="drive"
        action={
          <Button onClick={addDrive}>
            <PlusIcon data-icon="inline-start" />
            Add drive
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Drive library</CardTitle>
              <CardDescription>
                Create media profiles here, then combine any mix of them in Server Config.
              </CardDescription>
              <CardAction>
                <Badge variant="secondary">
                  {model.drives.length} {model.drives.length === 1 ? "profile" : "profiles"}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              {model.drives.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Drive</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Raw $ / TB</TableHead>
                      <TableHead>Power A / I</TableHead>
                      <TableHead className="text-right">Server mix</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {model.drives.map((drive) => {
                      const selected = drive.id === selectedDrive?.id
                      const drivesPerServer =
                        model.server.driveAllocations.find(
                          (allocation) => allocation.driveId === drive.id
                        )?.count ?? 0

                      return (
                        <TableRow key={drive.id} data-state={selected ? "selected" : undefined}>
                          <TableCell>
                            <div className="flex min-w-40 flex-col gap-0.5">
                              <span className="font-medium">{drive.name}</span>
                              <span className="font-mono text-[0.625rem] text-muted-foreground">
                                {drive.medium} · {drive.interface}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">{formatDriveCapacity(drive.capacityTB)}</TableCell>
                          <TableCell className="font-mono">{formatCurrency(drive.costPerTB)} / TB</TableCell>
                          <TableCell className="font-mono">
                            {drive.activeWatts} / {drive.idleWatts} W
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              <Badge variant={drivesPerServer ? "default" : "secondary"}>
                                {drivesPerServer ? `${drivesPerServer} / server` : "Not assigned"}
                              </Badge>
                              <Button
                                size="sm"
                                variant={selected ? "secondary" : "outline"}
                                onClick={() => setSelectedDriveId(drive.id)}
                              >
                                {selected ? "Editing" : "Edit"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <Empty className="border">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <HardDriveIcon />
                    </EmptyMedia>
                    <EmptyTitle>No drive profiles yet</EmptyTitle>
                    <EmptyDescription>
                      Add the first drive to begin a reusable media library. Drives remain separate until you add them to a server mix.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button onClick={addDrive}>
                      <PlusIcon data-icon="inline-start" />
                      Add first drive
                    </Button>
                  </EmptyContent>
                </Empty>
              )}
            </CardContent>
          </Card>

          {selectedDrive ? (
            <Card>
              <CardHeader>
                <CardTitle>{selectedDrive.name}</CardTitle>
                <CardDescription>
                  Tune the selected drive with direct, bounded controls. Every assigned server mix recalculates instantly.
                </CardDescription>
                <CardAction>
                  <Badge>{selectedDrive.medium}</Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <ChoiceSliderField
                    label="Capacity"
                    description="Binary NVMe capacity steps from 960 GB through 245.76 TB."
                    value={selectedDrive.capacityTB}
                    choices={DRIVE_CAPACITY_STEPS}
                    formatValue={formatDriveCapacity}
                    onChange={(capacityTB) => updateDrive({ capacityTB })}
                  />
                  <SliderField
                    label="Raw media price per TB"
                    description="Raw acquisition basis used directly for drive CapEx, replacements, and total TCO."
                    value={selectedDrive.costPerTB}
                    min={0}
                    max={1000}
                    step={5}
                    formatValue={(value) => `${formatCurrency(value)} / TB`}
                    onChange={(costPerTB) => updateDrive({ costPerTB })}
                  />
                  <SliderField
                    label="Idle power"
                    description="Drive power draw while ready but not actively serving I/O."
                    value={selectedDrive.idleWatts}
                    min={0}
                    max={35}
                    step={0.5}
                    formatValue={(value) => `${value.toFixed(1)} W`}
                    onChange={(idleWatts) =>
                      updateDrive({
                        idleWatts,
                        activeWatts: Math.max(selectedDrive.activeWatts, idleWatts),
                      })
                    }
                  />
                  <SliderField
                    label="Active power"
                    description={`Active power cannot fall below the ${selectedDrive.idleWatts.toFixed(1)} W idle setting.`}
                    value={selectedDrive.activeWatts}
                    min={selectedDrive.idleWatts}
                    max={35}
                    step={0.5}
                    formatValue={(value) => `${value.toFixed(1)} W`}
                    onChange={(activeWatts) => updateDrive({ activeWatts })}
                  />
                  <SliderField
                    label="Annual failure rate"
                    description="Expected percentage of deployed drives that fail each year."
                    value={selectedDrive.afrPercent}
                    min={0}
                    max={5}
                    step={0.01}
                    formatValue={(value) => `${value.toFixed(2)}%`}
                    onChange={(afrPercent) => updateDrive({ afrPercent })}
                  />
                </FieldGroup>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {selectedDrive ? (
          <ImpactCard
            title="Selected profile impact"
            items={[
              { label: "Assigned / server", value: selectedDrivesPerServer.toLocaleString() },
              { label: "Deployed drives", value: selectedTotalDrives.toLocaleString() },
              { label: "Unit price", value: formatCurrency(selectedUnitCost) },
              { label: "Raw cluster capacity", value: formatCapacity(selectedRawCapacityTB) },
              { label: "Drive acquisition", value: formatCompactCurrency(selectedAcquisitionCost) },
              {
                label: "Expected replacements",
                value: `${(
                  (selectedTotalDrives * selectedDrive.afrPercent * model.workload.termYears) /
                  100
                ).toFixed(1)} drives`,
              },
            ]}
            footer={
              <span className="text-[0.625rem] leading-relaxed text-muted-foreground">
                Raw media cost = drive capacity × raw $ / TB. Assign profiles in Server Config to include them in TCO.
              </span>
            }
          />
        ) : (
          <ImpactCard
            title="Library status"
            description="No media is modeled yet"
            items={[
              { label: "Drive profiles", value: "0" },
              { label: "Server drive types", value: "0" },
              { label: "Drives deployed", value: "0" },
              { label: "Raw capacity", value: formatCapacity(results.rawCapacityTB) },
              { label: "Drive acquisition", value: formatCompactCurrency(results.driveCapex) },
            ]}
          />
        )}
      </div>
    </div>
  )
}

function AddDriveTypeMenu({
  drives,
  onAdd,
}: {
  drives: DriveConfig[]
  onAdd: (driveId: string) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        <PlusIcon data-icon="inline-start" />
        Add drive type
        <ChevronDownIcon data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Configured drive profiles</DropdownMenuLabel>
          {drives.map((drive) => (
            <DropdownMenuItem key={drive.id} onClick={() => onAdd(drive.id)}>
              <HardDriveIcon />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-medium">{drive.name}</span>
                <span className="font-mono text-[0.625rem] text-muted-foreground">
                  {formatDriveCapacity(drive.capacityTB)} · {formatCurrency(drive.costPerTB)} / TB
                </span>
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ServerPage({
  model,
  results,
  onModelChange,
  onSectionChange,
}: Pick<ModelPagesProps, "model" | "results" | "onModelChange" | "onSectionChange">) {
  const updateServer = (patch: Partial<TcoModel["server"]>) =>
    onModelChange({ ...model, server: { ...model.server, ...patch } })

  const driveMix = model.server.driveAllocations.flatMap((allocation) => {
    const drive = model.drives.find((candidate) => candidate.id === allocation.driveId)
    return drive ? [{ allocation, drive }] : []
  })
  const assignedDriveIds = new Set(driveMix.map(({ drive }) => drive.id))
  const availableDrives = model.drives.filter((drive) => !assignedDriveIds.has(drive.id))

  const addDriveToServer = (driveId: string) => {
    updateServer({
      driveAllocations: [
        ...model.server.driveAllocations,
        {
          driveId,
          count: model.server.driveAllocations.length ? 1 : 24,
        },
      ],
    })
  }

  const updateDriveCount = (driveId: string, count: number) => {
    updateServer({
      driveAllocations: model.server.driveAllocations.map((allocation) =>
        allocation.driveId === driveId ? { ...allocation, count } : allocation
      ),
    })
  }

  const removeDriveFromServer = (driveId: string) => {
    updateServer({
      driveAllocations: model.server.driveAllocations.filter(
        (allocation) => allocation.driveId !== driveId
      ),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageIntro
        section="server"
        action={
          <Badge variant="outline" className="font-mono">
            {results.drivesPerServer} DRIVES · {driveMix.length} {driveMix.length === 1 ? "TYPE" : "TYPES"} · {results.hostPortsPerServer}×{model.server.nicSpeedGbps}G · {model.server.rackUnits} RU
          </Badge>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Drive mix</CardTitle>
              <CardDescription>
                Combine configured drive profiles and set a separate quantity for each server.
              </CardDescription>
              {availableDrives.length ? (
                <CardAction>
                  <AddDriveTypeMenu drives={availableDrives} onAdd={addDriveToServer} />
                </CardAction>
              ) : driveMix.length ? (
                <CardAction>
                  <Badge variant="secondary">All profiles added</Badge>
                </CardAction>
              ) : null}
            </CardHeader>
            <CardContent>
              {!model.drives.length ? (
                <Empty className="border">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <HardDriveIcon />
                    </EmptyMedia>
                    <EmptyTitle>No drives available</EmptyTitle>
                    <EmptyDescription>
                      Create one or more profiles in Drive Config before assembling this server.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button onClick={() => onSectionChange("drive")}>
                      <PlusIcon data-icon="inline-start" />
                      Create a drive
                    </Button>
                  </EmptyContent>
                </Empty>
              ) : driveMix.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {driveMix.map(({ allocation, drive }) => {
                    const unitCost = drive.capacityTB * drive.costPerTB

                    return (
                      <Card size="sm" key={drive.id}>
                        <CardHeader>
                          <CardDescription>
                            {formatDriveCapacity(drive.capacityTB)} · {drive.medium}
                          </CardDescription>
                          <CardTitle>{drive.name}</CardTitle>
                          <CardAction>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label={`Remove ${drive.name} from server`}
                              title={`Remove ${drive.name} from server`}
                              onClick={() => removeDriveFromServer(drive.id)}
                            >
                              <Trash2Icon data-icon="inline-start" />
                            </Button>
                          </CardAction>
                        </CardHeader>
                        <CardContent>
                          <SliderField
                            label="Drives per server"
                            description="Quantity of this media profile installed in every server."
                            value={allocation.count}
                            min={1}
                            max={64}
                            step={1}
                            formatValue={(value) => `${value} ${value === 1 ? "drive" : "drives"}`}
                            onChange={(count) => updateDriveCount(drive.id, count)}
                          />
                        </CardContent>
                        <CardFooter className="flex flex-wrap gap-2 border-t">
                          <Badge variant="outline">
                            {formatCapacity(drive.capacityTB * allocation.count)} raw
                          </Badge>
                          <Badge variant="outline">
                            {formatCurrency(unitCost * allocation.count)} media
                          </Badge>
                          <Badge variant="outline">
                            {formatPower(drive.activeWatts * allocation.count)} peak
                          </Badge>
                        </CardFooter>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <Empty className="border">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ServerIcon />
                    </EmptyMedia>
                    <EmptyTitle>No drives in this server</EmptyTitle>
                    <EmptyDescription>
                      Add a configured drive type. The first profile starts at 24 drives per server.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <AddDriveTypeMenu drives={availableDrives} onAdd={addDriveToServer} />
                  </EmptyContent>
                </Empty>
              )}
            </CardContent>
            {driveMix.length ? (
              <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t">
                <span className="text-muted-foreground">Per-server media total</span>
                <span className="font-mono font-semibold">
                  {results.drivesPerServer} drives · {formatCapacity(results.rawCapacityPerServerTB)} · {formatCurrency(results.rawMediaCostPerServer)}
                </span>
              </CardFooter>
            ) : null}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chassis envelope</CardTitle>
              <CardDescription>
                Set the physical, cost, and non-drive power profile for each server.
              </CardDescription>
              <CardAction>
                <Badge variant="secondary">{model.server.rackUnits} RU chassis</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <SliderField
                  label="Server chassis cost"
                  description="Raw server cost excluding drives and cluster network overhead."
                  value={model.server.unitCost}
                  min={0}
                  max={100000}
                  step={500}
                  formatValue={(value) => `${formatCurrency(value)} / server`}
                  onChange={(unitCost) => updateServer({ unitCost })}
                />
                <SliderField
                  label="Rack height"
                  description="Physical rack space consumed by each server chassis."
                  value={model.server.rackUnits}
                  min={1}
                  max={8}
                  step={1}
                  suffix=" RU"
                  onChange={(rackUnits) => updateServer({ rackUnits })}
                />
                <SliderField
                  label="Base server power"
                  description="CPU, DRAM, fans, and motherboard power before drives and network overhead."
                  value={model.server.basePowerWatts}
                  min={100}
                  max={2000}
                  step={25}
                  suffix=" W"
                  onChange={(basePowerWatts) => updateServer({ basePowerWatts })}
                />
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compute & memory</CardTitle>
              <CardDescription>Set the resources that drive software licensing and node performance.</CardDescription>
              <CardAction>
                <Badge variant="secondary">
                  {(model.server.sockets * model.server.coresPerSocket).toLocaleString()} cores
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <SliderField
                  label="CPU sockets"
                  description="Physical processor sockets installed per server."
                  value={model.server.sockets}
                  min={1}
                  max={4}
                  step={1}
                  formatValue={(value) => `${value} ${value === 1 ? "socket" : "sockets"}`}
                  onChange={(sockets) => updateServer({ sockets })}
                />
                <SliderField
                  label="Cores per socket"
                  description="Physical CPU cores available in each socket."
                  value={model.server.coresPerSocket}
                  min={8}
                  max={128}
                  step={8}
                  suffix=" cores"
                  onChange={(coresPerSocket) => updateServer({ coresPerSocket })}
                />
                <SliderField
                  label="Installed DRAM"
                  description="Total memory installed in each server."
                  value={model.server.dramGB}
                  min={64}
                  max={4096}
                  step={64}
                  formatValue={(value) =>
                    value >= 1024 ? `${(value / 1024).toFixed(value % 1024 ? 2 : 0)} TB` : `${value} GB`
                  }
                  onChange={(dramGB) => updateServer({ dramGB })}
                />
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Host network</CardTitle>
              <CardDescription>
                Define the physical NIC layout. Cluster Config converts these host ports into 800G switch and optics demand.
              </CardDescription>
              <CardAction>
                <Badge variant="secondary">
                  {formatBandwidth(results.hostBandwidthPerServerGbps)} / node
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <div className="flex items-center justify-between gap-3">
                    <FieldLabel>NIC port speed</FieldLabel>
                    <Badge variant="outline" className="font-mono">
                      {model.server.nicSpeedGbps}G
                    </Badge>
                  </div>
                  <ToggleGroup
                    value={[String(model.server.nicSpeedGbps)]}
                    onValueChange={(values) => {
                      const nextSpeed = Number(values[0]) as NicSpeedGbps
                      if ([100, 200, 400, 800].includes(nextSpeed)) {
                        updateServer({ nicSpeedGbps: nextSpeed })
                      }
                    }}
                    variant="outline"
                    size="lg"
                    className="grid w-full grid-cols-2 sm:grid-cols-4"
                    aria-label="NIC port speed"
                  >
                    {[100, 200, 400, 800].map((speed) => (
                      <ToggleGroupItem key={speed} value={String(speed)}>
                        {speed}G
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  <FieldDescription>
                    Select the line rate for every physical port in this server design.
                  </FieldDescription>
                </Field>
                <SliderField
                  label="Number of NICs"
                  description="Physical network interface cards installed in each server."
                  value={model.server.nicCount}
                  min={1}
                  max={8}
                  step={1}
                  formatValue={(value) => `${value} ${value === 1 ? "NIC" : "NICs"}`}
                  onChange={(nicCount) => updateServer({ nicCount })}
                />
                <SliderField
                  label="Ports per NIC"
                  description="Active physical fabric ports on each network card."
                  value={model.server.portsPerNic}
                  min={1}
                  max={4}
                  step={1}
                  formatValue={(value) => `${value} ${value === 1 ? "port" : "ports"}`}
                  onChange={(portsPerNic) => updateServer({ portsPerNic })}
                />
              </FieldGroup>
            </CardContent>
            <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t">
              <span className="text-muted-foreground">Per-server topology</span>
              <span className="font-mono font-semibold">
                {model.server.nicCount} NICs × {model.server.portsPerNic} {model.server.portsPerNic === 1 ? "port" : "ports"} × {model.server.nicSpeedGbps}G = {formatBandwidth(results.hostBandwidthPerServerGbps)}
              </span>
            </CardFooter>
          </Card>
        </div>

        <ImpactCard
          title="Server at a glance"
          description="Per-server totals from the selected controls"
          items={[
            { label: "Drive types / node", value: driveMix.length.toLocaleString() },
            { label: "Drives / node", value: results.drivesPerServer.toLocaleString() },
            { label: "Raw capacity / node", value: formatCapacity(results.rawCapacityPerServerTB) },
            { label: "Raw media cost / node", value: formatCurrency(results.rawMediaCostPerServer) },
            {
              label: "Node acquisition",
              value: formatCurrency(results.rawMediaCostPerServer + model.server.unitCost),
              hint: "Raw media plus server chassis. NIC cards are included in chassis cost; optics and switches are modeled in Cluster Config.",
            },
            { label: "Cores / node", value: `${model.server.sockets * model.server.coresPerSocket}` },
            { label: "DRAM / node", value: `${model.server.dramGB.toLocaleString()} GB` },
            {
              label: "NIC layout",
              value: `${model.server.nicCount} × ${model.server.portsPerNic}-port ${model.server.nicSpeedGbps}G`,
            },
            { label: "Host ports / node", value: results.hostPortsPerServer.toLocaleString() },
            { label: "Host bandwidth / node", value: formatBandwidth(results.hostBandwidthPerServerGbps) },
            {
              label: "Peak power / node",
              value: formatPower(
                model.server.basePowerWatts +
                  results.peakDrivePowerPerServerWatts +
                  model.cluster.networkOverheadWattsPerServer
              ),
            },
          ]}
          footer={
            <span className="text-[0.625rem] leading-relaxed text-muted-foreground">
              All controls are per server. Cluster Config multiplies these values by the server count.
            </span>
          }
        />
      </div>
    </div>
  )
}

function ClusterPage({ model, results, onModelChange }: Omit<ModelPagesProps, "activeSection" | "onSectionChange">) {
  const updateCluster = (patch: Partial<TcoModel["cluster"]>) =>
    onModelChange({ ...model, cluster: { ...model.cluster, ...patch } })

  const rackCapacity = Math.max(model.cluster.rackCapacityRU, 1)
  const rackFillPercent = Math.min(
    (results.totalRackUnits / (results.rackCount * rackCapacity)) * 100,
    100
  )
  const visibleRackCount = Math.min(results.rackCount, 4)
  const baseRackLoad = Math.floor(results.totalRackUnits / results.rackCount)
  const racksWithExtraRu = results.totalRackUnits % results.rackCount
  const switchPortCapacityPercent = Math.min(
    results.switchPortUtilizationPercent,
    100
  )
  const isUnderprovisioned =
    model.cluster.switchCount < results.minimumSwitchCount
  const switchUnitCost =
    REFERENCE_SWITCH_PORTS * model.cluster.switchCostPerPort

  return (
    <div className="flex flex-col gap-6">
      <PageIntro
        section="cluster"
        action={
          <Badge variant="outline" className="font-mono">
            {results.rackCount} {results.rackCount === 1 ? "RACK" : "RACKS"} · {rackFillPercent.toFixed(0)}% FILLED
          </Badge>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Cluster scale</CardTitle>
              <CardDescription>
                Scale one configured server design into a complete physical deployment.
              </CardDescription>
              <CardAction>
                <Badge>{model.cluster.serverCount} nodes</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <SliderField
                  label="Server count"
                  description={`Deploys the ${model.server.name.toLowerCase()} configured in Server Config.`}
                  value={model.cluster.serverCount}
                  min={1}
                  max={512}
                  step={1}
                  formatValue={(value) => `${value} ${value === 1 ? "server" : "servers"}`}
                  onChange={(serverCount) => updateCluster({ serverCount })}
                />
                <SliderField
                  label="Usable rack height"
                  description="Rack units available for servers and the modeled shared switches."
                  value={model.cluster.rackCapacityRU}
                  min={12}
                  max={52}
                  step={1}
                  suffix=" RU"
                  onChange={(rackCapacityRU) => updateCluster({ rackCapacityRU })}
                />
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deployment map</CardTitle>
              <CardDescription>
                A physical view of the nodes, fabric, and rack footprint created by the model.
              </CardDescription>
              <CardAction>
                <Badge variant="secondary">{formatCapacity(results.rawCapacityTB)} raw</Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Card size="sm" className="bg-muted/20">
                  <CardHeader>
                    <CardDescription className="flex items-center gap-2">
                      <ServerIcon /> Storage nodes
                    </CardDescription>
                    <CardTitle className="font-mono text-xl">
                      {model.cluster.serverCount.toLocaleString()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-[0.625rem] text-muted-foreground">
                    {model.server.rackUnits} RU · {results.drivesPerServer} drives each
                  </CardContent>
                </Card>
                <Card size="sm" className="bg-muted/20">
                  <CardHeader>
                    <CardDescription className="flex items-center gap-2">
                      <NetworkIcon /> Host links
                    </CardDescription>
                    <CardTitle className="font-mono text-xl">
                      {results.totalHostPorts} × {model.server.nicSpeedGbps}G
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-[0.625rem] text-muted-foreground">
                    {results.hostPortsPerServer} ports / node · {formatBandwidth(results.aggregateHostBandwidthGbps)} aggregate
                  </CardContent>
                </Card>
                <Card size="sm" className="bg-muted/20">
                  <CardHeader>
                    <CardDescription className="flex items-center gap-2">
                      <Layers3Icon /> 800G leaf ports
                    </CardDescription>
                    <CardTitle className="font-mono text-xl">
                      {results.usedSwitchPorts} / {results.availableSwitchPorts}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-[0.625rem] text-muted-foreground">
                    {model.cluster.switchCount} × {REFERENCE_SWITCH_PORTS}-port switches · {results.switchBreakoutFactor}:1 breakout
                  </CardContent>
                </Card>
                <Card size="sm" className="bg-muted/20">
                  <CardHeader>
                    <CardDescription className="flex items-center gap-2">
                      <DatabaseIcon /> Physical footprint
                    </CardDescription>
                    <CardTitle className="font-mono text-xl">
                      {results.rackCount} {results.rackCount === 1 ? "rack" : "racks"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-[0.625rem] text-muted-foreground">
                    {results.totalRackUnits} of {(results.rackCount * rackCapacity).toLocaleString()} available RU
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium">800G switch-port utilization</div>
                    <div className="text-[0.625rem] text-muted-foreground">
                      Host links are evenly distributed across switches, then packed by breakout factor.
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {isUnderprovisioned ? (
                      <Badge variant="destructive">
                        Needs at least {results.minimumSwitchCount} switches
                      </Badge>
                    ) : (
                      <Badge variant="outline">Capacity available</Badge>
                    )}
                    <Badge variant="secondary" className="font-mono">
                      {results.switchPortUtilizationPercent.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <Progress
                  value={switchPortCapacityPercent}
                  aria-label="800G switch-port utilization"
                />
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[0.625rem] text-muted-foreground">
                  <span>{results.usedSwitchPorts} used 800G ports</span>
                  <span>{results.availableSwitchPorts} installed 800G ports</span>
                </div>
              </div>

              <Separator />

              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium">Rack occupancy</div>
                    <div className="text-[0.625rem] text-muted-foreground">
                      Evenly distributed view of modeled rack-unit consumption.
                    </div>
                  </div>
                  {results.rackCount > visibleRackCount ? (
                    <Badge variant="outline">Showing {visibleRackCount} of {results.rackCount}</Badge>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: visibleRackCount }, (_, index) => {
                    const occupiedRu = baseRackLoad + (index < racksWithExtraRu ? 1 : 0)
                    const utilization = Math.min((occupiedRu / rackCapacity) * 100, 100)

                    return (
                      <Card size="sm" key={`rack-${index + 1}`}>
                        <CardHeader>
                          <CardDescription>Rack {String(index + 1).padStart(2, "0")}</CardDescription>
                          <CardTitle className="font-mono text-base">
                            {occupiedRu} / {rackCapacity} RU
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2">
                          <Progress value={utilization} aria-label={`Rack ${index + 1} occupancy`} />
                          <span className="font-mono text-[0.625rem] text-muted-foreground">
                            {utilization.toFixed(0)}% occupied
                          </span>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>800G switch reference</CardTitle>
                <CardDescription>
                  Price the leaf fabric from a {REFERENCE_SWITCH_PORTS}-port {REFERENCE_SWITCH_SPEED_GBPS}G reference switch.
                </CardDescription>
                <CardAction>
                  <Badge variant="secondary">{formatCurrency(switchUnitCost)} / switch</Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <SliderField
                    label="Switch count"
                    description="Installed 64-port 800G switches. Add pairs when modeling redundant fabrics."
                    value={model.cluster.switchCount}
                    min={1}
                    max={32}
                    step={1}
                    formatValue={(value) => `${value} ${value === 1 ? "switch" : "switches"}`}
                    onChange={(switchCount) => updateCluster({ switchCount })}
                  />
                  <SliderField
                    label="Average cost per 800G port"
                    description="A fully priced average across switch hardware; $781.25 per port equals $50,000 for 64 ports."
                    value={model.cluster.switchCostPerPort}
                    min={0}
                    max={2500}
                    step={0.25}
                    formatValue={(value) => `${formatCurrency(value, 2)} / port`}
                    onChange={(switchCostPerPort) => updateCluster({ switchCostPerPort })}
                  />
                  <SliderField
                    label="Power per switch"
                    description="Nameplate draw added to the average and peak IT load."
                    value={model.cluster.switchPowerWatts}
                    min={0}
                    max={3000}
                    step={25}
                    suffix=" W"
                    onChange={(switchPowerWatts) => updateCluster({ switchPowerWatts })}
                  />
                  <SliderField
                    label="Rack height per switch"
                    description="Physical rack units consumed by every reference switch."
                    value={model.cluster.switchRackUnits}
                    min={1}
                    max={8}
                    step={1}
                    suffix=" RU"
                    onChange={(switchRackUnits) => updateCluster({ switchRackUnits })}
                  />
                </FieldGroup>
              </CardContent>
              <CardFooter className="border-t text-[0.625rem] text-muted-foreground">
                {REFERENCE_SWITCH_PORTS} ports × {formatCurrency(model.cluster.switchCostPerPort, 2)} = {formatCurrency(switchUnitCost)} per switch.
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optics & host edge</CardTitle>
                <CardDescription>
                  Price every host optic and every occupied 800G switch port after breakout.
                </CardDescription>
                <CardAction>
                  <Badge variant="secondary">
                    {results.switchBreakoutFactor}:1 breakout
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <SliderField
                    label="Host optic cost"
                    description={`One optic for each of the ${results.totalHostPorts} physical ${model.server.nicSpeedGbps}G host ports.`}
                    value={model.cluster.hostOpticCost}
                    min={0}
                    max={5000}
                    step={25}
                    formatValue={(value) => `${formatCurrency(value)} / host port`}
                    onChange={(hostOpticCost) => updateCluster({ hostOpticCost })}
                  />
                  <SliderField
                    label="Switch-side 800G optic cost"
                    description={`One 800G optic for each of the ${results.usedSwitchPorts} occupied switch ports; breakout serves ${results.switchBreakoutFactor} host links.`}
                    value={model.cluster.switchOpticCost}
                    min={0}
                    max={10000}
                    step={50}
                    formatValue={(value) => `${formatCurrency(value)} / switch port`}
                    onChange={(switchOpticCost) => updateCluster({ switchOpticCost })}
                  />
                  <SliderField
                    label="Host fabric power per server"
                    description="Incremental NIC and host-optics power added to every storage node."
                    value={model.cluster.networkOverheadWattsPerServer}
                    min={0}
                    max={1000}
                    step={10}
                    suffix=" W"
                    onChange={(networkOverheadWattsPerServer) =>
                      updateCluster({ networkOverheadWattsPerServer })
                    }
                  />
                </FieldGroup>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2 border-t">
                <Badge variant="outline">
                  {results.hostOpticCount} host optics · {formatCompactCurrency(results.hostOpticsTotal)}
                </Badge>
                <Badge variant="outline">
                  {results.switchOpticCount} switch optics · {formatCompactCurrency(results.switchOpticsTotal)}
                </Badge>
              </CardFooter>
            </Card>
          </div>
        </div>

        <ImpactCard
          title="Cluster at a glance"
          description="Physical and economic rollup"
          items={[
            { label: "Cluster raw capacity", value: formatCapacity(results.rawCapacityTB) },
            { label: "Rack footprint", value: `${results.rackCount} × rack` },
            { label: "Host links", value: `${results.totalHostPorts} × ${model.server.nicSpeedGbps}G` },
            { label: "800G switch ports", value: `${results.usedSwitchPorts} / ${results.availableSwitchPorts}` },
            { label: "Breakout", value: `${results.switchBreakoutFactor}:1` },
            { label: "Switch hardware", value: formatCompactCurrency(results.switchHardwareCost) },
            { label: "Optics", value: formatCompactCurrency(results.hostOpticsTotal + results.switchOpticsTotal) },
            { label: "Network CapEx", value: formatCompactCurrency(results.networkCapex) },
            { label: "Peak IT load", value: formatPower(results.peakItPowerWatts) },
          ]}
          footer={
            <span className="text-[0.625rem] leading-relaxed text-muted-foreground">
              NIC cards are included in server chassis cost. Network CapEx includes 64-port 800G switches, one optic per host port, and one optic per used switch port after breakout.
            </span>
          }
        />
      </div>
    </div>
  )
}

function SoftwarePage({ model, results, onModelChange }: Omit<ModelPagesProps, "activeSection" | "onSectionChange">) {
  const updateSoftware = (patch: Partial<TcoModel["software"]>) =>
    onModelChange({ ...model, software: { ...model.software, ...patch } })

  const upfrontCapacityCost =
    results.rawCapacityTB * model.software.upfrontPerRawTB
  const upfrontServerCost =
    model.cluster.serverCount * model.software.upfrontPerServer
  const monthlyCoreCost =
    results.totalCores * model.software.monthlyPerCore
  const monthlyCapacityCost =
    results.rawCapacityTB * model.software.monthlyPerRawTB
  const monthlySoftwareRunRate = monthlyCoreCost + monthlyCapacityCost

  return (
    <div className="flex flex-col gap-6">
      <PageIntro
        section="software"
        action={
          <Badge variant={results.softwareTotal ? "default" : "secondary"}>
            {results.softwareTotal ? "License load active" : "No license load"}
          </Badge>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>One-time licensing</CardTitle>
              <CardDescription>
                Acquisition licenses applied once to installed raw capacity and server count.
              </CardDescription>
              <CardAction>
                <Badge variant="secondary">Acquisition</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <FieldGroup className="grid grid-cols-1 lg:grid-cols-2">
                <SliderField
                  label="Upfront per raw TB"
                  description={`Applied once to ${formatCapacity(results.rawCapacityTB)} of installed raw capacity.`}
                  value={model.software.upfrontPerRawTB}
                  min={0}
                  max={2000}
                  step={10}
                  formatValue={(value) => `${formatCurrency(value, 0)} / TB`}
                  onChange={(upfrontPerRawTB) =>
                    updateSoftware({ upfrontPerRawTB })
                  }
                />
                <SliderField
                  label="Upfront per server"
                  description={`Applied once to ${model.cluster.serverCount.toLocaleString()} storage servers.`}
                  value={model.software.upfrontPerServer}
                  min={0}
                  max={100000}
                  step={500}
                  formatValue={(value) => `${formatCurrency(value, 0)} / server`}
                  onChange={(upfrontPerServer) =>
                    updateSoftware({ upfrontPerServer })
                  }
                />
              </FieldGroup>
            </CardContent>
            <CardFooter className="border-t">
              <div className="flex w-full flex-wrap items-center justify-between gap-3">
                <span className="text-muted-foreground">Current one-time total</span>
                <span className="font-mono font-semibold tabular-nums">
                  {formatCompactCurrency(upfrontCapacityCost + upfrontServerCost)}
                </span>
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recurring subscription</CardTitle>
              <CardDescription>
                Monthly licenses multiplied across the full ownership term.
              </CardDescription>
              <CardAction>
                <Badge variant="secondary">Monthly</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <FieldGroup className="grid grid-cols-1 lg:grid-cols-2">
                <SliderField
                  label="Monthly per core"
                  description={`Applied to ${results.totalCores.toLocaleString()} physical CPU cores each month.`}
                  value={model.software.monthlyPerCore}
                  min={0}
                  max={250}
                  step={1}
                  formatValue={(value) => `${formatCurrency(value, 0)} / core`}
                  onChange={(monthlyPerCore) => updateSoftware({ monthlyPerCore })}
                />
                <SliderField
                  label="Monthly per raw TB"
                  description={`Applied to ${formatCapacity(results.rawCapacityTB)} of installed raw capacity each month.`}
                  value={model.software.monthlyPerRawTB}
                  min={0}
                  max={100}
                  step={0.5}
                  formatValue={(value) => `${formatCurrency(value, value % 1 ? 2 : 0)} / TB`}
                  onChange={(monthlyPerRawTB) =>
                    updateSoftware({ monthlyPerRawTB })
                  }
                />
              </FieldGroup>
            </CardContent>
            <CardFooter className="border-t">
              <div className="flex w-full flex-wrap items-center justify-between gap-3">
                <span className="text-muted-foreground">Current monthly run rate</span>
                <span className="font-mono font-semibold tabular-nums">
                  {formatCompactCurrency(monthlySoftwareRunRate)}
                </span>
              </div>
            </CardFooter>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm">
            <span className="text-muted-foreground">License term and billing basis</span>
            <span className="font-mono font-semibold">
              {model.workload.termYears} years · {results.totalCores.toLocaleString()} cores · {formatCapacity(results.rawCapacityTB)} raw
            </span>
          </div>
        </div>

        <ImpactCard
          title="License rollup"
          items={[
            { label: "Upfront software", value: formatCompactCurrency(results.upfrontSoftware) },
            { label: "Recurring software", value: formatCompactCurrency(results.recurringSoftware) },
            { label: "Total license cost", value: formatCompactCurrency(results.softwareTotal) },
            {
              label: "Per raw TB / month",
              value: formatCurrency(
                results.rawCapacityTB && model.workload.termYears
                  ? results.softwareTotal / results.rawCapacityTB / (model.workload.termYears * 12)
                  : 0,
                2
              ),
            },
          ]}
        />
      </div>
    </div>
  )
}

function WorkloadPage({ model, results, onModelChange }: Omit<ModelPagesProps, "activeSection" | "onSectionChange">) {
  const updateWorkload = (patch: Partial<TcoModel["workload"]>) =>
    onModelChange({ ...model, workload: { ...model.workload, ...patch } })

  const protectionLayout = getProtectionLayout(
    model.workload.protectionScheme,
    model.workload.dataShards,
    model.workload.parityShards
  )
  const hasDriveMix = results.totalDrives > 0
  const durability = calculateDurability(
    protectionLayout,
    results.weightedAfrPercent / 100,
    model.workload.rebuildTimeHours
  )
  const durabilityLabel =
    !hasDriveMix
      ? "Not modeled"
      : durability.nines >= 15
        ? "15+ nines"
        : `${durability.nines} nines`
  const durabilityDecimal =
    !hasDriveMix
      ? "Add drives to a server"
      : durability.nines > 0
      ? `0.${"9".repeat(Math.min(durability.nines, 12))}${durability.nines > 12 ? "…" : ""}`
      : durability.annualDurability.toFixed(4)

  const tbePerRawTb =
    (model.workload.capacityUtilizationPercent / 100 / results.protectionFactor) *
    model.workload.dataReductionRatio

  const selectProtectionScheme = (scheme: ProtectionScheme) => {
    const presets: Record<ProtectionScheme, { dataShards: number; parityShards: number }> = {
      raid5: { dataShards: 4, parityShards: 1 },
      raid6: { dataShards: 8, parityShards: 2 },
      erasure: { dataShards: 10, parityShards: 4 },
    }
    updateWorkload({ protectionScheme: scheme, ...presets[scheme] })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageIntro
        section="workload"
        action={
          <Badge variant="outline" className="font-mono">
            {protectionLayout.label.toUpperCase()} · {durabilityLabel.toUpperCase()}
          </Badge>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheckIcon /> Data protection
              </CardTitle>
              <CardDescription>
                Choose a common protection profile, then tune the shard layout and rebuild window.
              </CardDescription>
              <CardAction>
                <Badge>{protectionLayout.protectionFactor.toFixed(2)}× overhead</Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <Field>
                <FieldLabel>Protection profile</FieldLabel>
                <ToggleGroup
                  value={[model.workload.protectionScheme]}
                  onValueChange={(values) => {
                    const nextScheme = values[0] as ProtectionScheme | undefined
                    if (nextScheme) selectProtectionScheme(nextScheme)
                  }}
                  variant="outline"
                  size="lg"
                  className="grid w-full grid-cols-1 sm:grid-cols-3"
                  aria-label="Protection profile"
                >
                  <ToggleGroupItem
                    value="raid5"
                    className="h-auto min-w-0 flex-col items-start gap-1 px-3 py-3 text-left"
                  >
                    <span className="font-semibold">RAID 5</span>
                    <span className="text-[0.625rem] font-normal text-muted-foreground">Single parity · 4+1 preset</span>
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="raid6"
                    className="h-auto min-w-0 flex-col items-start gap-1 px-3 py-3 text-left"
                  >
                    <span className="font-semibold">RAID 6</span>
                    <span className="text-[0.625rem] font-normal text-muted-foreground">Double parity · 8+2 preset</span>
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="erasure"
                    className="h-auto min-w-0 flex-col items-start gap-1 px-3 py-3 text-left"
                  >
                    <span className="font-semibold">Erasure code</span>
                    <span className="text-[0.625rem] font-normal text-muted-foreground">Flexible parity · 10+4 preset</span>
                  </ToggleGroupItem>
                </ToggleGroup>
                <FieldDescription>
                  RAID parity is fixed by the profile. Erasure coding unlocks the parity slider.
                </FieldDescription>
              </Field>

              <div className="rounded-lg border bg-muted/20 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-medium">Protection set</div>
                    <div className="font-mono text-[0.625rem] text-muted-foreground">
                      {protectionLayout.totalShards} total shards · survives {protectionLayout.parityShards} simultaneous {protectionLayout.parityShards === 1 ? "failure" : "failures"}
                    </div>
                  </div>
                  <Badge variant="secondary" className="font-mono">
                    {protectionLayout.dataShards}+{protectionLayout.parityShards}
                  </Badge>
                </div>
                <div
                  className="flex flex-wrap gap-1.5"
                  aria-label={`${protectionLayout.dataShards} data shards and ${protectionLayout.parityShards} parity ${protectionLayout.parityShards === 1 ? "shard" : "shards"}`}
                >
                  {Array.from({ length: protectionLayout.totalShards }, (_, index) => {
                    const isDataShard = index < protectionLayout.dataShards

                    return (
                      <div
                        key={`shard-${index}`}
                        aria-hidden="true"
                        className={
                          isDataShard
                            ? "flex size-8 items-center justify-center rounded-md border border-primary/30 bg-primary/10 font-mono text-[0.625rem] font-semibold text-primary"
                            : "flex size-8 items-center justify-center rounded-md border border-amber-500/40 bg-amber-500/10 font-mono text-[0.625rem] font-semibold text-amber-600 dark:text-amber-400"
                        }
                      >
                        {isDataShard ? "D" : "P"}
                      </div>
                    )
                  })}
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-[0.625rem] text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-primary/60" /> Data</span>
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-amber-500/70" /> Parity</span>
                </div>
              </div>

              <FieldGroup className="grid grid-cols-1 md:grid-cols-2">
                <SliderField
                  label="Data shards"
                  description="Minimum number of shards required to reconstruct the data."
                  value={protectionLayout.dataShards}
                  min={2}
                  max={20}
                  step={1}
                  suffix=" data"
                  onChange={(dataShards) => updateWorkload({ dataShards })}
                />
                <SliderField
                  label="Parity shards"
                  description={
                    model.workload.protectionScheme === "erasure"
                      ? "Failures the protection set can tolerate before data loss."
                      : `${model.workload.protectionScheme === "raid5" ? "RAID 5" : "RAID 6"} fixes this value at ${protectionLayout.parityShards}.`
                  }
                  value={protectionLayout.parityShards}
                  min={1}
                  max={10}
                  step={1}
                  suffix=" parity"
                  disabled={model.workload.protectionScheme !== "erasure"}
                  onChange={(parityShards) => updateWorkload({ parityShards })}
                />
                <SliderField
                  label="Rebuild window"
                  description="Time a degraded protection set remains exposed while a shard is replaced."
                  value={model.workload.rebuildTimeHours}
                  min={1}
                  max={168}
                  step={1}
                  suffix=" hours"
                  onChange={(rebuildTimeHours) => updateWorkload({ rebuildTimeHours })}
                />
                <SliderField
                  label="Deployment term"
                  description="Economic analysis period used for acquisition and operating costs."
                  value={model.workload.termYears}
                  min={1}
                  max={7}
                  step={1}
                  suffix=" years"
                  onChange={(termYears) => updateWorkload({ termYears })}
                />
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Annual durability</CardTitle>
              <CardDescription>
                Probability of retaining a single protection set through one year.
              </CardDescription>
              <CardAction>
                <Badge variant={hasDriveMix && durability.nines >= 6 ? "default" : "secondary"}>
                  {durabilityLabel}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="grid gap-3 md:grid-cols-3">
                <Card size="sm" className="bg-muted/20">
                  <CardHeader>
                    <CardDescription>Annual durability</CardDescription>
                    <CardTitle className="font-mono text-xl">{durabilityLabel}</CardTitle>
                  </CardHeader>
                  <CardContent className="font-mono text-[0.625rem] text-muted-foreground">
                    {durabilityDecimal}
                  </CardContent>
                </Card>
                <Card size="sm" className="bg-muted/20">
                  <CardHeader>
                    <CardDescription>Annual loss odds</CardDescription>
                    <CardTitle className="font-mono text-xl">
                      {hasDriveMix ? durability.annualOdds : "—"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="font-mono text-[0.625rem] text-muted-foreground">
                    {hasDriveMix
                      ? `${durability.annualLossRate.toExponential(2)} per year`
                      : "No server drive mix"}
                  </CardContent>
                </Card>
                <Card size="sm" className="bg-muted/20">
                  <CardHeader>
                    <CardDescription>Loss threshold</CardDescription>
                    <CardTitle className="font-mono text-xl">
                      {durability.failureThreshold} failed shards
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="font-mono text-[0.625rem] text-muted-foreground">
                    Within one {model.workload.rebuildTimeHours}-hour rebuild window
                  </CardContent>
                </Card>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3 text-xs font-medium">
                  <span>Durability scale</span>
                  <span className="font-mono text-muted-foreground">
                    {hasDriveMix ? `${durability.nines} / 15 nines` : "—"}
                  </span>
                </div>
                <Progress
                  value={hasDriveMix ? (durability.nines / 15) * 100 : 0}
                  aria-label="Annual durability nines"
                />
              </div>
            </CardContent>
            <CardFooter className="border-t">
              <span className="text-[0.625rem] leading-relaxed text-muted-foreground">
                {hasDriveMix
                  ? `Binomial rebuild-window model using the server mix's count-weighted ${results.weightedAfrPercent.toFixed(2)}% AFR, independent shard failures, and a ${model.workload.rebuildTimeHours}-hour rebuild. Result is per protection set.`
                  : "Add at least one configured drive profile to Server Config to calculate durability."}
              </span>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Capacity & activity profile</CardTitle>
              <CardDescription>Use workload-aware values to calculate usable capacity and energy.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <SliderField
                  label="Capacity utilization"
                  description="Share of raw TB used for planned data placement."
                  value={model.workload.capacityUtilizationPercent}
                  min={10}
                  max={100}
                  onChange={(capacityUtilizationPercent) =>
                    updateWorkload({ capacityUtilizationPercent })
                  }
                />
                <SliderField
                  label="Active duty cycle"
                  description="Blends drive active and idle power for the average IT load."
                  value={model.workload.activeDutyCyclePercent}
                  min={0}
                  max={100}
                  onChange={(activeDutyCyclePercent) =>
                    updateWorkload({ activeDutyCyclePercent })
                  }
                />
                <SliderField
                  label="Data reduction ratio"
                  description="Compression and deduplication multiplier applied after protection."
                  value={model.workload.dataReductionRatio}
                  min={1}
                  max={5}
                  step={0.1}
                  suffix="×"
                  onChange={(dataReductionRatio) => updateWorkload({ dataReductionRatio })}
                />
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Capacity bridge</CardTitle>
              <CardDescription>
                The complete calculation from installed raw TB to effective TBe.
              </CardDescription>
              <CardAction>
                <Badge variant="secondary">TB → TBe</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: "Raw TB",
                    value: formatCapacity(results.rawCapacityTB),
                    hint: "Installed media capacity",
                  },
                  {
                    label: "Utilized TB",
                    value: formatCapacity(results.utilizedCapacityTB),
                    hint: `× ${model.workload.capacityUtilizationPercent}% utilization`,
                  },
                  {
                    label: "Protected TB",
                    value: formatCapacity(results.protectedCapacityTB),
                    hint: `÷ ${results.protectionFactor.toFixed(2)} protection factor`,
                  },
                  {
                    label: "Effective TBe",
                    value: formatEffectiveCapacity(results.effectiveCapacityTB),
                    hint: `× ${model.workload.dataReductionRatio} data reduction`,
                  },
                ].map((stage, index) => (
                  <div className="flex min-w-0 items-center gap-3" key={stage.label}>
                    <Card size="sm" className="min-w-0 flex-1">
                      <CardHeader>
                        <CardDescription>{stage.label}</CardDescription>
                        <CardTitle className="font-mono text-xl tabular-nums">
                          {stage.value}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="font-mono text-[0.625rem] text-muted-foreground">
                        {stage.hint}
                      </CardContent>
                    </Card>
                    {index < 3 ? (
                      <ArrowRightIcon className="hidden shrink-0 text-muted-foreground xl:block" />
                    ) : null}
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-3 border-t">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium">TB → TBe summary</span>
                  <span className="font-mono text-[0.625rem] text-muted-foreground">
                    Raw TB × utilization ÷ protection factor × data reduction
                  </span>
                </div>
                <Badge className="font-mono">
                  1 raw TB = {tbePerRawTb.toFixed(2)} TBe
                </Badge>
              </div>
              <Separator />
              <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs tabular-nums">
                <span>
                  {formatCapacity(results.rawCapacityTB)} × {model.workload.capacityUtilizationPercent}% ÷ {results.protectionFactor.toFixed(2)} × {model.workload.dataReductionRatio}
                </span>
                <span className="font-semibold">
                  = {formatEffectiveCapacity(results.effectiveCapacityTB)}
                </span>
              </div>
            </CardFooter>
          </Card>
        </div>

        <ImpactCard
          items={[
            { label: "Protection", value: protectionLayout.label },
            { label: "Annual durability", value: durabilityLabel },
            { label: "Raw capacity", value: formatCapacity(results.rawCapacityTB) },
            { label: "Effective capacity", value: formatEffectiveCapacity(results.effectiveCapacityTB) },
            { label: "Average IT load", value: formatPower(results.averageItPowerWatts) },
            { label: "Annual energy", value: `${Math.round(results.annualEnergyKwh).toLocaleString()} kWh` },
            { label: "TCO / effective TB", value: formatCurrency(results.tcoPerEffectiveTB, 2) },
          ]}
        />
      </div>
    </div>
  )
}

function OpexPage({ model, results, onModelChange }: Omit<ModelPagesProps, "activeSection" | "onSectionChange">) {
  const updateOpex = (patch: Partial<TcoModel["opex"]>) =>
    onModelChange({ ...model, opex: { ...model.opex, ...patch } })

  const facilityPowerKw =
    (results.averageItPowerWatts / 1000) * model.opex.pue
  const monthlyInternetCost =
    model.opex.internetBandwidthGbps * model.opex.internetPerGbpsMonth
  const termMonths = model.workload.termYears * 12

  return (
    <div className="flex flex-col gap-6">
      <PageIntro
        section="opex"
        action={
          <Badge variant="secondary">
            {results.provisionedPowerKw.toFixed(2)} kW MAX provisioned
          </Badge>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Peak-power colocation</CardTitle>
              <CardDescription>
                Colo is billed against provisioned maximum IT power, independent of average energy use.
              </CardDescription>
              <CardAction>
                <Badge variant="secondary">MAX power contract</Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <FieldGroup>
                <SliderField
                  label="Colo rate for provisioned MAX power"
                  description={`Applied to the model's exact ${results.provisionedPowerKw.toFixed(2)} kW maximum IT load every month.`}
                  value={model.opex.coloPerKwMonth}
                  min={0}
                  max={500}
                  step={5}
                  formatValue={(value) => `${formatCurrency(value)} / kW / mo`}
                  onChange={(coloPerKwMonth) => updateOpex({ coloPerKwMonth })}
                />
              </FieldGroup>
              <div className="grid gap-3 sm:grid-cols-3">
                <Card size="sm">
                  <CardHeader>
                    <CardDescription>Provisioned MAX IT</CardDescription>
                    <CardTitle className="font-mono text-lg tabular-nums">
                      {results.provisionedPowerKw.toFixed(2)} kW
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-[0.625rem] text-muted-foreground">
                    Peak server, drive, NIC, and switch draw
                  </CardContent>
                </Card>
                <Card size="sm">
                  <CardHeader>
                    <CardDescription>Contract rate</CardDescription>
                    <CardTitle className="font-mono text-lg tabular-nums">
                      {formatCurrency(model.opex.coloPerKwMonth)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-[0.625rem] text-muted-foreground">
                    Per provisioned kW each month
                  </CardContent>
                </Card>
                <Card size="sm">
                  <CardHeader>
                    <CardDescription>Monthly colo</CardDescription>
                    <CardTitle className="font-mono text-lg tabular-nums">
                      {formatCurrency(results.monthlyColoCost, 2)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-[0.625rem] text-muted-foreground">
                    Before usage-based electricity
                  </CardContent>
                </Card>
              </div>
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-2 border-t">
              <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs tabular-nums">
                <span>
                  {results.provisionedPowerKw.toFixed(2)} kW × {formatCurrency(model.opex.coloPerKwMonth)} / kW / mo
                </span>
                <span className="font-semibold">
                  = {formatCurrency(results.monthlyColoCost, 2)} / month
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-[0.625rem] text-muted-foreground">
                <span>{termMonths} contract months</span>
                <span>{formatCurrency(results.coloSpaceTotal)} term colocation</span>
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Internet bandwidth</CardTitle>
              <CardDescription>
                Cluster-wide committed Internet service, separate from storage fabric and colocation power.
              </CardDescription>
              <CardAction>
                <Badge variant="secondary">Committed monthly</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <FieldGroup className="grid grid-cols-1 lg:grid-cols-2">
                <ChoiceSliderField
                  label="Provisioned Internet bandwidth"
                  description="Cluster-wide committed Internet bandwidth, separate from the storage fabric."
                  value={model.opex.internetBandwidthGbps}
                  choices={[0, 1, 10, 25, 40, 50, 100, 200, 400, 800, 1000]}
                  formatValue={(value) => `${value.toLocaleString()} Gb/s`}
                  onChange={(internetBandwidthGbps) =>
                    updateOpex({ internetBandwidthGbps })
                  }
                />
                <SliderField
                  label="Internet bandwidth rate"
                  description="Monthly carrier or blended-transit cost per committed gigabit."
                  value={model.opex.internetPerGbpsMonth}
                  min={0}
                  max={1000}
                  step={10}
                  formatValue={(value) => `${formatCurrency(value)} / Gb/s / mo`}
                  onChange={(internetPerGbpsMonth) =>
                    updateOpex({ internetPerGbpsMonth })
                  }
                />
              </FieldGroup>
            </CardContent>
            <CardFooter className="border-t">
              <div className="flex w-full flex-wrap items-center justify-between gap-3">
                <span className="text-muted-foreground">Internet run rate</span>
                <span className="font-mono font-semibold tabular-nums">
                  {formatCompactCurrency(monthlyInternetCost)} / month
                </span>
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metered power</CardTitle>
              <CardDescription>
                Average IT usage is converted to facility energy using the PUE multiplier.
              </CardDescription>
              <CardAction>
                <Badge variant="secondary">Usage based</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <FieldGroup className="grid grid-cols-1 lg:grid-cols-2">
                <SliderField
                  label="Electricity rate"
                  description="Blended utility rate applied to PUE-adjusted facility energy."
                  value={model.opex.electricityPerKwh}
                  min={0}
                  max={1}
                  step={0.01}
                  formatValue={(value) => `${formatCurrency(value, 2)} / kWh`}
                  onChange={(electricityPerKwh) =>
                    updateOpex({ electricityPerKwh })
                  }
                />
                <SliderField
                  label="Power usage effectiveness"
                  description={`${formatPower(results.averageItPowerWatts)} average IT load becomes ${facilityPowerKw.toFixed(1)} kW at the facility meter.`}
                  value={model.opex.pue}
                  min={1}
                  max={2.5}
                  step={0.01}
                  formatValue={(value) => `${value.toFixed(2)} PUE`}
                  onChange={(pue) => updateOpex({ pue })}
                />
              </FieldGroup>
            </CardContent>
            <CardFooter className="border-t">
              <div className="flex w-full flex-wrap items-center justify-between gap-3">
                <span className="text-muted-foreground">Annual facility energy</span>
                <span className="font-mono font-semibold tabular-nums">
                  {Math.round(results.annualEnergyKwh).toLocaleString()} kWh
                </span>
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Support & operations</CardTitle>
              <CardDescription>Use loaded estimates for staffing, support, and replacement handling.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup className="grid grid-cols-1 md:grid-cols-2">
                <SliderField
                  label="Storage administration"
                  description="Annual loaded staffing and operational ownership cost."
                  value={model.opex.annualAdminCost}
                  min={0}
                  max={500000}
                  step={1000}
                  formatValue={(value) => `${formatCompactCurrency(value)} / year`}
                  onChange={(annualAdminCost) => updateOpex({ annualAdminCost })}
                />
                <SliderField
                  label="Annual hardware support"
                  description="Annual support contract as a percentage of hardware acquisition."
                  value={model.opex.annualHardwareSupportPercent}
                  min={0}
                  max={25}
                  step={0.5}
                  onChange={(annualHardwareSupportPercent) =>
                    updateOpex({ annualHardwareSupportPercent })
                  }
                />
                <SliderField
                  label="Replacement labor per drive"
                  description="Hands-on handling cost added to each AFR-driven drive replacement."
                  value={model.opex.driveReplacementLabor}
                  min={0}
                  max={1000}
                  step={25}
                  formatValue={(value) => `${formatCurrency(value)} / drive`}
                  onChange={(driveReplacementLabor) => updateOpex({ driveReplacementLabor })}
                />
              </FieldGroup>
            </CardContent>
          </Card>
        </div>

        <ImpactCard
          title="OpEx rollup"
          items={[
            { label: "Colo rate", value: `${formatCurrency(model.opex.coloPerKwMonth)} / kW / mo` },
            { label: "Provisioned MAX IT", value: `${results.provisionedPowerKw.toFixed(2)} kW` },
            { label: "Monthly colocation", value: formatCurrency(results.monthlyColoCost, 2) },
            { label: "Energy", value: formatCompactCurrency(results.electricityTotal) },
            { label: "Term colocation", value: formatCompactCurrency(results.coloSpaceTotal) },
            { label: "Internet bandwidth", value: formatCompactCurrency(results.networkOpexTotal) },
            { label: "Drive replacements", value: formatCompactCurrency(results.replacementTotal) },
            { label: "Hardware support", value: formatCompactCurrency(results.supportTotal) },
            { label: "Administration", value: formatCompactCurrency(results.adminTotal) },
            { label: "Total OpEx", value: formatCompactCurrency(results.operationsTotal) },
          ]}
          footer={
            <span className="text-[0.625rem] leading-relaxed text-muted-foreground">
              Colocation = exact MAX provisioned IT kW × monthly contract rate. Electricity remains average IT load × PUE × metered $/kWh.
            </span>
          }
        />
      </div>
    </div>
  )
}

const chartConfig = {
  hardware: { label: "Hardware", color: "var(--chart-1)" },
  software: { label: "Software", color: "var(--chart-3)" },
  operations: { label: "Operations", color: "var(--chart-5)" },
} satisfies ChartConfig

function SummaryPage({ results, model, onSectionChange }: Pick<ModelPagesProps, "results" | "model" | "onSectionChange">) {
  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="absolute -top-16 -right-16 size-52 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex max-w-4xl flex-col gap-5">
          <Badge className="gap-1">
            <SparklesIcon data-icon="inline-start" />
            SNIA 2.0 model · enhanced
          </Badge>
          <div className="flex flex-col gap-3">
            <h1 className="max-w-3xl font-heading text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
              See the economics behind every effective terabyte.
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              A transparent storage TCO model spanning media, node design, cluster fabric, workload efficiency, software, and operations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => onSectionChange("drive")}>
              Tune the model
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
            <Badge variant="outline" className="font-mono">
              {model.workload.termYears}-YEAR TERM
            </Badge>
            <Badge variant="outline" className="font-mono">
              {model.cluster.serverCount} NODES
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric
          label="Effective capacity"
          value={formatEffectiveCapacity(results.effectiveCapacityTB)}
          hint={`${formatCapacity(results.rawCapacityTB)} raw after utilization, protection, and data reduction.`}
          icon={DatabaseIcon}
        />
        <SummaryMetric
          label={`${model.workload.termYears}-year TCO`}
          value={formatCompactCurrency(results.tco)}
          hint={`${results.capexPercent.toFixed(0)}% acquired upfront; ${formatCompactCurrency(results.annualizedTco)} annualized.`}
          icon={ReceiptTextIcon}
        />
        <SummaryMetric
          label="Cost / effective TB / mo"
          value={formatCurrency(results.tcoPerEffectiveTBMonth, 2)}
          hint={`${formatCurrency(results.tcoPerEffectiveTB, 2)} per effective TB across the full term.`}
          icon={GaugeIcon}
        />
        <SummaryMetric
          label="Average IT power"
          value={formatPower(results.averageItPowerWatts)}
          hint={`${Math.round(results.annualEnergyKwh).toLocaleString()} kWh annually after ${model.opex.pue.toFixed(2)} PUE.`}
          icon={ZapIcon}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Cost through the deployment</CardTitle>
            <CardDescription>Acquisition is separated from recurring annual run rate.</CardDescription>
            <CardAction>
              <Badge variant="secondary">{formatCompactCurrency(results.tco)} total</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-72 w-full">
              <BarChart data={results.annualCosts} accessibilityLayer margin={{ left: 8, right: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: number) => `$${Math.round(value / 1000)}k`}
                  width={54}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <Bar dataKey="hardware" stackId="cost" fill="var(--color-hardware)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="software" stackId="cost" fill="var(--color-software)" />
                <Bar dataKey="operations" stackId="cost" fill="var(--color-operations)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost mix</CardTitle>
            <CardDescription>Share of total cost by economic category.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {results.categories.map((category) => {
              const share = results.tco ? (category.value / results.tco) * 100 : 0

              return (
                <div className="flex flex-col gap-2" key={category.key}>
                  <div className="flex items-center justify-between gap-3 text-xs font-medium">
                    <span>{category.name}</span>
                    <span className="font-mono text-muted-foreground">
                      {share.toFixed(0)}% · {formatCompactCurrency(category.value)}
                    </span>
                  </div>
                  <Progress value={share} aria-label={`${category.name} share of total cost`} />
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Auditable cost ledger</CardTitle>
            <CardDescription>Every output is traceable to a visible configuration input.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cost line</TableHead>
                  <TableHead>Basis</TableHead>
                  <TableHead className="text-right">Term total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  ["Drive acquisition", `${results.totalDrives.toLocaleString()} drives`, results.driveCapex],
                  ["Server acquisition", `${model.cluster.serverCount} nodes`, results.serverCapex],
                  ["Network acquisition", "64-port 800G switches + breakout optics", results.networkCapex],
                  ["Software licenses", "Upfront + recurring", results.softwareTotal],
                  ["Electricity", `${Math.round(results.annualEnergyKwh).toLocaleString()} kWh / year`, results.electricityTotal],
                  [
                    "Colocation",
                    `${results.provisionedPowerKw.toFixed(2)} MAX kW × ${formatCurrency(model.opex.coloPerKwMonth)} / kW / mo`,
                    results.coloSpaceTotal,
                  ],
                  ["Internet bandwidth", `${model.opex.internetBandwidthGbps.toLocaleString()} Gb/s committed`, results.networkOpexTotal],
                  ["Support & operations", "Replacement + support + admin", results.replacementTotal + results.supportTotal + results.adminTotal],
                ].map(([name, basis, value]) => (
                  <TableRow key={String(name)}>
                    <TableCell className="font-medium">{name}</TableCell>
                    <TableCell className="text-muted-foreground">{basis}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(Number(value))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2}>Total cost of ownership</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(results.tco)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration path</CardTitle>
            <CardDescription>Your model, from media to decision.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {[
              {
                id: "drive" as const,
                icon: HardDriveIcon,
                label: model.drives.length
                  ? `${model.drives.length} drive ${model.drives.length === 1 ? "profile" : "profiles"}`
                  : "No drive profiles",
                value: `${results.totalDrives} drives deployed`,
              },
              {
                id: "server" as const,
                icon: ServerIcon,
                label: model.server.name,
                value: `${results.drivesPerServer} drives · ${results.hostPortsPerServer} × ${model.server.nicSpeedGbps}G / node`,
              },
              { id: "cluster" as const, icon: NetworkIcon, label: "Cluster & fabric", value: `${model.cluster.serverCount} nodes · ${model.cluster.switchCount} × 64p 800G` },
              { id: "workload" as const, icon: Layers3Icon, label: "Workload efficiency", value: `${model.workload.dataReductionRatio}× reduction` },
              {
                id: "opex" as const,
                icon: ZapIcon,
                label: "Operations",
                value: `${formatCurrency(model.opex.coloPerKwMonth)} / kW / mo colo`,
              },
            ].map((item) => {
              const Icon = item.icon

              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className="h-auto justify-start py-2 text-left"
                  onClick={() => onSectionChange(item.id)}
                >
                  <Icon data-icon="inline-start" />
                  <span className="flex min-w-0 flex-1 flex-col items-start">
                    <span className="truncate">{item.label}</span>
                    <span className="font-mono text-[0.625rem] font-normal text-muted-foreground">
                      {item.value}
                    </span>
                  </span>
                  <ArrowRightIcon data-icon="inline-end" />
                </Button>
              )
            })}
          </CardContent>
          <CardFooter className="border-t">
            <div className="flex items-center gap-2 text-[0.625rem] text-muted-foreground">
              <Clock3Icon />
              Recalculates instantly as assumptions change.
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export function ModelPages(props: ModelPagesProps) {
  const shared = {
    model: props.model,
    results: props.results,
    onModelChange: props.onModelChange,
  }

  switch (props.activeSection) {
    case "drive":
      return <DrivePage {...shared} />
    case "server":
      return <ServerPage {...shared} onSectionChange={props.onSectionChange} />
    case "cluster":
      return <ClusterPage {...shared} />
    case "software":
      return <SoftwarePage {...shared} />
    case "workload":
      return <WorkloadPage {...shared} />
    case "opex":
      return <OpexPage {...shared} />
    case "summary":
      return (
        <SummaryPage
          model={props.model}
          results={props.results}
          onSectionChange={props.onSectionChange}
        />
      )
  }
}
