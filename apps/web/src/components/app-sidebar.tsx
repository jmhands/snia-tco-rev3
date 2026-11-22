import type { ComponentType } from "react"
import {
  BoxesIcon,
  ChartNoAxesCombinedIcon,
  CircuitBoardIcon,
  DatabaseIcon,
  Layers3Icon,
  NetworkIcon,
  ReceiptTextIcon,
  ServerCogIcon,
} from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar"

import {
  formatCapacity,
  formatCurrency,
  type SectionId,
  type TcoResults,
} from "@/lib/tco-model"

type NavigationItem = {
  id: SectionId
  label: string
  icon: ComponentType
}

const buildItems: NavigationItem[] = [
  { id: "drive", label: "Drive config", icon: DatabaseIcon },
  { id: "server", label: "Server config", icon: ServerCogIcon },
  { id: "cluster", label: "Cluster config", icon: NetworkIcon },
]

const economicsItems: NavigationItem[] = [
  { id: "software", label: "Software & license", icon: CircuitBoardIcon },
  { id: "workload", label: "Workload & reduction", icon: Layers3Icon },
  { id: "opex", label: "OpEx config", icon: ReceiptTextIcon },
  { id: "summary", label: "TCO summary", icon: ChartNoAxesCombinedIcon },
]

function NavigationGroup({
  label,
  items,
  activeSection,
  summaryValue,
  onSectionChange,
}: {
  label: string
  items: NavigationItem[]
  activeSection: SectionId
  summaryValue: number
  onSectionChange: (section: SectionId) => void
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="font-mono text-[0.625rem] tracking-[0.18em] uppercase">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon

            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  isActive={activeSection === item.id}
                  tooltip={item.label}
                  onClick={() => onSectionChange(item.id)}
                >
                  <Icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
                {item.id === "summary" ? (
                  <SidebarMenuBadge>
                    {formatCurrency(summaryValue, 2)}
                  </SidebarMenuBadge>
                ) : null}
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AppSidebar({
  activeSection,
  onSectionChange,
  tcoResults,
  ...props
}: Omit<React.ComponentProps<typeof Sidebar>, "results"> & {
  activeSection: SectionId
  onSectionChange: (section: SectionId) => void
  tcoResults: TcoResults
}) {
  const { isMobile, setOpenMobile } = useSidebar()
  const changeSection = (section: SectionId) => {
    onSectionChange(section)
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="SNIA TCO Lab"
              isActive={activeSection === "summary"}
              onClick={() => changeSection("summary")}
              className="h-14 group-data-[collapsible=icon]:h-8"
            >
              <span className="relative flex h-11 w-full min-w-0 items-center overflow-hidden rounded-md bg-sidebar-primary-foreground px-3 shadow-sm ring-1 ring-sidebar-border group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1!">
                <img
                  src="/snia-logo.svg"
                  alt="SNIA"
                  className="h-auto w-[8.75rem] max-w-full group-data-[collapsible=icon]:hidden dark:hidden"
                />
                <img
                  src="/snia-logo-dark.svg"
                  alt="SNIA"
                  className="absolute inset-0 hidden size-full object-cover group-data-[collapsible=icon]:hidden dark:block"
                />
                <img
                  src="/snia-mark.svg"
                  alt=""
                  aria-hidden="true"
                  className="hidden size-6 group-data-[collapsible=icon]:block dark:group-data-[collapsible=icon]:hidden"
                />
                <img
                  src="/snia-mark-dark.svg"
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 hidden size-full object-cover dark:group-data-[collapsible=icon]:block"
                />
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavigationGroup
          label="Build"
          items={buildItems}
          activeSection={activeSection}
          summaryValue={tcoResults.tcoPerEffectiveTBMonth}
          onSectionChange={changeSection}
        />
        <NavigationGroup
          label="Economics"
          items={economicsItems}
          activeSection={activeSection}
          summaryValue={tcoResults.tcoPerEffectiveTBMonth}
          onSectionChange={changeSection}
        />
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              variant="outline"
              tooltip={`${formatCapacity(tcoResults.effectiveCapacityTB)} utilized effective capacity`}
              onClick={() => changeSection("summary")}
            >
              <BoxesIcon />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="flex items-center gap-2 font-medium">
                  Live model
                  <Badge variant="secondary">Synced</Badge>
                </span>
                <span className="truncate font-mono text-[0.625rem] text-sidebar-foreground/60">
                  {formatCapacity(tcoResults.effectiveCapacityTB)} ·{" "}
                  {tcoResults.rackCount} rack
                  {tcoResults.rackCount === 1 ? "" : "s"}
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
