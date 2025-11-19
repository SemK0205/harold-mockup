import { redirect } from "next/navigation";

export default function Home() {
  // 루트 페이지는 대시보드로 리다이렉트
  redirect("/dashboard");
}
