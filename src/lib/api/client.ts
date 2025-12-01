/**
 * API 클라이언트 (Axios 기반)
 * FastAPI 백엔드와 통신
 */

import axios from "axios";

const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:59234";

/**
 * 데모 모드 여부 확인 (URL에 ?demo=true 포함 시)
 * 투자자 프레젠테이션용 - 실제 거래처 이름이 가명으로 표시됨
 */
export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("demo") === "true";
}

/**
 * API URL 반환 (데모 모드 시 /demo prefix 추가)
 */
export function getApiUrl(): string {
  if (isDemoMode()) {
    return `${BASE_API_URL}/demo`;
  }
  return BASE_API_URL;
}

// 동적으로 baseURL을 설정하기 위해 interceptor 사용
export const apiClient = axios.create({
  baseURL: BASE_API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor (데모 모드 + 인증 토큰)
apiClient.interceptors.request.use(
  (config) => {
    // 데모 모드: baseURL에 /demo prefix 추가
    if (isDemoMode()) {
      config.baseURL = `${BASE_API_URL}/demo`;
    }

    // 향후 인증 토큰 추가 시 사용
    // const token = localStorage.getItem("token");
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor (에러 핸들링)
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 에러 로깅 및 처리
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);
