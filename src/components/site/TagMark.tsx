/** The Loxen mark: an evidence tag with its punched hole. */
export function TagMark({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 1.3)}
      viewBox="0 0 20 26"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path fillRule="evenodd" d="M4 0h12l4 4v22H0V4L4 0Zm6 3.2a2.3 2.3 0 1 0 0 4.6 2.3 2.3 0 0 0 0-4.6Z" />
    </svg>
  );
}
