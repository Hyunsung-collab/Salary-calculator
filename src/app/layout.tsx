import "./globals.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "하이브리드 급여 계산기",
  description: "근무 기록과 엑셀 임포트를 함께 쓰는 급여 계산기"
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
