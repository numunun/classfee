// 모바일에서는 좁은 한 컬럼(기존 /student 느낌),
// 데스크톱에서는 넓은 본문(기존 /admin 느낌)으로 동작하는 공통 컨테이너.
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md px-4 pb-24 pt-4 sm:max-w-3xl sm:px-6">
      {children}
    </div>
  );
}