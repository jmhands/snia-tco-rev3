import { useState, type ReactNode } from "react"
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  BookmarkPlusIcon,
  ChevronDownIcon,
  CircuitBoardIcon,
  Clock3Icon,
  DatabaseIcon,
  DiscIcon,
  GaugeIcon,
  GitCompareArrowsIcon,
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
  Label,
  Pie,
  PieChart,
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
  DropdownMenuSeparator,
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
import { Input } from "@workspace/ui/components/input"
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
  DRIVE_INTERFACES,
  DRIVE_PRESETS,
  HDD_CAPACITY_STEPS,
  NVME_CAPACITY_STEPS,
  REFERENCE_SWITCH_PORTS,
  REFERENCE_SWITCH_SPEED_GBPS,
  SECTION_META,
  calculateTco,
  formatCapacity,
  formatCompactCurrency,
  formatCurrency,
  formatPower,
  type CableType,
  type DriveConfig,
  type DriveMedium,
  type DrivePreset,
  type NicSpeedGbps,
  type SavedScenario,
  type SectionId,
  type SwitchPortCount,
  type SwitchSpeedGbps,
  type TcoModel,
  type TcoResults,
} from "@/lib/tco-model"
import {
  calculateDurability,
  getProtectionLayout,
  type FailureDomain,
  type ProtectionScheme,
} from "@/lib/durability"

type ModelPagesProps = {
  activeSection: SectionId
  model: TcoModel
  results: TcoResults
  scenarios?: SavedScenario[]
  comparisonScenario?: SavedScenario | null
  onCompareScenario?: (id: string | null) => void
  onLoadScenario?: (scenario: SavedScenario) => void
  onSaveScenario?: () => void
  onModelChange: (model: TcoModel) => void
  onSectionChange: (section: SectionId) => void
}

function formatDriveCapacity(value: number) {
  if (value < 1) {
    return `${Math.round(value * 1000)} GB`
  }
  return Number.isInteger(value) ? `${value} TB` : `${value.toFixed(2)} TB`
}

function formatEffectiveCapacity(tb: number) {
  return formatCapacity(tb).replace(" PB", " PBe").replace(" TB", " TBe")
}

function formatBandwidth(gbps: number) {
  return gbps >= 1000
    ? `${(gbps / 1000).toFixed(gbps % 1000 ? 1 : 0)} Tb/s`
    : `${gbps.toLocaleString()} Gb/s`
}

function PageIntro({
  section,
  action,
}: {
  section: SectionId
  action?: ReactNode
}) {
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
  const [isEditing, setIsEditing] = useState(false)
  const [draftValue, setDraftValue] = useState(String(value))

  const commitDraft = () => {
    setIsEditing(false)
    const parsed = Number(draftValue)
    if (!Number.isFinite(parsed)) return
    const clamped = Math.min(Math.max(parsed, min), max)
    onChange(clamped)
  }

  return (
    <Field>
      <div className="flex items-center justify-between gap-3">
        <FieldLabel>{label}</FieldLabel>
        {isEditing && !disabled ? (
          <Input
            type="number"
            min={min}
            max={max}
            step={step}
            autoFocus
            value={draftValue}
            onChange={(event) => setDraftValue(event.target.value)}
            onBlur={commitDraft}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                commitDraft()
              } else if (event.key === "Escape") {
                setIsEditing(false)
              }
            }}
            className="h-6 w-28 px-2 py-0 text-right font-mono text-xs"
            aria-label={`Enter exact ${label}`}
          />
        ) : (
          <Badge
            variant="outline"
            className={
              disabled
                ? "font-mono"
                : "cursor-pointer font-mono hover:border-primary/60 hover:bg-muted/60"
            }
            title={disabled ? undefined : "Click to enter an exact number"}
            onClick={() => {
              if (!disabled) {
                setDraftValue(String(value))
                setIsEditing(true)
              }
            }}
          >
            {formatValue ? formatValue(value) : `${value}${suffix}`}
          </Badge>
        )}
      </div>
      <Slider
        aria-label={label}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        value={[value]}
        onValueChange={(nextValue) =>
          onChange(
            Array.isArray(nextValue) ? (nextValue[0] ?? value) : nextValue
          )
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
  customMin = 0,
  customMax = 10000,
  customStep = 0.01,
  formatValue,
  onChange,
}: {
  label: string
  description: string
  value: number
  choices: number[]
  customMin?: number
  customMax?: number
  customStep?: number
  formatValue: (value: number) => string
  onChange: (value: number) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [draftValue, setDraftValue] = useState(String(value))

  const selectedIndex = choices.reduce((nearestIndex, choice, index) => {
    return Math.abs(choice - value) < Math.abs(choices[nearestIndex]! - value)
      ? index
      : nearestIndex
  }, 0)

  const commitDraft = () => {
    setIsEditing(false)
    const parsed = Number(draftValue)
    if (!Number.isFinite(parsed)) return
    const clamped = Math.min(Math.max(parsed, customMin), customMax)
    onChange(clamped)
  }

  return (
    <Field>
      <div className="flex items-center justify-between gap-3">
        <FieldLabel>{label}</FieldLabel>
        {isEditing ? (
          <Input
            type="number"
            min={customMin}
            max={customMax}
            step={customStep}
            autoFocus
            value={draftValue}
            onChange={(event) => setDraftValue(event.target.value)}
            onBlur={commitDraft}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                commitDraft()
              } else if (event.key === "Escape") {
                setIsEditing(false)
              }
            }}
            className="h-6 w-28 px-2 py-0 text-right font-mono text-xs"
            aria-label={`Enter exact ${label}`}
          />
        ) : (
          <Badge
            variant="outline"
            className="cursor-pointer font-mono hover:border-primary/60 hover:bg-muted/60"
            title="Click to enter an exact number"
            onClick={() => {
              setDraftValue(String(value))
              setIsEditing(true)
            }}
          >
            {formatValue(value)}
          </Badge>
        )}
      </div>
      <Slider
        aria-label={label}
        min={0}
        max={choices.length - 1}
        step={1}
        value={[selectedIndex]}
        onValueChange={(nextValue) => {
          const index = Array.isArray(nextValue)
            ? (nextValue[0] ?? selectedIndex)
            : nextValue
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
  deltaBadge,
  icon: Icon,
}: {
  label: string
  value: string
  hint: string
  deltaBadge?: ReactNode
  icon: typeof DatabaseIcon
}) {
  return (
    <Card className="transition-transform duration-200 hover:-translate-y-0.5">
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <Icon />
          {label}
        </CardDescription>
        <CardTitle className="font-mono text-xl font-semibold tabular-nums">
          {value}
        </CardTitle>
        {deltaBadge ? <CardAction>{deltaBadge}</CardAction> : null}
      </CardHeader>
      <CardContent>
        <p className="text-[0.625rem] leading-relaxed text-muted-foreground">
          {hint}
        </p>
      </CardContent>
    </Card>
  )
}

function isAutoGeneratedDriveName(name: string): boolean {
  return /^(\d+(\.\d+)?\s*(TB|GB)\s+(NVMe|QLC NVMe|Nearline HDD|HAMR HDD|Dual-Actuator HDD|HDD)(\s+\d+)?)$/i.test(
    name.trim()
  )
}

function buildDefaultDriveName(
  medium: DriveMedium,
  capacityTB: number,
  sequence?: number
) {
  const capLabel = formatDriveCapacity(capacityTB)
  const mediumLabel = medium === "HDD" ? "Nearline HDD" : "NVMe"
  const suffix =
    sequence && sequence > 1 ? ` ${String(sequence).padStart(2, "0")}` : ""
  return `${capLabel} ${mediumLabel}${suffix}`
}

function DrivePage({
  model,
  results,
  onModelChange,
}: Omit<ModelPagesProps, "activeSection" | "onSectionChange">) {
  const [selectedDriveId, setSelectedDriveId] = useState<string | null>(
    model.drives[0]?.id ?? null
  )
  const selectedDrive =
    model.drives.find((drive) => drive.id === selectedDriveId) ??
    model.drives[0]

  const updateDrive = (patch: Partial<DriveConfig>) => {
    if (!selectedDrive) return

    const nextMedium = patch.medium ?? selectedDrive.medium
    const nextCapacity = patch.capacityTB ?? selectedDrive.capacityTB
    const shouldAutoRename =
      patch.name === undefined &&
      (patch.medium !== undefined || patch.capacityTB !== undefined) &&
      isAutoGeneratedDriveName(selectedDrive.name)

    const resolvedName = shouldAutoRename
      ? buildDefaultDriveName(nextMedium, nextCapacity)
      : (patch.name ?? selectedDrive.name)

    onModelChange({
      ...model,
      drives: model.drives.map((drive) =>
        drive.id === selectedDrive.id
          ? { ...drive, ...patch, name: resolvedName }
          : drive
      ),
    })
  }

  const switchDriveMedium = (medium: DriveMedium) => {
    if (!selectedDrive || selectedDrive.medium === medium) return

    if (medium === "HDD") {
      updateDrive({
        medium: "HDD",
        interface: "SATA 6G",
        capacityTB: 24,
        costPerTB: 18,
        activeWatts: 9.5,
        idleWatts: 5.5,
        afrPercent: 0.95,
      })
    } else {
      updateDrive({
        medium: "NVMe SSD",
        interface: "PCIe Gen5",
        capacityTB: 15.36,
        costPerTB: 350,
        activeWatts: 15,
        idleWatts: 3,
        afrPercent: 0.44,
      })
    }
  }

  const addDriveFromPreset = (preset: DrivePreset) => {
    const id = `${preset.presetKey}-${Date.now()}`
    const duplicateCount = model.drives.filter((drive) =>
      drive.name.startsWith(preset.name)
    ).length
    const newDrive: DriveConfig = {
      id,
      name:
        duplicateCount === 0
          ? preset.name
          : `${preset.name} ${String(duplicateCount + 1).padStart(2, "0")}`,
      medium: preset.medium,
      interface: preset.interface,
      capacityTB: preset.capacityTB,
      activeWatts: preset.activeWatts,
      idleWatts: preset.idleWatts,
      afrPercent: preset.afrPercent,
      costPerTB: preset.costPerTB,
    }
    setSelectedDriveId(id)
    onModelChange({
      ...model,
      drives: [...model.drives, newDrive],
      server: model.server.driveAllocations.length
        ? model.server
        : {
            ...model.server,
            driveAllocations: [
              { driveId: id, count: preset.medium === "HDD" ? 60 : 24 },
            ],
          },
    })
  }

  const deleteDrive = (driveId: string) => {
    const remainingDrives = model.drives.filter((drive) => drive.id !== driveId)
    const remainingAllocations = model.server.driveAllocations.filter(
      (allocation) => allocation.driveId !== driveId
    )
    if (selectedDrive?.id === driveId) {
      setSelectedDriveId(remainingDrives[0]?.id ?? null)
    }
    onModelChange({
      ...model,
      drives: remainingDrives,
      server: {
        ...model.server,
        driveAllocations: remainingAllocations,
      },
    })
  }

  const selectedDrivesPerServer = selectedDrive
    ? (model.server.driveAllocations.find(
        (allocation) => allocation.driveId === selectedDrive.id
      )?.count ?? 0)
    : 0
  const selectedTotalDrives =
    selectedDrivesPerServer * model.cluster.serverCount
  const selectedUnitCost = selectedDrive
    ? selectedDrive.capacityTB * selectedDrive.costPerTB
    : 0
  const selectedRawCapacityTB = selectedDrive
    ? selectedTotalDrives * selectedDrive.capacityTB
    : 0
  const selectedAcquisitionCost = selectedTotalDrives * selectedUnitCost
  const capacityChoices =
    selectedDrive?.medium === "HDD" ? HDD_CAPACITY_STEPS : NVME_CAPACITY_STEPS
  const interfaceChoices = selectedDrive
    ? DRIVE_INTERFACES[selectedDrive.medium]
    : DRIVE_INTERFACES["NVMe SSD"]

  return (
    <div className="flex flex-col gap-6">
      <PageIntro
        section="drive"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => addDriveFromPreset(DRIVE_PRESETS[3]!)}
            >
              <DiscIcon data-icon="inline-start" />
              Add 24 TB HDD
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button />}>
                <PlusIcon data-icon="inline-start" />
                Add media profile
                <ChevronDownIcon data-icon="inline-end" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>NVMe Flash SSDs</DropdownMenuLabel>
                  {DRIVE_PRESETS.filter(
                    (preset) => preset.medium === "NVMe SSD"
                  ).map((preset) => (
                    <DropdownMenuItem
                      key={preset.presetKey}
                      onClick={() => addDriveFromPreset(preset)}
                    >
                      <HardDriveIcon />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="font-medium">{preset.name}</span>
                        <span className="text-[0.625rem] text-muted-foreground">
                          {preset.summary} · {formatCurrency(preset.costPerTB)}
                          /TB
                        </span>
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    Enterprise Hard Drives (HDD)
                  </DropdownMenuLabel>
                  {DRIVE_PRESETS.filter(
                    (preset) => preset.medium === "HDD"
                  ).map((preset) => (
                    <DropdownMenuItem
                      key={preset.presetKey}
                      onClick={() => addDriveFromPreset(preset)}
                    >
                      <DiscIcon />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="font-medium">{preset.name}</span>
                        <span className="text-[0.625rem] text-muted-foreground">
                          {preset.summary} · {formatCurrency(preset.costPerTB)}
                          /TB
                        </span>
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Drive library</CardTitle>
              <CardDescription>
                Create NVMe SSD and Hard Drive (HDD) profiles here, then combine
                any mix of them in Server Config.
              </CardDescription>
              <CardAction>
                <Badge variant="secondary">
                  {model.drives.length}{" "}
                  {model.drives.length === 1 ? "profile" : "profiles"}
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
                        <TableRow
                          key={drive.id}
                          data-state={selected ? "selected" : undefined}
                        >
                          <TableCell>
                            <div className="flex min-w-40 flex-col gap-0.5">
                              <span className="flex items-center gap-1.5 font-medium">
                                {drive.name}
                                <Badge
                                  variant={
                                    drive.medium === "HDD"
                                      ? "outline"
                                      : "secondary"
                                  }
                                  className="text-[0.55rem]"
                                >
                                  {drive.medium}
                                </Badge>
                              </span>
                              <span className="font-mono text-[0.625rem] text-muted-foreground">
                                {drive.interface} ·{" "}
                                {drive.afrPercent.toFixed(2)}% AFR
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">
                            {formatDriveCapacity(drive.capacityTB)}
                          </TableCell>
                          <TableCell className="font-mono">
                            {formatCurrency(drive.costPerTB)} / TB
                          </TableCell>
                          <TableCell className="font-mono">
                            {drive.activeWatts} / {drive.idleWatts} W
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1.5">
                              <Badge
                                variant={
                                  drivesPerServer ? "default" : "secondary"
                                }
                              >
                                {drivesPerServer
                                  ? `${drivesPerServer} / server`
                                  : "Not assigned"}
                              </Badge>
                              <Button
                                size="sm"
                                variant={selected ? "secondary" : "outline"}
                                onClick={() => setSelectedDriveId(drive.id)}
                              >
                                {selected ? "Editing" : "Edit"}
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                aria-label={`Delete ${drive.name}`}
                                title={`Delete ${drive.name}`}
                                onClick={() => deleteDrive(drive.id)}
                              >
                                <Trash2Icon data-icon="inline-start" />
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
                      Add an NVMe SSD or Nearline HDD profile to begin a
                      reusable media library.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => addDriveFromPreset(DRIVE_PRESETS[0]!)}
                      >
                        <PlusIcon data-icon="inline-start" />
                        Add 15.36 TB NVMe
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => addDriveFromPreset(DRIVE_PRESETS[3]!)}
                      >
                        <DiscIcon data-icon="inline-start" />
                        Add 24 TB Nearline HDD
                      </Button>
                    </div>
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
                  Configure media type (NVMe SSD or Hard Drive), interface,
                  capacity, power, and reliability. Click any numeric badge to
                  type an exact value.
                </CardDescription>
                <CardAction>
                  <div className="flex items-center gap-2">
                    <Badge>{selectedDrive.medium}</Badge>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      title={`Delete ${selectedDrive.name}`}
                      aria-label={`Delete ${selectedDrive.name}`}
                      onClick={() => deleteDrive(selectedDrive.id)}
                    >
                      <Trash2Icon data-icon="inline-start" />
                    </Button>
                  </div>
                </CardAction>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="drive-profile-name">
                        Profile name
                      </FieldLabel>
                      <Input
                        id="drive-profile-name"
                        value={selectedDrive.name}
                        onChange={(event) =>
                          updateDrive({ name: event.target.value })
                        }
                        placeholder="e.g. 24 TB Nearline HDD"
                      />
                      <FieldDescription>
                        Label shown across server mix and cost ledgers.
                      </FieldDescription>
                    </Field>

                    <Field>
                      <FieldLabel>Storage medium</FieldLabel>
                      <ToggleGroup
                        value={[selectedDrive.medium]}
                        onValueChange={(values) => {
                          const nextMedium = values[0] as
                            DriveMedium | undefined
                          if (nextMedium) {
                            switchDriveMedium(nextMedium)
                          }
                        }}
                        variant="outline"
                        size="lg"
                        className="grid w-full grid-cols-2"
                        aria-label="Storage medium"
                      >
                        <ToggleGroupItem value="NVMe SSD">
                          <HardDriveIcon data-icon="inline-start" />
                          NVMe SSD
                        </ToggleGroupItem>
                        <ToggleGroupItem value="HDD">
                          <DiscIcon data-icon="inline-start" />
                          Hard Drive (HDD)
                        </ToggleGroupItem>
                      </ToggleGroup>
                      <FieldDescription>
                        Switching medium loads typical capacity, interface,
                        power, and $/TB defaults.
                      </FieldDescription>
                    </Field>
                  </div>

                  <Field>
                    <div className="flex items-center justify-between gap-3">
                      <FieldLabel>Drive interface</FieldLabel>
                      <Badge variant="outline" className="font-mono">
                        {selectedDrive.interface}
                      </Badge>
                    </div>
                    <ToggleGroup
                      value={[selectedDrive.interface]}
                      onValueChange={(values) => {
                        const nextInterface = values[0]
                        if (nextInterface) {
                          updateDrive({ interface: nextInterface })
                        }
                      }}
                      variant="outline"
                      size="lg"
                      className="grid w-full grid-cols-1 sm:grid-cols-3"
                      aria-label="Drive interface"
                    >
                      {interfaceChoices.map((iface) => (
                        <ToggleGroupItem key={iface} value={iface}>
                          {iface}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                    <FieldDescription>
                      Physical host bus / interconnect protocol for this drive
                      profile.
                    </FieldDescription>
                  </Field>

                  <ChoiceSliderField
                    label="Capacity"
                    description={
                      selectedDrive.medium === "HDD"
                        ? "Enterprise nearline hard drive capacities from 4 TB through 36 TB (CMR / SMR / HAMR)."
                        : "Binary NVMe capacity steps from 960 GB through 245.76 TB."
                    }
                    value={selectedDrive.capacityTB}
                    choices={capacityChoices}
                    formatValue={formatDriveCapacity}
                    onChange={(capacityTB) => updateDrive({ capacityTB })}
                  />
                  <SliderField
                    label="Raw media price per TB"
                    description="Raw acquisition basis used directly for drive CapEx, replacements, and total TCO. Click the badge to type an exact $/TB."
                    value={selectedDrive.costPerTB}
                    min={0}
                    max={selectedDrive.medium === "HDD" ? 150 : 1000}
                    step={selectedDrive.medium === "HDD" ? 1 : 5}
                    formatValue={(value) => `${formatCurrency(value)} / TB`}
                    onChange={(costPerTB) => updateDrive({ costPerTB })}
                  />
                  <SliderField
                    label="Idle power"
                    description="Drive power draw while ready/spinning but not actively serving I/O."
                    value={selectedDrive.idleWatts}
                    min={0}
                    max={35}
                    step={0.5}
                    formatValue={(value) => `${value.toFixed(1)} W`}
                    onChange={(idleWatts) =>
                      updateDrive({
                        idleWatts,
                        activeWatts: Math.max(
                          selectedDrive.activeWatts,
                          idleWatts
                        ),
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
                    description="Expected percentage of deployed drives that fail each year (typically ~0.4–0.6% for NVMe, ~0.8–1.5% for Nearline HDD)."
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
              { label: "Medium", value: selectedDrive.medium },
              {
                label: "Assigned / server",
                value: selectedDrivesPerServer.toLocaleString(),
              },
              {
                label: "Deployed drives",
                value: selectedTotalDrives.toLocaleString(),
              },
              { label: "Unit price", value: formatCurrency(selectedUnitCost) },
              {
                label: "Raw cluster capacity",
                value: formatCapacity(selectedRawCapacityTB),
              },
              {
                label: "Drive acquisition",
                value: formatCompactCurrency(selectedAcquisitionCost),
              },
              {
                label: "Expected replacements",
                value: `${(
                  (selectedTotalDrives *
                    selectedDrive.afrPercent *
                    model.workload.termYears) /
                  100
                ).toFixed(1)} drives`,
              },
            ]}
            footer={
              <span className="text-[0.625rem] leading-relaxed text-muted-foreground">
                Raw media cost = drive capacity × raw $ / TB. Assign profiles in
                Server Config to include them in TCO.
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
              {
                label: "Raw capacity",
                value: formatCapacity(results.rawCapacityTB),
              },
              {
                label: "Drive acquisition",
                value: formatCompactCurrency(results.driveCapex),
              },
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
              {drive.medium === "HDD" ? <DiscIcon /> : <HardDriveIcon />}
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-medium">{drive.name}</span>
                <span className="font-mono text-[0.625rem] text-muted-foreground">
                  {drive.medium} · {formatDriveCapacity(drive.capacityTB)} ·{" "}
                  {formatCurrency(drive.costPerTB)} / TB
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
}: Pick<
  ModelPagesProps,
  "model" | "results" | "onModelChange" | "onSectionChange"
>) {
  const updateServer = (patch: Partial<TcoModel["server"]>) =>
    onModelChange({ ...model, server: { ...model.server, ...patch } })

  const driveMix = model.server.driveAllocations.flatMap((allocation) => {
    const drive = model.drives.find(
      (candidate) => candidate.id === allocation.driveId
    )
    return drive ? [{ allocation, drive }] : []
  })
  const assignedDriveIds = new Set(driveMix.map(({ drive }) => drive.id))
  const availableDrives = model.drives.filter(
    (drive) => !assignedDriveIds.has(drive.id)
  )

  const addDriveToServer = (driveId: string) => {
    const drive = model.drives.find((candidate) => candidate.id === driveId)
    const defaultCount = model.server.driveAllocations.length
      ? 12
      : drive?.medium === "HDD"
        ? 60
        : 24
    updateServer({
      driveAllocations: [
        ...model.server.driveAllocations,
        {
          driveId,
          count: defaultCount,
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
            {results.drivesPerServer} DRIVES · {driveMix.length}{" "}
            {driveMix.length === 1 ? "TYPE" : "TYPES"} ·{" "}
            {results.hostPortsPerServer}×{model.server.nicSpeedGbps}G ·{" "}
            {model.server.rackUnits} RU
          </Badge>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Drive mix</CardTitle>
              <CardDescription>
                Combine configured NVMe SSD and Hard Drive (HDD) profiles and
                set a separate bay quantity per server (supports up to 108 bays
                for high-density 4U JBOD/storage servers).
              </CardDescription>
              {availableDrives.length ? (
                <CardAction>
                  <AddDriveTypeMenu
                    drives={availableDrives}
                    onAdd={addDriveToServer}
                  />
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
                      Create one or more NVMe or HDD profiles in Drive Config
                      before assembling this server.
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
                            {formatDriveCapacity(drive.capacityTB)} ·{" "}
                            {drive.medium} · {drive.interface}
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
                            description="Quantity of this media profile installed in every server (up to 108 bays for dense HDD chassis)."
                            value={allocation.count}
                            min={1}
                            max={108}
                            step={1}
                            formatValue={(value) =>
                              `${value} ${value === 1 ? "drive" : "drives"}`
                            }
                            onChange={(count) =>
                              updateDriveCount(drive.id, count)
                            }
                          />
                        </CardContent>
                        <CardFooter className="flex flex-wrap gap-2 border-t">
                          <Badge variant="outline">
                            {formatCapacity(
                              drive.capacityTB * allocation.count
                            )}{" "}
                            raw
                          </Badge>
                          <Badge variant="outline">
                            {formatCurrency(unitCost * allocation.count)} media
                          </Badge>
                          <Badge variant="outline">
                            {formatPower(drive.activeWatts * allocation.count)}{" "}
                            peak
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
                      Add a configured NVMe or HDD drive type to populate this
                      storage server.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <AddDriveTypeMenu
                      drives={availableDrives}
                      onAdd={addDriveToServer}
                    />
                  </EmptyContent>
                </Empty>
              )}
            </CardContent>
            {driveMix.length ? (
              <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t">
                <span className="text-muted-foreground">
                  Per-server media total
                </span>
                <span className="font-mono font-semibold">
                  {results.drivesPerServer} drives ·{" "}
                  {formatCapacity(results.rawCapacityPerServerTB)} ·{" "}
                  {formatCurrency(results.rawMediaCostPerServer)}
                </span>
              </CardFooter>
            ) : null}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chassis envelope</CardTitle>
              <CardDescription>
                Set the physical, cost, and non-drive power profile for each
                server.
              </CardDescription>
              <CardAction>
                <Badge variant="secondary">
                  {model.server.rackUnits} RU chassis
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="server-node-name">
                    Server node label
                  </FieldLabel>
                  <Input
                    id="server-node-name"
                    value={model.server.name}
                    onChange={(event) =>
                      updateServer({ name: event.target.value })
                    }
                    placeholder="Storage server"
                  />
                  <FieldDescription>
                    Descriptive name for the storage node architecture.
                  </FieldDescription>
                </Field>
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
                  description="Physical rack space consumed by each server chassis (e.g. 1–2 RU for NVMe nodes, 4 RU for 60–106 bay HDD nodes)."
                  value={model.server.rackUnits}
                  min={1}
                  max={8}
                  step={1}
                  suffix=" RU"
                  onChange={(rackUnits) => updateServer({ rackUnits })}
                />
                {(() => {
                  const hddPerNode =
                    results.hddDriveCount /
                    Math.max(1, model.cluster.serverCount)
                  const nvmePerNode =
                    results.nvmeDriveCount /
                    Math.max(1, model.cluster.serverCount)
                  const recommendedMinRu = Math.min(
                    8,
                    Math.max(
                      1,
                      Math.ceil(hddPerNode / 27 + nvmePerNode / 32)
                    )
                  )

                  if (model.server.rackUnits >= recommendedMinRu) return null

                  return (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                      <span className="flex items-center gap-2">
                        <AlertTriangleIcon className="size-4 shrink-0" />
                        <span>
                          Physical bay density advisory:{" "}
                          <strong>{results.drivesPerServer} drives/node</strong>{" "}
                          ({hddPerNode} HDD, {nvmePerNode} NVMe) typically
                          requires at least{" "}
                          <strong>{recommendedMinRu} RU</strong> per chassis.
                        </span>
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateServer({ rackUnits: recommendedMinRu })
                        }
                      >
                        Set to {recommendedMinRu} RU
                      </Button>
                    </div>
                  )
                })()}
                <SliderField
                  label="Base server power"
                  description="CPU, DRAM, fans, and motherboard power before drives and network overhead."
                  value={model.server.basePowerWatts}
                  min={100}
                  max={2000}
                  step={25}
                  suffix=" W"
                  onChange={(basePowerWatts) =>
                    updateServer({ basePowerWatts })
                  }
                />
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compute & memory</CardTitle>
              <CardDescription>
                Set the resources that drive software licensing and node
                performance.
              </CardDescription>
              <CardAction>
                <Badge variant="secondary">
                  {(
                    model.server.sockets * model.server.coresPerSocket
                  ).toLocaleString()}{" "}
                  cores
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
                  formatValue={(value) =>
                    `${value} ${value === 1 ? "socket" : "sockets"}`
                  }
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
                  onChange={(coresPerSocket) =>
                    updateServer({ coresPerSocket })
                  }
                />
                <SliderField
                  label="Installed DRAM"
                  description="Total memory installed in each server."
                  value={model.server.dramGB}
                  min={64}
                  max={4096}
                  step={64}
                  formatValue={(value) =>
                    value >= 1024
                      ? `${(value / 1024).toFixed(value % 1024 ? 2 : 0)} TB`
                      : `${value} GB`
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
                Define the physical NIC layout. Cluster Config converts these
                host ports into switch and optics/cabling demand.
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
                    Select the line rate for every physical port in this server
                    design.
                  </FieldDescription>
                </Field>
                <SliderField
                  label="Number of NICs"
                  description="Physical network interface cards installed in each server."
                  value={model.server.nicCount}
                  min={1}
                  max={8}
                  step={1}
                  formatValue={(value) =>
                    `${value} ${value === 1 ? "NIC" : "NICs"}`
                  }
                  onChange={(nicCount) => updateServer({ nicCount })}
                />
                <SliderField
                  label="Ports per NIC"
                  description="Active physical fabric ports on each network card."
                  value={model.server.portsPerNic}
                  min={1}
                  max={4}
                  step={1}
                  formatValue={(value) =>
                    `${value} ${value === 1 ? "port" : "ports"}`
                  }
                  onChange={(portsPerNic) => updateServer({ portsPerNic })}
                />
              </FieldGroup>
            </CardContent>
            <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t">
              <span className="text-muted-foreground">Per-server topology</span>
              <span className="font-mono font-semibold">
                {model.server.nicCount} NICs × {model.server.portsPerNic}{" "}
                {model.server.portsPerNic === 1 ? "port" : "ports"} ×{" "}
                {model.server.nicSpeedGbps}G ={" "}
                {formatBandwidth(results.hostBandwidthPerServerGbps)}
              </span>
            </CardFooter>
          </Card>
        </div>

        <ImpactCard
          title="Server at a glance"
          description="Per-server totals from the selected controls"
          items={[
            {
              label: "Drive types / node",
              value: driveMix.length.toLocaleString(),
            },
            {
              label: "Drives / node",
              value: results.drivesPerServer.toLocaleString(),
            },
            {
              label: "Raw capacity / node",
              value: formatCapacity(results.rawCapacityPerServerTB),
            },
            ...(results.nvmeDriveCount > 0 && results.hddDriveCount > 0
              ? [
                  {
                    label: "Flash vs. HDD mix",
                    value: `${formatCapacity(results.nvmeRawCapacityTB / model.cluster.serverCount)} NVMe · ${formatCapacity(results.hddRawCapacityTB / model.cluster.serverCount)} HDD`,
                  },
                ]
              : []),
            {
              label: "Raw media cost / node",
              value: formatCurrency(results.rawMediaCostPerServer),
            },
            {
              label: "Node acquisition",
              value: formatCurrency(
                results.rawMediaCostPerServer + model.server.unitCost
              ),
              hint: "Raw media plus server chassis. NIC cards are included in chassis cost; optics and switches are modeled in Cluster Config.",
            },
            {
              label: "Cores / node",
              value: `${model.server.sockets * model.server.coresPerSocket}`,
            },
            {
              label: "DRAM / node",
              value: `${model.server.dramGB.toLocaleString()} GB`,
            },
            {
              label: "NIC layout",
              value: `${model.server.nicCount} × ${model.server.portsPerNic}-port ${model.server.nicSpeedGbps}G`,
            },
            {
              label: "Host ports / node",
              value: results.hostPortsPerServer.toLocaleString(),
            },
            {
              label: "Host bandwidth / node",
              value: formatBandwidth(results.hostBandwidthPerServerGbps),
            },
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
              All controls are per server. Cluster Config multiplies these
              values by the server count.
            </span>
          }
        />
      </div>
    </div>
  )
}

function ClusterPage({
  model,
  results,
  onModelChange,
}: Omit<ModelPagesProps, "activeSection" | "onSectionChange">) {
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
  const switchPortsPerSwitch =
    model.cluster.switchPorts ?? REFERENCE_SWITCH_PORTS
  const switchSpeedGbps =
    model.cluster.switchSpeedGbps ?? REFERENCE_SWITCH_SPEED_GBPS
  const cableType = model.cluster.cableType ?? "optics"
  const switchUnitCost = switchPortsPerSwitch * model.cluster.switchCostPerPort

  const selectCablePreset = (nextCableType: CableType) => {
    const presets: Record<
      CableType,
      {
        hostOpticCost: number
        switchOpticCost: number
        networkOverheadWattsPerServer: number
      }
    > = {
      optics: {
        hostOpticCost: 400,
        switchOpticCost: 800,
        networkOverheadWattsPerServer: 90,
      },
      aoc: {
        hostOpticCost: 225,
        switchOpticCost: 450,
        networkOverheadWattsPerServer: 70,
      },
      dac: {
        hostOpticCost: 75,
        switchOpticCost: 150,
        networkOverheadWattsPerServer: 45,
      },
    }
    updateCluster({
      cableType: nextCableType,
      ...presets[nextCableType],
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageIntro
        section="cluster"
        action={
          <Badge variant="outline" className="font-mono">
            {results.rackCount} {results.rackCount === 1 ? "RACK" : "RACKS"} ·{" "}
            {rackFillPercent.toFixed(0)}% FILLED
          </Badge>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Cluster scale</CardTitle>
              <CardDescription>
                Scale one configured server design into a complete physical
                deployment.
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
                  formatValue={(value) =>
                    `${value} ${value === 1 ? "server" : "servers"}`
                  }
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
                  onChange={(rackCapacityRU) =>
                    updateCluster({ rackCapacityRU })
                  }
                />
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deployment map</CardTitle>
              <CardDescription>
                A physical view of the nodes, fabric, and rack footprint created
                by the model.
              </CardDescription>
              <CardAction>
                <Badge variant="secondary">
                  {formatCapacity(results.rawCapacityTB)} raw
                </Badge>
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
                    {model.server.rackUnits} RU · {results.drivesPerServer}{" "}
                    drives each
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
                    {results.hostPortsPerServer} ports / node ·{" "}
                    {formatBandwidth(results.aggregateHostBandwidthGbps)}{" "}
                    aggregate
                  </CardContent>
                </Card>
                <Card size="sm" className="bg-muted/20">
                  <CardHeader>
                    <CardDescription className="flex items-center gap-2">
                      <Layers3Icon /> {switchSpeedGbps}G leaf ports
                    </CardDescription>
                    <CardTitle className="font-mono text-xl">
                      {results.usedSwitchPorts} / {results.availableSwitchPorts}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-[0.625rem] text-muted-foreground">
                    {model.cluster.switchCount} × {switchPortsPerSwitch}-port
                    switches · {results.switchBreakoutFactor}:1 breakout
                  </CardContent>
                </Card>
                <Card size="sm" className="bg-muted/20">
                  <CardHeader>
                    <CardDescription className="flex items-center gap-2">
                      <DatabaseIcon /> Physical footprint
                    </CardDescription>
                    <CardTitle className="font-mono text-xl">
                      {results.rackCount}{" "}
                      {results.rackCount === 1 ? "rack" : "racks"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-[0.625rem] text-muted-foreground">
                    {results.totalRackUnits} of{" "}
                    {(results.rackCount * rackCapacity).toLocaleString()}{" "}
                    available RU
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium">
                      {switchSpeedGbps}G switch-port utilization
                    </div>
                    <div className="text-[0.625rem] text-muted-foreground">
                      Host links are evenly distributed across switches, then
                      packed by breakout factor.
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {isUnderprovisioned ? (
                      <>
                        <Badge variant="destructive">
                          Needs at least {results.minimumSwitchCount} switches
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateCluster({
                              switchCount: results.minimumSwitchCount,
                            })
                          }
                        >
                          Auto-size to {results.minimumSwitchCount}
                        </Button>
                      </>
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
                  aria-label={`${switchSpeedGbps}G switch-port utilization`}
                />
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[0.625rem] text-muted-foreground">
                  <span>
                    {results.usedSwitchPorts} used {switchSpeedGbps}G ports
                  </span>
                  <span>
                    {results.availableSwitchPorts} installed {switchSpeedGbps}G
                    ports
                  </span>
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
                    <Badge variant="outline">
                      Showing {visibleRackCount} of {results.rackCount}
                    </Badge>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: visibleRackCount }, (_, index) => {
                    const occupiedRu =
                      baseRackLoad + (index < racksWithExtraRu ? 1 : 0)
                    const utilization = Math.min(
                      (occupiedRu / rackCapacity) * 100,
                      100
                    )

                    return (
                      <Card size="sm" key={`rack-${index + 1}`}>
                        <CardHeader>
                          <CardDescription>
                            Rack {String(index + 1).padStart(2, "0")}
                          </CardDescription>
                          <CardTitle className="font-mono text-base">
                            {occupiedRu} / {rackCapacity} RU
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2">
                          <Progress
                            value={utilization}
                            aria-label={`Rack ${index + 1} occupancy`}
                          />
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
                <CardTitle>{switchSpeedGbps}G switch reference</CardTitle>
                <CardDescription>
                  Price the leaf fabric from a {switchPortsPerSwitch}-port{" "}
                  {switchSpeedGbps}G reference switch.
                </CardDescription>
                <CardAction>
                  <Badge variant="secondary">
                    {formatCurrency(switchUnitCost)} / switch
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field>
                      <FieldLabel>Switch port speed</FieldLabel>
                      <ToggleGroup
                        value={[String(switchSpeedGbps)]}
                        onValueChange={(values) => {
                          const nextSpeed = Number(values[0]) as SwitchSpeedGbps
                          if (nextSpeed === 400 || nextSpeed === 800) {
                            updateCluster({ switchSpeedGbps: nextSpeed })
                          }
                        }}
                        variant="outline"
                        size="lg"
                        className="grid w-full grid-cols-2"
                        aria-label="Switch port speed"
                      >
                        <ToggleGroupItem value="400">400G</ToggleGroupItem>
                        <ToggleGroupItem value="800">800G</ToggleGroupItem>
                      </ToggleGroup>
                    </Field>

                    <Field>
                      <FieldLabel>Ports per switch</FieldLabel>
                      <ToggleGroup
                        value={[String(switchPortsPerSwitch)]}
                        onValueChange={(values) => {
                          const nextPorts = Number(values[0]) as SwitchPortCount
                          if (nextPorts === 32 || nextPorts === 64) {
                            updateCluster({ switchPorts: nextPorts })
                          }
                        }}
                        variant="outline"
                        size="lg"
                        className="grid w-full grid-cols-2"
                        aria-label="Ports per switch"
                      >
                        <ToggleGroupItem value="32">32 ports</ToggleGroupItem>
                        <ToggleGroupItem value="64">64 ports</ToggleGroupItem>
                      </ToggleGroup>
                    </Field>
                  </div>

                  <SliderField
                    label="Switch count"
                    description={`Installed ${switchPortsPerSwitch}-port ${switchSpeedGbps}G switches. Add pairs when modeling redundant fabrics.`}
                    value={model.cluster.switchCount}
                    min={1}
                    max={32}
                    step={1}
                    formatValue={(value) =>
                      `${value} ${value === 1 ? "switch" : "switches"}`
                    }
                    onChange={(switchCount) => updateCluster({ switchCount })}
                  />
                  <SliderField
                    label={`Average cost per ${switchSpeedGbps}G port`}
                    description="A fully priced average across switch hardware; $781.25 per port equals $50,000 for 64 ports."
                    value={model.cluster.switchCostPerPort}
                    min={0}
                    max={2500}
                    step={0.25}
                    formatValue={(value) =>
                      `${formatCurrency(value, 2)} / port`
                    }
                    onChange={(switchCostPerPort) =>
                      updateCluster({ switchCostPerPort })
                    }
                  />
                  <SliderField
                    label="Power per switch"
                    description="Nameplate draw added to the average and peak IT load."
                    value={model.cluster.switchPowerWatts}
                    min={0}
                    max={3000}
                    step={25}
                    suffix=" W"
                    onChange={(switchPowerWatts) =>
                      updateCluster({ switchPowerWatts })
                    }
                  />
                  <SliderField
                    label="Rack height per switch"
                    description="Physical rack units consumed by every reference switch."
                    value={model.cluster.switchRackUnits}
                    min={1}
                    max={8}
                    step={1}
                    suffix=" RU"
                    onChange={(switchRackUnits) =>
                      updateCluster({ switchRackUnits })
                    }
                  />
                </FieldGroup>
              </CardContent>
              <CardFooter className="border-t text-[0.625rem] text-muted-foreground">
                {switchPortsPerSwitch} ports ×{" "}
                {formatCurrency(model.cluster.switchCostPerPort, 2)} ={" "}
                {formatCurrency(switchUnitCost)} per switch.
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optics & host edge</CardTitle>
                <CardDescription>
                  Price every host link and every occupied {switchSpeedGbps}G
                  switch port after breakout.
                </CardDescription>
                <CardAction>
                  <Badge variant="secondary">
                    {results.switchBreakoutFactor}:1 breakout
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel>Interconnect medium preset</FieldLabel>
                    <ToggleGroup
                      value={[cableType]}
                      onValueChange={(values) => {
                        const nextCable = values[0] as CableType | undefined
                        if (nextCable) {
                          selectCablePreset(nextCable)
                        }
                      }}
                      variant="outline"
                      size="lg"
                      className="grid w-full grid-cols-3"
                      aria-label="Interconnect medium preset"
                    >
                      <ToggleGroupItem value="optics">Optics</ToggleGroupItem>
                      <ToggleGroupItem value="aoc">AOC</ToggleGroupItem>
                      <ToggleGroupItem value="dac">Copper DAC</ToggleGroupItem>
                    </ToggleGroup>
                    <FieldDescription>
                      Loads baseline unit costs for optical transceivers, active
                      optical cables, or short-reach passive DACs.
                    </FieldDescription>
                  </Field>

                  <SliderField
                    label="Host optic / cable-end cost"
                    description={`One unit for each of the ${results.totalHostPorts} host ports.`}
                    value={model.cluster.hostOpticCost}
                    min={0}
                    max={5000}
                    step={25}
                    formatValue={(value) =>
                      `${formatCurrency(value)} / host port`
                    }
                    onChange={(hostOpticCost) =>
                      updateCluster({ hostOpticCost })
                    }
                  />
                  <SliderField
                    label={`Switch-side ${switchSpeedGbps}G optic cost`}
                    description={`One ${switchSpeedGbps}G unit for each of the ${results.usedSwitchPorts} occupied switch ports; breakout serves ${results.switchBreakoutFactor} host links.`}
                    value={model.cluster.switchOpticCost}
                    min={0}
                    max={10000}
                    step={50}
                    formatValue={(value) =>
                      `${formatCurrency(value)} / switch port`
                    }
                    onChange={(switchOpticCost) =>
                      updateCluster({ switchOpticCost })
                    }
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
                  {results.hostOpticCount} host links ·{" "}
                  {formatCompactCurrency(results.hostOpticsTotal)}
                </Badge>
                <Badge variant="outline">
                  {results.switchOpticCount} switch ports ·{" "}
                  {formatCompactCurrency(results.switchOpticsTotal)}
                </Badge>
              </CardFooter>
            </Card>
          </div>
        </div>

        <ImpactCard
          title="Cluster at a glance"
          description="Physical and economic rollup"
          items={[
            {
              label: "Cluster raw capacity",
              value: formatCapacity(results.rawCapacityTB),
            },
            { label: "Rack footprint", value: `${results.rackCount} × rack` },
            {
              label: "Host links",
              value: `${results.totalHostPorts} × ${model.server.nicSpeedGbps}G`,
            },
            {
              label: `${switchSpeedGbps}G switch ports`,
              value: `${results.usedSwitchPorts} / ${results.availableSwitchPorts}`,
            },
            { label: "Breakout", value: `${results.switchBreakoutFactor}:1` },
            {
              label: "Switch hardware",
              value: formatCompactCurrency(results.switchHardwareCost),
            },
            {
              label: "Optics & cabling",
              value: formatCompactCurrency(
                results.hostOpticsTotal + results.switchOpticsTotal
              ),
            },
            {
              label: "Network CapEx",
              value: formatCompactCurrency(results.networkCapex),
            },
            {
              label: "Peak IT load",
              value: formatPower(results.peakItPowerWatts),
            },
          ]}
          footer={
            <span className="text-[0.625rem] leading-relaxed text-muted-foreground">
              NIC cards are included in server chassis cost. Network CapEx
              includes {switchPortsPerSwitch}-port {switchSpeedGbps}G switches,
              one optic per host port, and one optic per used switch port after
              breakout.
            </span>
          }
        />
      </div>
    </div>
  )
}

function SoftwarePage({
  model,
  results,
  onModelChange,
}: Omit<ModelPagesProps, "activeSection" | "onSectionChange">) {
  const updateSoftware = (patch: Partial<TcoModel["software"]>) =>
    onModelChange({ ...model, software: { ...model.software, ...patch } })

  const upfrontCapacityCost =
    results.rawCapacityTB * model.software.upfrontPerRawTB
  const upfrontServerCost =
    model.cluster.serverCount * model.software.upfrontPerServer
  const monthlyCoreCost = results.totalCores * model.software.monthlyPerCore
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
                Acquisition licenses applied once to installed raw capacity and
                server count.
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
                  formatValue={(value) =>
                    `${formatCurrency(value, 0)} / server`
                  }
                  onChange={(upfrontPerServer) =>
                    updateSoftware({ upfrontPerServer })
                  }
                />
              </FieldGroup>
            </CardContent>
            <CardFooter className="border-t">
              <div className="flex w-full flex-wrap items-center justify-between gap-3">
                <span className="text-muted-foreground">
                  Current one-time total
                </span>
                <span className="font-mono font-semibold tabular-nums">
                  {formatCompactCurrency(
                    upfrontCapacityCost + upfrontServerCost
                  )}
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
                  onChange={(monthlyPerCore) =>
                    updateSoftware({ monthlyPerCore })
                  }
                />
                <SliderField
                  label="Monthly per raw TB"
                  description={`Applied to ${formatCapacity(results.rawCapacityTB)} of installed raw capacity each month.`}
                  value={model.software.monthlyPerRawTB}
                  min={0}
                  max={30}
                  step={0.5}
                  formatValue={(value) =>
                    `${formatCurrency(value, value % 1 ? 2 : 0)} / TB`
                  }
                  onChange={(monthlyPerRawTB) =>
                    updateSoftware({ monthlyPerRawTB })
                  }
                />
              </FieldGroup>
            </CardContent>
            <CardFooter className="border-t">
              <div className="flex w-full flex-wrap items-center justify-between gap-3">
                <span className="text-muted-foreground">
                  Current monthly run rate
                </span>
                <span className="font-mono font-semibold tabular-nums">
                  {formatCompactCurrency(monthlySoftwareRunRate)}
                </span>
              </div>
            </CardFooter>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm">
            <span className="text-muted-foreground">
              License term and billing basis
            </span>
            <span className="font-mono font-semibold">
              {model.workload.termYears} years ·{" "}
              {results.totalCores.toLocaleString()} cores ·{" "}
              {formatCapacity(results.rawCapacityTB)} raw
            </span>
          </div>
        </div>

        <ImpactCard
          title="License rollup"
          items={[
            {
              label: "Upfront software",
              value: formatCompactCurrency(results.upfrontSoftware),
            },
            {
              label: "Recurring software",
              value: formatCompactCurrency(results.recurringSoftware),
            },
            {
              label: "Total license cost",
              value: formatCompactCurrency(results.softwareTotal),
            },
            {
              label: "Per raw TB / month",
              value: formatCurrency(
                results.rawCapacityTB && model.workload.termYears
                  ? results.softwareTotal /
                      results.rawCapacityTB /
                      (model.workload.termYears * 12)
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

function WorkloadPage({
  model,
  results,
  onModelChange,
}: Omit<ModelPagesProps, "activeSection" | "onSectionChange">) {
  const updateWorkload = (patch: Partial<TcoModel["workload"]>) =>
    onModelChange({ ...model, workload: { ...model.workload, ...patch } })

  const protectionLayout = getProtectionLayout(
    model.workload.protectionScheme,
    model.workload.dataShards,
    model.workload.parityShards
  )
  const isMirror = model.workload.protectionScheme === "mirror"
  const hasDriveMix = results.totalDrives > 0
  const failureDomain = model.workload.failureDomain ?? "drive"
  const durability = calculateDurability(
    protectionLayout,
    results.weightedAfrPercent / 100,
    model.workload.rebuildTimeHours,
    {
      totalDrives: results.totalDrives,
      serverCount: model.cluster.serverCount,
      failureDomain,
    }
  )
  const durabilityLabel = !hasDriveMix
    ? "Not modeled"
    : durability.nines >= 15
      ? "15+ nines"
      : `${durability.nines} nines`
  const clusterDurabilityLabel = !hasDriveMix
    ? "Not modeled"
    : durability.clusterNines >= 15
      ? "15+ nines"
      : `${durability.clusterNines} nines`

  const tbePerRawTb =
    (1 / results.protectionFactor) *
    model.workload.dataReductionRatio *
    (model.workload.capacityUtilizationPercent / 100)

  const selectProtectionScheme = (scheme: ProtectionScheme) => {
    const presets: Record<
      ProtectionScheme,
      { dataShards: number; parityShards: number }
    > = {
      mirror: { dataShards: 1, parityShards: 1 },
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
            {protectionLayout.label.toUpperCase()} ·{" "}
            {durabilityLabel.toUpperCase()}
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
                Choose a common protection profile, failure domain, and rebuild
                window.
              </CardDescription>
              <CardAction>
                <Badge>
                  {protectionLayout.protectionFactor.toFixed(2)}× overhead
                </Badge>
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
                  className="grid w-full grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
                  aria-label="Protection profile"
                >
                  <ToggleGroupItem
                    value="mirror"
                    className="h-auto min-w-0 flex-col items-start gap-1 px-3 py-3 text-left"
                  >
                    <span className="font-semibold">Mirror</span>
                    <span className="text-[0.625rem] font-normal text-muted-foreground">
                      Two copies · 2:1 overhead
                    </span>
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="raid5"
                    className="h-auto min-w-0 flex-col items-start gap-1 px-3 py-3 text-left"
                  >
                    <span className="font-semibold">RAID 5</span>
                    <span className="text-[0.625rem] font-normal text-muted-foreground">
                      Single parity · 4+1 preset
                    </span>
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="raid6"
                    className="h-auto min-w-0 flex-col items-start gap-1 px-3 py-3 text-left"
                  >
                    <span className="font-semibold">RAID 6</span>
                    <span className="text-[0.625rem] font-normal text-muted-foreground">
                      Double parity · 8+2 preset
                    </span>
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="erasure"
                    className="h-auto min-w-0 flex-col items-start gap-1 px-3 py-3 text-left"
                  >
                    <span className="font-semibold">Erasure code</span>
                    <span className="text-[0.625rem] font-normal text-muted-foreground">
                      Flexible parity · 10+4 preset
                    </span>
                  </ToggleGroupItem>
                </ToggleGroup>
                <FieldDescription>
                  Mirror and RAID redundancy are fixed by the profile. Erasure
                  coding unlocks the parity slider.
                </FieldDescription>
              </Field>

              <Field>
                <div className="flex items-center justify-between gap-3">
                  <FieldLabel>Protection failure domain</FieldLabel>
                  <Badge variant="outline" className="font-mono">
                    {failureDomain === "server"
                      ? "Node / Server"
                      : "Drive / Media"}
                  </Badge>
                </div>
                <ToggleGroup
                  value={[failureDomain]}
                  onValueChange={(values) => {
                    const nextDomain = values[0] as FailureDomain | undefined
                    if (nextDomain) {
                      updateWorkload({ failureDomain: nextDomain })
                    }
                  }}
                  variant="outline"
                  size="lg"
                  className="grid w-full grid-cols-1 sm:grid-cols-2"
                  aria-label="Protection failure domain"
                >
                  <ToggleGroupItem value="drive">
                    Drive-level (requires ≥ {protectionLayout.totalShards}{" "}
                    drives)
                  </ToggleGroupItem>
                  <ToggleGroupItem value="server">
                    Node-level (requires ≥ {protectionLayout.totalShards}{" "}
                    servers)
                  </ToggleGroupItem>
                </ToggleGroup>
                <FieldDescription>
                  Node-level placement stripes each shard across a distinct
                  physical server so the cluster survives full host outages.
                </FieldDescription>
              </Field>

              {!durability.isTopologyValid && durability.topologyWarning ? (
                <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
                  <span>{durability.topologyWarning}</span>
                </div>
              ) : null}

              <div className="rounded-lg border bg-muted/20 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-medium">Protection set</div>
                    <div className="font-mono text-[0.625rem] text-muted-foreground">
                      {isMirror
                        ? "2 copies · survives 1 copy failure"
                        : `${protectionLayout.totalShards} total shards · survives ${protectionLayout.parityShards} simultaneous ${protectionLayout.parityShards === 1 ? "failure" : "failures"}`}
                    </div>
                  </div>
                  <Badge variant="secondary" className="font-mono">
                    {protectionLayout.dataShards}+
                    {protectionLayout.parityShards}
                  </Badge>
                </div>
                <div
                  className="flex flex-wrap gap-1.5"
                  aria-label={
                    isMirror
                      ? "Two mirrored copies"
                      : `${protectionLayout.dataShards} data shards and ${protectionLayout.parityShards} parity ${protectionLayout.parityShards === 1 ? "shard" : "shards"}`
                  }
                >
                  {Array.from(
                    { length: protectionLayout.totalShards },
                    (_, index) => {
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
                          {isDataShard ? "D" : isMirror ? "M" : "P"}
                        </div>
                      )
                    }
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-[0.625rem] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-sm bg-primary/60" /> Data
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-sm bg-amber-500/70" />{" "}
                    {isMirror ? "Mirror copy" : "Parity"}
                  </span>
                </div>
              </div>

              <FieldGroup className="grid grid-cols-1 md:grid-cols-2">
                <SliderField
                  label="Data shards"
                  description={
                    isMirror
                      ? "Mirror fixes the layout at one data copy plus one mirror copy."
                      : "Minimum number of shards required to reconstruct the data (2 to 20)."
                  }
                  value={protectionLayout.dataShards}
                  min={isMirror ? 1 : 2}
                  max={20}
                  step={1}
                  suffix=" data"
                  disabled={isMirror}
                  onChange={(dataShards) => updateWorkload({ dataShards })}
                />
                <SliderField
                  label={isMirror ? "Mirror copies" : "Parity shards"}
                  description={
                    isMirror
                      ? "One additional copy provides fixed 2:1 protection overhead."
                      : model.workload.protectionScheme === "erasure"
                        ? "Failures the protection set can tolerate before data loss."
                        : `${model.workload.protectionScheme === "raid5" ? "RAID 5" : "RAID 6"} fixes this value at ${protectionLayout.parityShards}.`
                  }
                  value={protectionLayout.parityShards}
                  min={1}
                  max={10}
                  step={1}
                  suffix={isMirror ? " mirror" : " parity"}
                  disabled={model.workload.protectionScheme !== "erasure"}
                  onChange={(parityShards) => updateWorkload({ parityShards })}
                />
                <SliderField
                  label="Rebuild window"
                  description={`Time a degraded protection set remains exposed while a ${isMirror ? "copy" : "shard"} is replaced (up to 240h for high-capacity HDDs).`}
                  value={model.workload.rebuildTimeHours}
                  min={1}
                  max={240}
                  step={1}
                  suffix=" hours"
                  onChange={(rebuildTimeHours) =>
                    updateWorkload({ rebuildTimeHours })
                  }
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

              {(() => {
                if (!results.driveBreakdown.length) return null

                const hasHdd = results.hddDriveCount > 0
                const largestDriveTB = results.driveBreakdown.reduce(
                  (maxCap, item) => Math.max(maxCap, item.drive.capacityTB),
                  0
                )
                const impliedMbps =
                  (largestDriveTB * 1_000_000) /
                  (Math.max(1, model.workload.rebuildTimeHours) * 3600)
                const referenceNetMbps = hasHdd ? 150 : 1200
                const estimatedRebuildHours = Math.min(
                  240,
                  Math.max(
                    1,
                    Math.round(
                      (largestDriveTB * 1_000_000) / (referenceNetMbps * 3600)
                    )
                  )
                )
                const isHddSpeedExceeded = hasHdd && impliedMbps > 280

                return (
                  <div
                    className={
                      isHddSpeedExceeded
                        ? "flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300"
                        : "flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground"
                    }
                  >
                    <span className="flex items-center gap-2">
                      {isHddSpeedExceeded ? (
                        <AlertTriangleIcon className="size-4 shrink-0" />
                      ) : (
                        <Clock3Icon className="size-4 shrink-0" />
                      )}
                      <span>
                        Implied rebuild throughput for{" "}
                        <strong>
                          {formatDriveCapacity(largestDriveTB)}
                        </strong>{" "}
                        shard:{" "}
                        <strong className="font-mono">
                          {Math.round(impliedMbps).toLocaleString()} MB/s
                        </strong>
                        {isHddSpeedExceeded
                          ? " (exceeds typical ~150–250 MB/s 7.2K RPM Nearline HDD sustained rebuild write rate)."
                          : ` (reference ${hasHdd ? "HDD ~150 MB/s" : "NVMe ~1,200 MB/s"} ≈ ${estimatedRebuildHours}h).`}
                      </span>
                    </span>
                    {model.workload.rebuildTimeHours !==
                    estimatedRebuildHours ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateWorkload({
                            rebuildTimeHours: estimatedRebuildHours,
                          })
                        }
                      >
                        Estimate from media ({estimatedRebuildHours}h)
                      </Button>
                    ) : null}
                  </div>
                )
              })()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Annual durability</CardTitle>
              <CardDescription>
                Probability of retaining data through one year—shown per
                protection set and across the entire {results.totalDrives}-drive
                cluster ({durability.protectionSetCount.toFixed(1)} protection
                sets).
              </CardDescription>
              <CardAction>
                <Badge
                  variant={
                    hasDriveMix && durability.nines >= 6
                      ? "default"
                      : "secondary"
                  }
                >
                  {durabilityLabel}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Card size="sm" className="bg-muted/20">
                  <CardHeader>
                    <CardDescription>Single protection set</CardDescription>
                    <CardTitle className="font-mono text-xl">
                      {durabilityLabel}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="font-mono text-[0.625rem] text-muted-foreground">
                    {hasDriveMix
                      ? durability.formattedPercentage
                      : "Add drives to a server"}
                  </CardContent>
                </Card>
                <Card size="sm" className="bg-muted/20">
                  <CardHeader>
                    <CardDescription>Fleet-wide cluster</CardDescription>
                    <CardTitle className="font-mono text-xl">
                      {clusterDurabilityLabel}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="font-mono text-[0.625rem] text-muted-foreground">
                    {hasDriveMix
                      ? `${durability.clusterFormattedPercentage} (${durability.protectionSetCount.toFixed(1)} sets)`
                      : "No server drive mix"}
                  </CardContent>
                </Card>
                <Card size="sm" className="bg-muted/20">
                  <CardHeader>
                    <CardDescription>Annual loss odds (set)</CardDescription>
                    <CardTitle className="font-mono text-xl">
                      {hasDriveMix ? durability.annualOdds : "—"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="font-mono text-[0.625rem] text-muted-foreground">
                    {hasDriveMix
                      ? `${durability.annualLossRate.toExponential(2)} / year`
                      : "No server drive mix"}
                  </CardContent>
                </Card>
                <Card size="sm" className="bg-muted/20">
                  <CardHeader>
                    <CardDescription>Loss threshold</CardDescription>
                    <CardTitle className="font-mono text-xl">
                      {durability.failureThreshold} failed{" "}
                      {isMirror ? "copies" : "shards"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="font-mono text-[0.625rem] text-muted-foreground">
                    Within one {model.workload.rebuildTimeHours}-hour rebuild
                    window
                  </CardContent>
                </Card>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3 text-xs font-medium">
                  <span>Durability scale (single set vs. fleet)</span>
                  <span className="font-mono text-muted-foreground">
                    {hasDriveMix
                      ? `Set: ${durability.nines} nines · Fleet: ${durability.clusterNines} nines`
                      : "—"}
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
                  ? `Binomial rebuild-window model using the server mix's count-weighted ${results.weightedAfrPercent.toFixed(2)}% AFR, independent ${isMirror ? "copy" : "shard"} failures, and a ${model.workload.rebuildTimeHours}-hour rebuild across ${durability.protectionSetCount.toFixed(1)} protection sets.`
                  : "Add at least one configured drive profile to Server Config to calculate durability."}
              </span>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Capacity & activity profile</CardTitle>
              <CardDescription>
                Use workload-aware values to calculate usable capacity and
                energy.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <SliderField
                  label="Capacity utilization"
                  description="Share of post-protection, data-reduced capacity occupied by the workload."
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
                  onChange={(dataReductionRatio) =>
                    updateWorkload({ dataReductionRatio })
                  }
                />
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Capacity bridge</CardTitle>
              <CardDescription>
                The complete calculation from installed raw TB to utilized
                effective TBe.
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
                    label: "Protected TB",
                    value: formatCapacity(results.protectedCapacityTB),
                    hint: `÷ ${results.protectionFactor.toFixed(2)} protection factor`,
                  },
                  {
                    label: "Data-reduced TBe",
                    value: formatEffectiveCapacity(
                      results.dataReducedCapacityTB
                    ),
                    hint: `× ${model.workload.dataReductionRatio} data reduction`,
                  },
                  {
                    label: "Utilized TBe",
                    value: formatEffectiveCapacity(results.utilizedCapacityTB),
                    hint: `× ${model.workload.capacityUtilizationPercent}% utilization`,
                  },
                ].map((stage, index) => (
                  <div
                    className="flex min-w-0 items-center gap-3"
                    key={stage.label}
                  >
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
                    Raw TB ÷ protection factor × data reduction × utilization
                  </span>
                </div>
                <Badge className="font-mono">
                  1 raw TB = {tbePerRawTb.toFixed(2)} TBe
                </Badge>
              </div>
              <Separator />
              <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs tabular-nums">
                <span>
                  {formatCapacity(results.rawCapacityTB)} ÷{" "}
                  {results.protectionFactor.toFixed(2)} ×{" "}
                  {model.workload.dataReductionRatio} ×{" "}
                  {model.workload.capacityUtilizationPercent}%
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
            { label: "Set durability", value: durabilityLabel },
            { label: "Fleet durability", value: clusterDurabilityLabel },
            {
              label: "Raw capacity",
              value: formatCapacity(results.rawCapacityTB),
            },
            {
              label: "Utilized effective capacity",
              value: formatEffectiveCapacity(results.effectiveCapacityTB),
            },
            {
              label: "Average IT load",
              value: formatPower(results.averageItPowerWatts),
            },
            {
              label: "Annual energy",
              value: `${Math.round(results.annualEnergyKwh).toLocaleString()} kWh`,
            },
            {
              label: "TCO / effective TB",
              value: formatCurrency(results.tcoPerEffectiveTB, 2),
            },
          ]}
        />
      </div>
    </div>
  )
}

function OpexPage({
  model,
  results,
  onModelChange,
}: Omit<ModelPagesProps, "activeSection" | "onSectionChange">) {
  const updateOpex = (patch: Partial<TcoModel["opex"]>) =>
    onModelChange({ ...model, opex: { ...model.opex, ...patch } })

  const facilityPowerKw = (results.averageItPowerWatts / 1000) * model.opex.pue
  const monthlyInternetCost =
    model.opex.internetBandwidthGbps *
    results.rackCount *
    model.opex.internetPerGbpsMonth
  const termMonths = model.workload.termYears * 12
  const discountRatePercent = model.opex.discountRatePercent ?? 0
  const residualValuePercent = model.opex.residualValuePercent ?? 0

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
                Colo is billed against provisioned maximum IT power, independent
                of average energy use.
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
                  {results.provisionedPowerKw.toFixed(2)} kW ×{" "}
                  {formatCurrency(model.opex.coloPerKwMonth)} / kW / mo
                </span>
                <span className="font-semibold">
                  = {formatCurrency(results.monthlyColoCost, 2)} / month
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-[0.625rem] text-muted-foreground">
                <span>{termMonths} contract months</span>
                <span>
                  {formatCurrency(results.coloSpaceTotal)} term colocation
                </span>
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Internet bandwidth</CardTitle>
              <CardDescription>
                Committed Internet service per rack, separate from storage
                fabric and colocation power.
              </CardDescription>
              <CardAction>
                <Badge variant="secondary">Per rack · monthly</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <FieldGroup className="grid grid-cols-1 lg:grid-cols-2">
                <ChoiceSliderField
                  label="Provisioned Internet bandwidth per rack"
                  description={`Applied independently to each of the deployment's ${results.rackCount} ${results.rackCount === 1 ? "rack" : "racks"}.`}
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
                  formatValue={(value) =>
                    `${formatCurrency(value)} / Gb/s / mo`
                  }
                  onChange={(internetPerGbpsMonth) =>
                    updateOpex({ internetPerGbpsMonth })
                  }
                />
              </FieldGroup>
            </CardContent>
            <CardFooter className="border-t">
              <div className="flex w-full flex-wrap items-center justify-between gap-3">
                <span className="text-muted-foreground">
                  {model.opex.internetBandwidthGbps.toLocaleString()} Gb/s /
                  rack × {results.rackCount}{" "}
                  {results.rackCount === 1 ? "rack" : "racks"}
                </span>
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
                Average IT usage is converted to facility energy using the PUE
                multiplier.
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
                <span className="text-muted-foreground">
                  Annual facility energy
                </span>
                <span className="font-mono font-semibold tabular-nums">
                  {Math.round(results.annualEnergyKwh).toLocaleString()} kWh
                </span>
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Support & operations</CardTitle>
              <CardDescription>
                Use loaded estimates for staffing, support, and replacement
                handling.
              </CardDescription>
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
                  formatValue={(value) =>
                    `${formatCompactCurrency(value)} / year`
                  }
                  onChange={(annualAdminCost) =>
                    updateOpex({ annualAdminCost })
                  }
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
                  onChange={(driveReplacementLabor) =>
                    updateOpex({ driveReplacementLabor })
                  }
                />
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financial & NPV parameters</CardTitle>
              <CardDescription>
                Optional discount rate (WACC) and end-of-term hardware residual
                value for discounted cash-flow (NPV) analysis.
              </CardDescription>
              <CardAction>
                <Badge variant="outline">
                  {discountRatePercent > 0 || residualValuePercent > 0
                    ? "NPV active"
                    : "Nominal (0% WACC)"}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <FieldGroup className="grid grid-cols-1 md:grid-cols-2">
                <SliderField
                  label="Annual discount rate (WACC)"
                  description="Discounts future annual software and OpEx cash flows to present value."
                  value={discountRatePercent}
                  min={0}
                  max={15}
                  step={0.5}
                  formatValue={(value) => `${value.toFixed(1)}%`}
                  onChange={(nextDiscount) =>
                    updateOpex({ discountRatePercent: nextDiscount })
                  }
                />
                <SliderField
                  label="Hardware residual / salvage value"
                  description="Percentage of hardware CapEx recovered at the end of the deployment term."
                  value={residualValuePercent}
                  min={0}
                  max={30}
                  step={1}
                  formatValue={(value) => `${value}%`}
                  onChange={(nextResidual) =>
                    updateOpex({ residualValuePercent: nextResidual })
                  }
                />
              </FieldGroup>
            </CardContent>
            <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t text-xs">
              <span className="text-muted-foreground">
                Discounted NPV TCO ({model.workload.termYears} yrs)
              </span>
              <span className="font-mono font-semibold">
                {formatCompactCurrency(results.npvTco)} ·{" "}
                {formatCurrency(results.npvPerEffectiveTBMonth, 2)} / TBe / mo
              </span>
            </CardFooter>
          </Card>
        </div>

        <ImpactCard
          title="OpEx rollup"
          items={[
            {
              label: "Colo rate",
              value: `${formatCurrency(model.opex.coloPerKwMonth)} / kW / mo`,
            },
            {
              label: "Provisioned MAX IT",
              value: `${results.provisionedPowerKw.toFixed(2)} kW`,
            },
            {
              label: "Monthly colocation",
              value: formatCurrency(results.monthlyColoCost, 2),
            },
            {
              label: "Energy",
              value: formatCompactCurrency(results.electricityTotal),
            },
            {
              label: "Term colocation",
              value: formatCompactCurrency(results.coloSpaceTotal),
            },
            {
              label: "Internet bandwidth",
              value: formatCompactCurrency(results.networkOpexTotal),
            },
            {
              label: "Drive replacements",
              value: formatCompactCurrency(results.replacementTotal),
            },
            {
              label: "Hardware support",
              value: formatCompactCurrency(results.supportTotal),
            },
            {
              label: "Administration",
              value: formatCompactCurrency(results.adminTotal),
            },
            {
              label: "Total OpEx",
              value: formatCompactCurrency(results.operationsTotal),
            },
            ...(discountRatePercent > 0 || residualValuePercent > 0
              ? [
                  {
                    label: "Discounted NPV TCO",
                    value: formatCompactCurrency(results.npvTco),
                  },
                ]
              : []),
          ]}
          footer={
            <span className="text-[0.625rem] leading-relaxed text-muted-foreground">
              Colocation = exact MAX provisioned IT kW × monthly contract rate.
              Electricity remains average IT load × PUE × metered $/kWh.
            </span>
          }
        />
      </div>
    </div>
  )
}

const chartConfig = {
  hardware: { label: "Hardware", color: "var(--chart-1)" },
  energy: { label: "Energy", color: "var(--chart-2)" },
  facilities: { label: "Colocation", color: "var(--chart-4)" },
  network: { label: "Internet bandwidth", color: "var(--chart-5)" },
  software: { label: "Software", color: "var(--chart-3)" },
  operations: {
    label: "Support & operations",
    color: "var(--muted-foreground)",
  },
} satisfies ChartConfig

const annualChartConfig = {
  hardware: { label: "Hardware CapEx", color: "var(--chart-1)" },
  software: { label: "Software", color: "var(--chart-3)" },
  operations: { label: "OpEx", color: "var(--chart-2)" },
} satisfies ChartConfig

function formatDeltaPercent(
  current: number,
  baseline: number,
  lowerIsBetter = true
) {
  if (!baseline || Math.abs(current - baseline) < 1e-6) return null
  const pct = ((current - baseline) / baseline) * 100
  const sign = pct > 0 ? "+" : ""
  const isFavorable = lowerIsBetter ? pct < 0 : pct > 0
  return {
    text: `${sign}${pct.toFixed(1)}%`,
    variant: (isFavorable ? "default" : "secondary") as "default" | "secondary",
  }
}

function SummaryPage({
  results,
  model,
  scenarios = [],
  comparisonScenario,
  onCompareScenario,
  onLoadScenario,
  onSaveScenario,
  onModelChange,
  onSectionChange,
}: Pick<
  ModelPagesProps,
  | "results"
  | "model"
  | "scenarios"
  | "comparisonScenario"
  | "onCompareScenario"
  | "onLoadScenario"
  | "onSaveScenario"
  | "onModelChange"
  | "onSectionChange"
>) {
  const termMonths = model.workload.termYears * 12
  const comparisonResults = comparisonScenario
    ? calculateTco(comparisonScenario.model)
    : null
  const discountRatePercent = model.opex.discountRatePercent ?? 0
  const residualValuePercent = model.opex.residualValuePercent ?? 0
  const protectionLayout = getProtectionLayout(
    model.workload.protectionScheme,
    model.workload.dataShards,
    model.workload.parityShards
  )
  const durability = calculateDurability(
    protectionLayout,
    results.weightedAfrPercent / 100,
    model.workload.rebuildTimeHours,
    {
      totalDrives: results.totalDrives,
      serverCount: model.cluster.serverCount,
      failureDomain: model.workload.failureDomain ?? "drive",
    }
  )
  const isSwitchUnderprovisioned =
    model.cluster.switchCount < results.minimumSwitchCount

  const tcoMixData = results.categories.map((category) => ({
    ...category,
    fill: `var(--color-${category.key})`,
  }))
  const effectiveCapexTotal =
    residualValuePercent > 0 ? results.netHardwareCapex : results.hardwareCapex
  const effectiveCapexPerTbMonth =
    results.effectiveCapacityTB && termMonths
      ? effectiveCapexTotal / (results.effectiveCapacityTB * termMonths)
      : 0
  const costPerEffectiveTbBreakdown = [
    {
      key: "capex",
      label:
        residualValuePercent > 0
          ? "Net depreciated hardware CapEx"
          : "Depreciated hardware CapEx",
      description:
        residualValuePercent > 0
          ? `Hardware acquisition minus ${residualValuePercent}% residual credit (${formatCompactCurrency(results.residualValueCredit)}) over ${termMonths} months.`
          : `Drive, server, and fabric acquisition spread evenly over ${termMonths} months.`,
      total: effectiveCapexTotal,
      perEffectiveTbMonth: effectiveCapexPerTbMonth,
    },
    {
      key: "opex",
      label: "OpEx",
      description:
        "Energy, colocation, internet, replacements, support, and administration.",
      total: results.operationsTotal,
      perEffectiveTbMonth: results.operationsPerEffectiveTBMonth,
    },
    {
      key: "software",
      label: "Software",
      description:
        "Upfront and recurring licenses priced from raw capacity, cores, and servers.",
      total: results.softwareTotal,
      perEffectiveTbMonth: results.softwarePerEffectiveTBMonth,
    },
  ]

  const tcoDelta = comparisonResults
    ? formatDeltaPercent(results.tco, comparisonResults.tco, true)
    : null
  const unitCostDelta = comparisonResults
    ? formatDeltaPercent(
        results.tcoPerEffectiveTBMonth,
        comparisonResults.tcoPerEffectiveTBMonth,
        true
      )
    : null
  const capacityDelta = comparisonResults
    ? formatDeltaPercent(
        results.effectiveCapacityTB,
        comparisonResults.effectiveCapacityTB,
        false
      )
    : null
  const powerDelta = comparisonResults
    ? formatDeltaPercent(
        results.averageItPowerWatts,
        comparisonResults.averageItPowerWatts,
        true
      )
    : null

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="absolute -top-16 -right-16 size-52 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex max-w-4xl flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="gap-1">
              <SparklesIcon data-icon="inline-start" />
              SNIA 2.0 model · enhanced
            </Badge>
            {results.nvmeDriveCount > 0 && results.hddDriveCount > 0 ? (
              <Badge variant="secondary">Hybrid NVMe + HDD</Badge>
            ) : results.hddDriveCount > 0 ? (
              <Badge variant="secondary">Enterprise HDD</Badge>
            ) : (
              <Badge variant="secondary">All-Flash NVMe</Badge>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <h1 className="max-w-3xl font-heading text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
              See the economics behind every effective terabyte.
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              A transparent storage TCO model spanning NVMe and HDD media, node
              design, cluster fabric, workload efficiency, software, and
              operations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => onSectionChange("drive")}>
              Tune the model
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
            {onSaveScenario ? (
              <Button variant="outline" onClick={onSaveScenario}>
                <BookmarkPlusIcon data-icon="inline-start" />
                Save scenario
              </Button>
            ) : null}
            {scenarios.length && onCompareScenario ? (
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" />}>
                  <GitCompareArrowsIcon data-icon="inline-start" />
                  {comparisonScenario
                    ? `Comparing vs. ${comparisonScenario.name}`
                    : "Compare scenario"}
                  <ChevronDownIcon data-icon="inline-end" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-80">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>
                      Select baseline for side-by-side comparison
                    </DropdownMenuLabel>
                    {scenarios.map((scenario) => (
                      <DropdownMenuItem
                        key={scenario.id}
                        onClick={() =>
                          onCompareScenario(
                            comparisonScenario?.id === scenario.id
                              ? null
                              : scenario.id
                          )
                        }
                      >
                        <GitCompareArrowsIcon />
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className="truncate font-medium">
                            {scenario.name}
                          </span>
                          <span className="truncate text-[0.625rem] text-muted-foreground">
                            {scenario.description}
                          </span>
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                  {comparisonScenario ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onCompareScenario(null)}>
                        Clear comparison
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            <Badge variant="outline" className="font-mono">
              {model.workload.termYears}-YEAR TERM
            </Badge>
            <Badge variant="outline" className="font-mono">
              {model.cluster.serverCount} NODES
            </Badge>
          </div>
        </div>
      </div>

      {results.totalDrives === 0 ||
      isSwitchUnderprovisioned ||
      !durability.isTopologyValid ? (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <AlertTriangleIcon />
              Architecture & topology advisories
            </CardTitle>
            <CardDescription>
              One or more physical constraints in the current configuration need
              attention.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-xs">
            {results.totalDrives === 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background/80 p-2.5">
                <span>
                  No drives are currently assigned to the storage server design
                  (0 TB raw capacity).
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSectionChange("server")}
                >
                  Configure server drives
                </Button>
              </div>
            ) : null}
            {isSwitchUnderprovisioned ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background/80 p-2.5">
                <span>
                  Switch fabric underprovisioned: {results.totalHostPorts} ×{" "}
                  {model.server.nicSpeedGbps}G host ports require{" "}
                  <strong>{results.usedSwitchPorts}</strong>{" "}
                  {results.switchSpeedGbps}G switch ports (
                  {results.availableSwitchPorts} installed across{" "}
                  {model.cluster.switchCount} switches).
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    onModelChange({
                      ...model,
                      cluster: {
                        ...model.cluster,
                        switchCount: results.minimumSwitchCount,
                      },
                    })
                  }
                >
                  Auto-size to {results.minimumSwitchCount} switches
                </Button>
              </div>
            ) : null}
            {!durability.isTopologyValid && durability.topologyWarning ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background/80 p-2.5">
                <span>{durability.topologyWarning}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSectionChange("workload")}
                >
                  Review protection layout
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric
          label="Utilized effective capacity"
          value={formatEffectiveCapacity(results.effectiveCapacityTB)}
          hint={`${formatCapacity(results.rawCapacityTB)} raw after protection, data reduction, and utilization.`}
          deltaBadge={
            capacityDelta ? (
              <Badge variant={capacityDelta.variant} className="font-mono">
                {capacityDelta.text}
              </Badge>
            ) : undefined
          }
          icon={DatabaseIcon}
        />
        <SummaryMetric
          label={`${model.workload.termYears}-year TCO`}
          value={formatCompactCurrency(results.tco)}
          hint={
            discountRatePercent > 0 || residualValuePercent > 0
              ? `NPV: ${formatCompactCurrency(results.npvTco)} (${discountRatePercent}% WACC, ${residualValuePercent}% salvage).`
              : `${results.capexPercent.toFixed(0)}% acquired upfront; ${formatCompactCurrency(results.annualizedTco)} annualized.`
          }
          deltaBadge={
            tcoDelta ? (
              <Badge variant={tcoDelta.variant} className="font-mono">
                {tcoDelta.text}
              </Badge>
            ) : undefined
          }
          icon={ReceiptTextIcon}
        />
        <SummaryMetric
          label="Cost / effective TB / mo"
          value={formatCurrency(results.tcoPerEffectiveTBMonth, 2)}
          hint={
            discountRatePercent > 0 || residualValuePercent > 0
              ? `NPV: ${formatCurrency(results.npvPerEffectiveTBMonth, 2)} / TBe / mo (${formatCurrency(results.tcoPerEffectiveTB, 2)} nominal term).`
              : `${formatCurrency(results.tcoPerEffectiveTB, 2)} per effective TB across the full term.`
          }
          deltaBadge={
            unitCostDelta ? (
              <Badge variant={unitCostDelta.variant} className="font-mono">
                {unitCostDelta.text}
              </Badge>
            ) : undefined
          }
          icon={GaugeIcon}
        />
        <SummaryMetric
          label="Average IT power"
          value={formatPower(results.averageItPowerWatts)}
          hint={`${Math.round(results.annualEnergyKwh).toLocaleString()} kWh annually after ${model.opex.pue.toFixed(2)} PUE.`}
          deltaBadge={
            powerDelta ? (
              <Badge variant={powerDelta.variant} className="font-mono">
                {powerDelta.text}
              </Badge>
            ) : undefined
          }
          icon={ZapIcon}
        />
      </div>

      {comparisonScenario && comparisonResults ? (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitCompareArrowsIcon />
              Scenario comparison vs. {comparisonScenario.name}
            </CardTitle>
            <CardDescription>{comparisonScenario.description}</CardDescription>
            <CardAction>
              <div className="flex items-center gap-2">
                {onLoadScenario ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onLoadScenario(comparisonScenario)}
                  >
                    Load baseline
                  </Button>
                ) : null}
                {onCompareScenario ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onCompareScenario(null)}
                  >
                    Dismiss
                  </Button>
                ) : null}
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead className="text-right">Active model</TableHead>
                  <TableHead className="text-right">
                    {comparisonScenario.name}
                  </TableHead>
                  <TableHead className="text-right">Delta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  {
                    label: "Total cost of ownership",
                    current: formatCurrency(results.tco),
                    base: formatCurrency(comparisonResults.tco),
                    delta: formatDeltaPercent(
                      results.tco,
                      comparisonResults.tco,
                      true
                    ),
                  },
                  {
                    label: "Cost / effective TB / month",
                    current: formatCurrency(results.tcoPerEffectiveTBMonth, 2),
                    base: formatCurrency(
                      comparisonResults.tcoPerEffectiveTBMonth,
                      2
                    ),
                    delta: formatDeltaPercent(
                      results.tcoPerEffectiveTBMonth,
                      comparisonResults.tcoPerEffectiveTBMonth,
                      true
                    ),
                  },
                  {
                    label: "Utilized effective capacity",
                    current: formatEffectiveCapacity(
                      results.effectiveCapacityTB
                    ),
                    base: formatEffectiveCapacity(
                      comparisonResults.effectiveCapacityTB
                    ),
                    delta: formatDeltaPercent(
                      results.effectiveCapacityTB,
                      comparisonResults.effectiveCapacityTB,
                      false
                    ),
                  },
                  {
                    label: "Installed raw capacity",
                    current: formatCapacity(results.rawCapacityTB),
                    base: formatCapacity(comparisonResults.rawCapacityTB),
                    delta: formatDeltaPercent(
                      results.rawCapacityTB,
                      comparisonResults.rawCapacityTB,
                      false
                    ),
                  },
                  {
                    label: "Hardware CapEx",
                    current: formatCurrency(results.hardwareCapex),
                    base: formatCurrency(comparisonResults.hardwareCapex),
                    delta: formatDeltaPercent(
                      results.hardwareCapex,
                      comparisonResults.hardwareCapex,
                      true
                    ),
                  },
                  {
                    label: "Operating expense (OpEx)",
                    current: formatCurrency(results.operationsTotal),
                    base: formatCurrency(comparisonResults.operationsTotal),
                    delta: formatDeltaPercent(
                      results.operationsTotal,
                      comparisonResults.operationsTotal,
                      true
                    ),
                  },
                  {
                    label: "Peak provisioned power",
                    current: `${results.provisionedPowerKw.toFixed(2)} kW`,
                    base: `${comparisonResults.provisionedPowerKw.toFixed(2)} kW`,
                    delta: formatDeltaPercent(
                      results.provisionedPowerKw,
                      comparisonResults.provisionedPowerKw,
                      true
                    ),
                  },
                  {
                    label: "Rack footprint",
                    current: `${results.rackCount} ${results.rackCount === 1 ? "rack" : "racks"} (${results.totalRackUnits} RU)`,
                    base: `${comparisonResults.rackCount} ${comparisonResults.rackCount === 1 ? "rack" : "racks"} (${comparisonResults.totalRackUnits} RU)`,
                    delta: formatDeltaPercent(
                      results.totalRackUnits,
                      comparisonResults.totalRackUnits,
                      true
                    ),
                  },
                ].map((row) => (
                  <TableRow key={row.label}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    <TableCell className="text-right font-mono">
                      {row.current}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {row.base}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {row.delta ? (
                        <Badge variant={row.delta.variant}>
                          {row.delta.text}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">0.0%</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Cost per effective TB breakdown</CardTitle>
          <CardDescription>
            Hardware CapEx is straight-line depreciated across the deployment
            term, with OpEx and software shown separately.
          </CardDescription>
          <CardAction>
            <Badge variant="secondary">
              {formatCurrency(results.tcoPerEffectiveTBMonth, 2)} / TBe / mo
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-3">
          {costPerEffectiveTbBreakdown.map((category) => {
            const totalBasis =
              residualValuePercent > 0 ? results.netTco : results.tco
            const share = totalBasis ? (category.total / totalBasis) * 100 : 0
            const termCostPerEffectiveTb = results.effectiveCapacityTB
              ? category.total / results.effectiveCapacityTB
              : 0

            return (
              <Card size="sm" key={category.key}>
                <CardHeader>
                  <CardTitle>{category.label}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                  <CardAction>
                    <Badge variant="outline">{share.toFixed(0)}%</Badge>
                  </CardAction>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-end justify-between gap-3">
                    <span className="font-mono text-2xl font-semibold tracking-tight">
                      {formatCurrency(category.perEffectiveTbMonth, 2)}
                    </span>
                    <span className="pb-1 text-[0.625rem] text-muted-foreground">
                      / TBe / month
                    </span>
                  </div>
                  <Progress
                    value={share}
                    aria-label={`${category.label} share of total cost`}
                  />
                </CardContent>
                <CardFooter className="flex-wrap justify-between gap-2 border-t text-[0.625rem] text-muted-foreground">
                  <span>
                    {formatCurrency(termCostPerEffectiveTb, 2)} / TBe over term
                  </span>
                  <span className="font-mono">
                    {formatCompactCurrency(category.total)} total
                  </span>
                </CardFooter>
              </Card>
            )
          })}
        </CardContent>
        <CardFooter className="flex-wrap justify-between gap-2 border-t">
          <span className="text-muted-foreground">
            {residualValuePercent > 0
              ? "Net depreciated hardware CapEx + OpEx + software"
              : "Depreciated hardware CapEx + OpEx + software"}
          </span>
          <span className="font-mono font-semibold">
            {formatCurrency(
              effectiveCapexPerTbMonth +
                results.operationsPerEffectiveTBMonth +
                results.softwarePerEffectiveTBMonth,
              2
            )}{" "}
            / TBe / month
          </span>
        </CardFooter>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Total-term TCO by section</CardTitle>
            <CardDescription>
              Every acquisition and recurring cost across the full{" "}
              {model.workload.termYears}-year term.
            </CardDescription>
            <CardAction>
              <Badge variant="secondary">
                {formatCompactCurrency(results.tco)} total
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-72 w-full">
              <PieChart accessibilityLayer>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      nameKey="key"
                      formatter={(value, _name, item) => {
                        const payload = item.payload as {
                          name?: string
                          fill?: string
                        }
                        const amount = Number(value)
                        const share = results.tco
                          ? (amount / results.tco) * 100
                          : 0

                        return (
                          <>
                            <span
                              className="size-2.5 shrink-0 rounded-[2px]"
                              style={{ backgroundColor: payload.fill }}
                            />
                            <span className="flex flex-1 items-center justify-between gap-4">
                              <span className="text-muted-foreground">
                                {payload.name}
                              </span>
                              <span className="font-mono font-medium tabular-nums">
                                {formatCompactCurrency(amount)} ·{" "}
                                {share.toFixed(0)}%
                              </span>
                            </span>
                          </>
                        )
                      }}
                    />
                  }
                />
                <Pie
                  data={tcoMixData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={72}
                  outerRadius={112}
                  paddingAngle={2}
                  stroke="var(--card)"
                  strokeWidth={3}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox))
                        return null

                      const centerX = Number(viewBox.cx)
                      const centerY = Number(viewBox.cy)

                      return (
                        <text
                          x={centerX}
                          y={centerY}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={centerX}
                            y={centerY - 5}
                            className="fill-foreground font-mono text-xl font-semibold"
                          >
                            {formatCompactCurrency(results.tco)}
                          </tspan>
                          <tspan
                            x={centerX}
                            y={centerY + 17}
                            className="fill-muted-foreground text-[0.625rem]"
                          >
                            {model.workload.termYears}-year TCO
                          </tspan>
                        </text>
                      )
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost mix</CardTitle>
            <CardDescription>
              Share of total cost by economic category.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {results.categories.map((category) => {
              const share = results.tco
                ? (category.value / results.tco) * 100
                : 0

              return (
                <div className="flex flex-col gap-2" key={category.key}>
                  <div className="flex items-center justify-between gap-3 text-xs font-medium">
                    <span>{category.name}</span>
                    <span className="font-mono text-muted-foreground">
                      {share.toFixed(0)}% ·{" "}
                      {formatCompactCurrency(category.value)}
                    </span>
                  </div>
                  <Progress
                    value={share}
                    aria-label={`${category.name} share of total cost`}
                  />
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Annual cash-flow & NPV schedule</CardTitle>
          <CardDescription>
            Acquisition outlay followed by annual recurring software and
            operating expense across the {model.workload.termYears}-year term.
          </CardDescription>
          <CardAction>
            <Badge variant="outline" className="font-mono">
              NPV: {formatCompactCurrency(results.npvTco)} (
              {discountRatePercent.toFixed(1)}% WACC)
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <ChartContainer config={annualChartConfig} className="h-64 w-full">
            <BarChart data={results.annualCosts} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="period"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCompactCurrency(Number(value))}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <span className="flex flex-1 items-center justify-between gap-4">
                        <span className="text-muted-foreground capitalize">
                          {String(name)}
                        </span>
                        <span className="font-mono font-medium tabular-nums">
                          {formatCurrency(Number(value))}
                        </span>
                      </span>
                    )}
                  />
                }
              />
              <Bar
                dataKey="hardware"
                stackId="a"
                fill="var(--color-hardware)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="software"
                stackId="a"
                fill="var(--color-software)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="operations"
                stackId="a"
                fill="var(--color-operations)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Hardware</TableHead>
                  <TableHead className="text-right">Software</TableHead>
                  <TableHead className="text-right">OpEx</TableHead>
                  <TableHead className="text-right">Discounted PV</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.annualCosts.map((item) => (
                  <TableRow key={item.period}>
                    <TableCell className="font-medium">{item.period}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCompactCurrency(
                        item.hardware - item.residualCredit
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCompactCurrency(item.software)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCompactCurrency(item.operations)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {formatCompactCurrency(item.discountedTotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4}>
                    Total present value (NPV TCO)
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(results.npvTco)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Auditable cost ledger</CardTitle>
            <CardDescription>
              Every output is traceable to a visible configuration input.
            </CardDescription>
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
                  [
                    "Drive acquisition",
                    `${results.totalDrives.toLocaleString()} drives (${results.nvmeDriveCount} NVMe, ${results.hddDriveCount} HDD)`,
                    results.driveCapex,
                  ],
                  [
                    "Server acquisition",
                    `${model.cluster.serverCount} nodes`,
                    results.serverCapex,
                  ],
                  [
                    "Network acquisition",
                    `${model.cluster.switchCount} × ${results.switchPortsPerSwitch}-port ${results.switchSpeedGbps}G switches + interconnects`,
                    results.networkCapex,
                  ],
                  [
                    "Software licenses",
                    "Upfront + recurring",
                    results.softwareTotal,
                  ],
                  [
                    "Electricity",
                    `${Math.round(results.annualEnergyKwh).toLocaleString()} kWh / year`,
                    results.electricityTotal,
                  ],
                  [
                    "Colocation",
                    `${results.provisionedPowerKw.toFixed(2)} MAX kW × ${formatCurrency(model.opex.coloPerKwMonth)} / kW / mo`,
                    results.coloSpaceTotal,
                  ],
                  [
                    "Internet bandwidth",
                    `${model.opex.internetBandwidthGbps.toLocaleString()} Gb/s / rack × ${results.rackCount} ${results.rackCount === 1 ? "rack" : "racks"}`,
                    results.networkOpexTotal,
                  ],
                  [
                    "Support & operations",
                    "Replacement + support + admin",
                    results.replacementTotal +
                      results.supportTotal +
                      results.adminTotal,
                  ],
                  ...(results.residualValueCredit > 0
                    ? [
                        [
                          "Hardware residual / salvage credit",
                          `${residualValuePercent}% of hardware CapEx recovered at end of term`,
                          -results.residualValueCredit,
                        ] as const,
                      ]
                    : []),
                ].map(([name, basis, value]) => (
                  <TableRow key={String(name)}>
                    <TableCell className="font-medium">{name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {basis}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(Number(value))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2}>
                    Gross total cost of ownership
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(results.tco)}
                  </TableCell>
                </TableRow>
                {results.residualValueCredit > 0 || discountRatePercent > 0 ? (
                  <TableRow>
                    <TableCell colSpan={2}>
                      {discountRatePercent > 0
                        ? `Discounted NPV TCO (${discountRatePercent.toFixed(1)}% WACC${results.residualValueCredit > 0 ? `, ${residualValuePercent}% salvage` : ""})`
                        : `Net TCO after ${residualValuePercent}% hardware residual credit`}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(
                        discountRatePercent > 0
                          ? results.npvTco
                          : results.netTco
                      )}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableFooter>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration path</CardTitle>
            <CardDescription>
              Your model, from media to decision.
            </CardDescription>
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
              {
                id: "cluster" as const,
                icon: NetworkIcon,
                label: "Cluster & fabric",
                value: `${model.cluster.serverCount} nodes · ${model.cluster.switchCount} × ${results.switchPortsPerSwitch}p ${results.switchSpeedGbps}G`,
              },
              {
                id: "software" as const,
                icon: CircuitBoardIcon,
                label: "Software & license",
                value: results.softwareTotal
                  ? `${formatCompactCurrency(results.softwareTotal)} over term`
                  : "No license load",
              },
              {
                id: "workload" as const,
                icon: Layers3Icon,
                label: "Workload efficiency",
                value: `${model.workload.dataReductionRatio}× reduction`,
              },
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
          scenarios={props.scenarios}
          comparisonScenario={props.comparisonScenario}
          onCompareScenario={props.onCompareScenario}
          onLoadScenario={props.onLoadScenario}
          onSaveScenario={props.onSaveScenario}
          onModelChange={props.onModelChange}
          onSectionChange={props.onSectionChange}
        />
      )
  }
}
