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
};

export default nextConfig;