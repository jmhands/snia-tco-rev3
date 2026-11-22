import * as React from "react"
import {
  BookmarkPlusIcon,
  CheckIcon,
  ChevronDownIcon,
  DownloadIcon,
  FileJsonIcon,
  FileSpreadsheetIcon,
  FolderKanbanIcon,
  GitCompareArrowsIcon,
  LinkIcon,
  MoonIcon,
  RotateCcwIcon,
  SparklesIcon,
  SunIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"
import { Separator } from "@workspace/ui/components/separator"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"

import { useTheme } from "@/components/theme-provider"
import {
  SECTION_META,
  type SavedScenario,
  type SectionId,
} from "@/lib/tco-model"

export function SiteHeader({
  activeSection,
  scenarios,
  comparisonScenarioId,
  defaultScenarioName,
  onLoadScenario,
  onSaveScenario,
  onDeleteScenario,
  onCompareScenario,
  onShareLink,
  onExport,
  onExportJson,
  onImportJson,
  onReset,
}: {
  activeSection: SectionId
  scenarios: SavedScenario[]
  comparisonScenarioId: string | null
  defaultScenarioName: string
  onLoadScenario: (scenario: SavedScenario) => void
  onSaveScenario: (customName?: string) => void
  onDeleteScenario: (id: string) => void
  onCompareScenario: (id: string | null) => void
  onShareLink: () => void
  onExport: () => void
  onExportJson: () => void
  onImportJson: (file: File) => void
  onReset: () => void
}) {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [scenarioDraftName, setScenarioDraftName] = React.useState("")
  const activeComparison = scenarios.find(
    (scenario) => scenario.id === comparisonScenarioId
  )

  const submitSaveScenario = () => {
    const chosenName = scenarioDraftName.trim() || defaultScenarioName
    onSaveScenario(chosenName)
    setScenarioDraftName("")
  }

  return (
    <header className="sticky top-0 z-20 flex h-(--header-height) shrink-0 items-center border-b bg-background/85 backdrop-blur-xl transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-1 h-4 data-vertical:self-auto"
        />
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="flex-nowrap">
            <BreadcrumbItem className="hidden sm:inline-flex">
              TCO model
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden sm:list-item" />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="truncate">
                {SECTION_META[activeSection].label}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="ml-auto flex items-center gap-1.5">
          {activeComparison ? (
            <Badge
              variant="secondary"
              className="hidden gap-1 font-mono text-[0.625rem] xl:inline-flex"
            >
              <GitCompareArrowsIcon data-icon="inline-start" />
              VS {activeComparison.name.toUpperCase()}
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="hidden gap-1 font-mono tracking-wide md:inline-flex"
            >
              <SparklesIcon data-icon="inline-start" />
              LIVE RECALC
            </Badge>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="sm" />}
            >
              <FolderKanbanIcon data-icon="inline-start" />
              <span className="hidden md:inline">Scenarios</span>
              <ChevronDownIcon data-icon="inline-end" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-84">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  Reference & saved scenarios
                </DropdownMenuLabel>
                {scenarios.map((scenario) => {
                  const isComparing = scenario.id === comparisonScenarioId

                  return (
                    <div
                      key={scenario.id}
                      className="flex items-center justify-between gap-1 px-1 py-0.5"
                    >
                      <DropdownMenuItem
                        className="min-w-0 flex-1"
                        onClick={() => onLoadScenario(scenario)}
                      >
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className="flex items-center gap-1.5 truncate font-medium">
                            {scenario.name}
                            {scenario.isPreset ? (
                              <Badge
                                variant="outline"
                                className="text-[0.55rem]"
                              >
                                Preset
                              </Badge>
                            ) : null}
                          </span>
                          <span className="truncate text-[0.625rem] text-muted-foreground">
                            {scenario.description}
                          </span>
                        </span>
                      </DropdownMenuItem>
                      <Button
                        size="icon-sm"
                        variant={isComparing ? "secondary" : "ghost"}
                        title={
                          isComparing
                            ? "Clear comparison baseline"
                            : `Compare active model against ${scenario.name}`
                        }
                        aria-label={
                          isComparing
                            ? "Clear comparison baseline"
                            : `Compare active model against ${scenario.name}`
                        }
                        onClick={(event) => {
                          event.stopPropagation()
                          onCompareScenario(isComparing ? null : scenario.id)
                        }}
                      >
                        {isComparing ? (
                          <CheckIcon data-icon="inline-start" />
                        ) : (
                          <GitCompareArrowsIcon data-icon="inline-start" />
                        )}
                      </Button>
                      {!scenario.isPreset ? (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          title={`Delete ${scenario.name}`}
                          aria-label={`Delete ${scenario.name}`}
                          onClick={(event) => {
                            event.stopPropagation()
                            onDeleteScenario(scenario.id)
                          }}
                        >
                          <Trash2Icon data-icon="inline-start" />
                        </Button>
                      ) : null}
                    </div>
                  )
                })}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <div
                className="flex flex-col gap-1.5 p-2"
                onKeyDown={(event) => event.stopPropagation()}
              >
                <span className="text-[0.625rem] font-medium text-muted-foreground">
                  Save active configuration
                </span>
                <div className="flex items-center gap-1.5">
                  <Input
                    value={scenarioDraftName}
                    onChange={(event) =>
                      setScenarioDraftName(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        submitSaveScenario()
                      }
                    }}
                    placeholder={defaultScenarioName}
                    aria-label="Scenario name"
                    className="h-7 text-xs"
                  />
                  <Button size="sm" onClick={submitSaveScenario}>
                    <BookmarkPlusIcon data-icon="inline-start" />
                    Save
                  </Button>
                </div>
              </div>
              {comparisonScenarioId ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => onCompareScenario(null)}>
                      <GitCompareArrowsIcon />
                      Clear comparison baseline
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onShareLink}
            title="Copy shareable scenario link"
          >
            <LinkIcon data-icon="inline-start" />
            <span className="hidden xl:inline">Share</span>
          </Button>

          <Button variant="ghost" size="sm" onClick={onReset}>
            <RotateCcwIcon data-icon="inline-start" />
            <span className="hidden lg:inline">Reset</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button size="sm" />}>
              <DownloadIcon data-icon="inline-start" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDownIcon data-icon="inline-end" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Scenario & ledger I/O</DropdownMenuLabel>
                <DropdownMenuItem onClick={onExport}>
                  <FileSpreadsheetIcon />
                  Export summary CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExportJson}>
                  <FileJsonIcon />
                  Export scenario JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <UploadIcon />
                  Import scenario JSON…
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) {
                onImportJson(file)
                event.target.value = ""
              }
            }}
          />
        </div>
      </div>
    </header>
  )
}
