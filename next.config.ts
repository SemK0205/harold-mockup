import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'export', // GitHub Pages용 정적 export
  basePath: '/harold-mockup', // GitHub Pages repository name
  images: {
    unoptimized: true, // 정적 export에서는 이미지 최적화 비활성화
  },
};

export default nextConfig;
