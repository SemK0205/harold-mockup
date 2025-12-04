/**
 * API 클라이언트 (Axios 기반)
 * FastAPI 백엔드와 통신
 */

import axios from "axios";

const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:59234";

/**
 * API URL 반환
 */
export function getApiUrl(): string {
  return BASE_API_URL;
}

// Axios 인스턴스 생성
export const apiClient = axios.create({
  baseURL: BASE_API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor (인증 토큰)
apiClient.interceptors.request.use(
  (config) => {
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
