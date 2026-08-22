export function Avatar({ name }: { name: string }) {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-neutral-800 text-sm text-neutral-300">
      {name.slice(0, 1)}
    </span>
  );
}
