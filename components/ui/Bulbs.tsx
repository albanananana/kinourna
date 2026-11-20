export function Bulbs({ count = 24, className = "" }: { count?: number; className?: string }) {
  return (
    <div aria-hidden className={`bulbs ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="bulb" style={{ ["--i" as string]: i % 3 }} />
      ))}
    </div>
  );
}
