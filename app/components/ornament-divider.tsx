export default function OrnamentDivider({ hero = false }: { hero?: boolean }) {
  return (
    <div className={`ornament-divider${hero ? " hero-size" : ""}`} aria-hidden="true">
      <span />
      <span className="diamond" />
      <span />
    </div>
  );
}
