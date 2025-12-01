import { redirect } from "next/navigation";

interface HomeProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  // 루트 페이지는 대시보드로 리다이렉트 (쿼리 파라미터 유지)
  const queryString = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      if (typeof value === "string") acc[key] = value;
      return acc;
    }, {} as Record<string, string>)
  ).toString();

  redirect(queryString ? `/dashboard?${queryString}` : "/dashboard");
}
