/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // 클라이언트 라우터 캐시 유지 시간(초).
    // 뒤로 가거나 최근에 본 화면으로 돌아갈 때 서버를 다시 치지 않고 즉시 그린다.
    // 데이터가 바뀌는 동작(서버 액션)들은 revalidatePath 를 호출하므로 즉시 갱신된다.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  // 기본 보안 헤더. 전자칠판의 구형 브라우저(Chromium 64)도 모두 지원한다.
  // CSP 전체 적용은 Next 인라인 스크립트·테마 <style> 에 nonce 가 필요해 보류하고,
  // 다른 사이트가 iframe 으로 감싸는 것만 막는다.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;