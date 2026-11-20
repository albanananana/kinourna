import type { Player } from "@/lib/types";

export const HUES = ["#e5382c", "#f3b443", "#57b8a3", "#7c9cf2", "#d27bd6", "#9cc55b", "#f0895b", "#c8b49c"];

export function hueOf(player: Pick<Player, "hue">) {
  return HUES[player.hue % HUES.length];
}

export function Avatar({
  player,
  size = 32,
  dim,
  ring,
}: {
  player: Pick<Player, "name" | "hue">;
  size?: number;
  dim?: boolean;
  ring?: boolean;
}) {
  const color = hueOf(player);
  return (
    <span
      aria-hidden
      className="inline-grid shrink-0 place-items-center rounded-full font-display font-extrabold uppercase leading-none transition-opacity"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.56,
        color,
        background: `color-mix(in oklab, ${color} 16%, #13110f)`,
        boxShadow: ring ? `0 0 0 2px #0b0a09, 0 0 0 4px ${color}` : `inset 0 0 0 1.5px color-mix(in oklab, ${color} 45%, transparent)`,
        opacity: dim ? 0.35 : 1,
      }}
    >
      {player.name.trim().charAt(0) || "?"}
    </span>
  );
}
