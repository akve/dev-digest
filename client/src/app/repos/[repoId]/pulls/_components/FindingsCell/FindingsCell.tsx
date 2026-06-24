"use client";

import React from "react";
import ReactDOM from "react-dom";
import { Icon, SEV } from "@devdigest/ui";
import type { Severity } from "@devdigest/ui";
import { usePrReviews } from "../../../../../../lib/hooks/reviews";

const SEV_ORDER: Severity[] = ["CRITICAL", "WARNING", "SUGGESTION"];

interface FindingsCellProps {
  prId: string | null | undefined;
  findingsBySeverity: { CRITICAL: number; WARNING: number; SUGGESTION: number } | null | undefined;
}

export function FindingsCell({ prId, findingsBySeverity }: FindingsCellProps) {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  // Position popover below the button using getBoundingClientRect (escapes overflow:hidden).
  const openPopover = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 8, left: rect.left });
    setOpen((o) => !o);
  };

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        btnRef.current?.contains(e.target as Node) ||
        popoverRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const hasCounts =
    findingsBySeverity &&
    (findingsBySeverity.CRITICAL > 0 || findingsBySeverity.WARNING > 0 || findingsBySeverity.SUGGESTION > 0);

  if (!hasCounts) return <span style={{ color: "var(--text-muted)" }}>—</span>;

  return (
    <>
      <button
        ref={btnRef}
        onClick={openPopover}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
        title="View findings"
      >
        {SEV_ORDER.filter((s) => (findingsBySeverity[s as keyof typeof findingsBySeverity] ?? 0) > 0).map((sev) => {
          const { c, icon } = SEV[sev];
          const IconComp = Icon[icon as keyof typeof Icon] as React.FC<{ size: number; style?: React.CSSProperties }>;
          const cnt = findingsBySeverity[sev as keyof typeof findingsBySeverity];
          return (
            <span key={sev} style={{ display: "inline-flex", alignItems: "center", gap: 3, color: c, fontSize: 12, fontWeight: 600 }}>
              {IconComp && <IconComp size={13} style={{ color: c }} />}
              {cnt}
            </span>
          );
        })}
      </button>

      {open && prId && pos &&
        ReactDOM.createPortal(
          <FindingsPopover
            ref={popoverRef}
            prId={prId}
            top={pos.top}
            left={pos.left}
          />,
          document.body,
        )}
    </>
  );
}

const FindingsPopover = React.forwardRef<
  HTMLDivElement,
  { prId: string; top: number; left: number }
>(function FindingsPopover({ prId, top, left }, ref) {
  const { data: reviews, isLoading } = usePrReviews(prId);
  const allFindings = React.useMemo(() => (reviews ?? []).flatMap((r) => r.findings), [reviews]);
  const total = allFindings.length;

  return (
    <div
      ref={ref}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        top,
        left,
        zIndex: 9999,
        width: 380,
        maxHeight: 420,
        overflowY: "auto",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-strong)",
        borderRadius: 10,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      <div style={{
        padding: "10px 14px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.07em",
        color: "var(--text-muted)",
        textTransform: "uppercase",
      }}>
        <Icon.AlertOctagon size={13} />
        {isLoading ? "Loading…" : `${total} finding${total === 1 ? "" : "s"}`}
      </div>

      {isLoading ? (
        <div style={{ padding: "16px 14px", color: "var(--text-muted)", fontSize: 13 }}>Loading findings…</div>
      ) : allFindings.length === 0 ? (
        <div style={{ padding: "16px 14px", color: "var(--text-muted)", fontSize: 13 }}>No findings.</div>
      ) : (
        allFindings.map((f) => {
          const sev = f.severity as Severity;
          const { c } = SEV[sev] ?? { c: "var(--text-muted)" };
          const IconComp = SEV[sev]
            ? (Icon[SEV[sev].icon as keyof typeof Icon] as React.FC<{ size: number; style?: React.CSSProperties }>)
            : null;
          return (
            <div
              key={f.id}
              style={{
                padding: "10px 14px",
                borderBottom: "1px solid var(--border)",
                borderLeft: `3px solid ${c}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                {IconComp && <IconComp size={13} style={{ color: c, flexShrink: 0 }} />}
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {f.title}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>{f.category}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--accent-text)", fontFamily: "monospace", marginBottom: 3 }}>
                {f.file}{f.start_line ? `:${f.start_line}` : ""}
                <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>
                  ● {Math.round((f.confidence ?? 0) * 100)}% conf
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {f.rationale}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
});
