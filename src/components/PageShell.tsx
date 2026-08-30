// 모바일에서는 좁은 한 컬럼, 데스크톱에서는 넓은 본문으로 동작하는 공통 컨테이너.
// relative z-10 은 테마 배경(ThemeBackdrop) 위에 내용이 오도록 하기 위한 것.
// 상단 여백에 safe-area 를 더해 사파리 전체화면 툴바에 가려지지 않게 한다.
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative z-10 mx-auto w-full max-w-md px-4 pb-24 sm:max-w-3xl sm:px-6"
      style={{ paddingTop: "calc(1.5rem + env(safe-area-inset-top))" }}
    >
      {children}
    </div>
  );
}