import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "요금제 추천 실습",
  description: "요금제 추천 화면 구현을 위한 실습 프로젝트",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
