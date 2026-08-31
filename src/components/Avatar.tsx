export function Avatar({ name }: { name: string }) {
  // 색을 인라인으로 고정한다. 유틸리티 클래스를 쓰면 밝은 테마의 색 반전 규칙에
  // 걸려 어두운 동그라미에 어두운 글자가 되어 안 보인다.
  return (
    <span
      className="grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold"
      style={{ background: "rgb(var(--c-accent))", color: "#FFFFFF" }}
    >
      {name.slice(0, 1)}
    </span>
  );
}