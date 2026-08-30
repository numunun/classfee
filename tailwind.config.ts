import type { Config } from "tailwindcss";

// 색을 CSS 변수로 빼서 개인 테마가 덮어쓸 수 있게 한다.
// 변수는 "R G B" 숫자 3개만 담고, <alpha-value> 로 투명도 지정도 계속 쓸 수 있다.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        "surface-2": "rgb(var(--c-surface-2) / <alpha-value>)",
        line: "rgb(var(--c-line) / <alpha-value>)",
        accent: "rgb(var(--c-accent) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["Pretendard", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;