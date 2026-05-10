/**
 * Shared list container for the right panel (character lists, title rows, etc.).
 */
export default function PanelListShell({ children, className = "" }) {
  return (
    <div
      className={`rounded-xl bg-ads-surface-sunken/35 px-3 py-4 ${className}`.trim()}
    >
      {children}
    </div>
  );
}
