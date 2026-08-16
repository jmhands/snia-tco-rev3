import {
  DownloadIcon,
  MoonIcon,
  RotateCcwIcon,
  SparklesIcon,
  SunIcon,
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
import { Separator } from "@workspace/ui/components/separator"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"

import { useTheme } from "@/components/theme-provider"
import { SECTION_META, type SectionId } from "@/lib/tco-model"

export function SiteHeader({
  activeSection,
  onExport,
  onReset,
}: {
  activeSection: SectionId
  onExport: () => void
  onReset: () => void
}) {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <header className="sticky top-0 z-20 flex h-(--header-height) shrink-0 items-center border-b bg-background/85 backdrop-blur-xl transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-1 h-4 data-vertical:self-auto" />
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="flex-nowrap">
            <BreadcrumbItem className="hidden sm:inline-flex">TCO model</BreadcrumbItem>
            <BreadcrumbSeparator className="hidden sm:list-item" />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="truncate">{SECTION_META[activeSection].label}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="ml-auto flex items-center gap-1.5">
          <Badge variant="outline" className="hidden gap-1 font-mono tracking-wide md:inline-flex">
            <SparklesIcon data-icon="inline-start" />
            LIVE RECALC
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </Button>
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RotateCcwIcon data-icon="inline-start" />
            <span className="hidden lg:inline">Reset</span>
          </Button>
          <Button size="sm" onClick={onExport}>
            <DownloadIcon data-icon="inline-start" />
            <span className="hidden sm:inline">Export summary</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
