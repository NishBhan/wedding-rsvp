/* A monogram image as WebP (a fraction of the size, sized for its largest
   use on a 3x phone screen) with the original PNG as the fallback for
   browsers that can't show WebP. `name` is the file in public/assets
   without its extension. */
export default function MonogramImg({
  name,
  fallback = name,
  alt,
  className,
  ariaHidden,
}: {
  name: string;
  fallback?: string;
  alt: string;
  className?: string;
  ariaHidden?: boolean;
}) {
  return (
    <picture>
      <source srcSet={`/assets/${name}.webp`} type="image/webp" />
      <img
        src={`/assets/${fallback}.png`}
        alt={alt}
        className={className}
        aria-hidden={ariaHidden || undefined}
        decoding="async"
      />
    </picture>
  );
}
