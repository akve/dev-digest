"use client";

import React from "react";
import { Icon, SEV } from "@devdigest/ui";
import type { Severity } from "@devdigest/ui";
import type { FindingRecord } from "@devdigest/shared";

const SEV_ORDER: Severity[] = ["CRITICAL", "WARNING", "SUGGESTION"];

interface RunFindingsBadgesProps {
  findings: FindingRecord[];
  blockers: number;
}

export function RunFindingsBadges({ findings, blockers }: RunFindingsBadgesProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const counts = React.useMemo(() => {
    const m: Partial<Record<Severity, number>> = {};
    for (const f of findings) {
      const s = f.severity as Severity;
      m[s] = (m[s] ?? 0) + 1;
    }
    return m;
  }, [findings]);

  const present = SEV_ORDER.filter((s) => (counts[s] ?? 0) > 0);
  if (present.length === 0 && findings.length === 0) return null;

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 8 }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center", gap: 8 }}
      >
        {present.map((sev) => {
          const { c, icon } = SEV[sev];
          const IconComp = Icon[icon as keyof typeof Icon] as React.FC<{ size: number; style?: React.CSSProperties }>;
          return (
            <span key={sev} style={{ display: "inline-flex", alignItems: "center", gap: 3, color: c, fontSize: 12, fontWeight: 600 }}>
              {IconComp && <IconComp size={13} style={{ color: c }} />}
              {counts[sev]}
            </span>
          );
        })}
        {blockers > 0 && (
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>· {blockers} blocker{blockers === 1 ? "" : "s"}</span>
        )}
      </button>

      {open && findings.length > 0 && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            zIndex: 200,
            width: 380,
            maxHeight: 400,
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
            {findings.length} finding{findings.length === 1 ? "" : "s"} in this run
          </div>

          {findings.map((f) => {
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
          })}
        </div>
      )}
    </div>
  );
}
