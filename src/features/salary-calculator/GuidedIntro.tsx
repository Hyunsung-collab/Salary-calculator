"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const steps = [
  { title: "급여 조건을 입력하세요", description: "시급과 수당, 공제 조건을 알려주세요. 이 조건으로 이번 달 예상 급여를 계산해요." },
  { title: "이번 달 근무 만들기", description: "반복 근무를 한 번에 만들거나 하나씩 추가하세요. 시간은 선택하거나 직접 입력할 수 있어요." },
  { title: "예상 급여를 바로 확인하세요", description: "근무를 바꾸면 예상 급여도 바뀌어요. ‘급여 자세히 보기’에서 내역을 확인하세요." },
  { title: "캘린더에서 근무일을 확인하세요", description: "월별 근무일을 한눈에 볼 수 있어요. 근무일을 누르면 그날의 시간과 휴게시간이 보여요." }
]

export function GuidedIntro({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [step])
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onComplete() }}>
      <DialogContent className="max-w-md" onInteractOutside={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>급여 계산기에 오신 것을 환영해요</DialogTitle>
          <DialogDescription>짧게 사용법을 알려드릴게요.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-5">
          <p className="text-sm font-medium text-slate-500">{step + 1} / {steps.length}</p>
          <h3 ref={heading} tabIndex={-1} className="text-xl font-semibold outline-none">{steps[step].title}</h3>
          <p className="text-base leading-7 text-slate-600">{steps[step].description}</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="ghost" onClick={onComplete}>건너뛰기</Button>
          <div className="flex gap-2">
            {step > 0 && <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>이전</Button>}
            <Button type="button" onClick={() => step === steps.length - 1 ? onComplete() : setStep(step + 1)}>{step === steps.length - 1 ? "시작하기" : "다음"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
