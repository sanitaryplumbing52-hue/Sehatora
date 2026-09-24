import clsx from "clsx";

const PALETTE = ["#2563EB", "#16A34A", "#F59E0B", "#DC2626", "#7C3AED", "#0891B2"];

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function Avatar({ name, src, size = 32 }: { name: string; src?: string | null; size?: number }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover border border-border dark:border-border-dark"
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, backgroundColor: colorFor(name), fontSize: size * 0.4 }}
      className={clsx("flex items-center justify-center rounded-full font-semibold text-white shrink-0")}
    >
      {initials}
    </div>
  );
}
