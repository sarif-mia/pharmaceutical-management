/** App logo. Uses public/favicon.svg so the in-app mark and the browser icon never drift apart. */
export function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return <img src="/favicon.svg" alt="" aria-hidden="true" className={`shrink-0 ${className}`} />;
}
