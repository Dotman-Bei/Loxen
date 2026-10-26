/** The Loxen mark: an evidence tag, with its punched hole, cut into an L. Same path as public/brand/. */
export function TagMark({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={Math.round((size * 28) / 22)}
      viewBox="0 0 22 28"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path fillRule="evenodd" d="M0 3 3 0h5l3 3v16h11v9H0Z M5.5 4.1a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" />
    </svg>
  );
}
