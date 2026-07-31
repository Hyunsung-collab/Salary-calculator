"use client"

import { BriefcaseBusiness, House, Menu, WalletCards } from "lucide-react"

import { Button } from "@/components/ui/button"

export type AppSection = "home" | "work" | "salary" | "more"

type SalaryAppNavigationProps = {
  section: AppSection
  onSectionChange: (section: AppSection) => void
}

const items: Array<{ id: AppSection; label: string; Icon: typeof House }> = [
  { id: "home", label: "홈", Icon: House },
  { id: "work", label: "근무", Icon: BriefcaseBusiness },
  { id: "salary", label: "급여", Icon: WalletCards },
  { id: "more", label: "전체", Icon: Menu }
]

export function SalaryAppNavigation({
  section,
  onSectionChange
}: SalaryAppNavigationProps) {
  return (
    <nav
      aria-label="급여 계산기 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-lg backdrop-blur md:static md:border-0 md:bg-transparent md:px-0 md:pb-0 md:shadow-none"
    >
      <div className="mx-auto flex max-w-6xl justify-around md:justify-start md:gap-2">
        {items.map(({ id, label, Icon }) => {
          const selected = section === id
          return (
            <Button
              key={id}
              type="button"
              variant={selected ? "default" : "ghost"}
              className="min-h-11 min-w-16 flex-1 flex-col gap-0.5 px-2 py-1 text-xs md:min-w-20 md:flex-row md:gap-2 md:text-sm"
              aria-label={`${label} 화면`}
              aria-current={selected ? "page" : undefined}
              onClick={() => onSectionChange(id)}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </Button>
          )
        })}
      </div>
    </nav>
  )
}
