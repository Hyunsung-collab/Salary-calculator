import { cn } from "@/lib/utils"

export type ActionToastTone = "success" | "warning" | "error"

type ActionToastProps = {
  messages: string[]
  tone?: ActionToastTone
}

export function ActionToast({ messages, tone = "success" }: ActionToastProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      className={cn(
        "fixed bottom-24 left-4 right-4 z-[60] mx-auto max-w-sm rounded-md border p-4 text-sm shadow-lg md:bottom-6 md:left-auto md:right-6 md:mx-0",
        tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : tone === "error" ? "border-red-200 bg-red-50 text-red-900"
          : "border-amber-200 bg-amber-50 text-amber-900"
      )}
    >
      <div className="space-y-1">
        {messages.map((message) => (
          <p key={message}>{message}</p>
        ))}
      </div>
    </div>
  )
}
