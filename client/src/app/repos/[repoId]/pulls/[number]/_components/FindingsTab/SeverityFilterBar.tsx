"use client";

import React from "react";
import { Icon, SEV } from "@devdigest/ui";
import type { FindingRecord } from "@devdigest/shared";
import type { Severity } from "@devdigest/ui";

const ORDER: Severity[] = ["CRITICAL", "WARNING", "SUGGESTION", "INFO"];

interface SeverityFilterBarProps {
  findings: FindingRecord[];
  active: Severity | null;
  onChange: (s: Severity | null) => void;
}

export function SeverityFilterBar({ findings, active, onChange }: SeverityFilterBarProps) {
  const counts = React.useMemo(() => {
    const map: Partial<Record<Severity, number>> = {};
    for (const f of findings) {
      const sev = f.severity as Severity;
      map[sev] = (map[sev] ?? 0) + 1;
    }
    return map;
  }, [findings]);

  const present = ORDER.filter((s) => (counts[s] ?? 0) > 0);
  if (present.length === 0) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
      {present.map((sev, i) => {
        const { c, bg, icon, label } = SEV[sev];
        const isActive = active === sev;
        const IconComp = Icon[icon as keyof typeof Icon] as React.FC<{ size: number; style?: React.CSSProperties }>;
        return (
          <React.Fragment key={sev}>
            {i > 0 && (
              <span style={{ color: "var(--text-muted)", fontSize: 12, userSelect: "none" }}>·</span>
            )}
            <button
              onClick={() => onChange(isActive ? null : sev)}
              aria-pressed={isActive}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 10px 3px 7px",
                borderRadius: 20,
                border: `1px solid ${isActive ? c : "var(--border)"}`,
                background: isActive ? bg : "transparent",
                color: isActive ? c : "var(--text-muted)",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.03em",
                transition: "background 0.12s, color 0.12s, border-color 0.12s",
              }}
            >
              {IconComp && <IconComp size={13} style={{ color: isActive ? c : "var(--text-muted)" }} />}
              {counts[sev]} {label.toUpperCase()}
            </button>
          </React.Fragment>
        );
      })}
      {active && (
        <button
          onClick={() => onChange(null)}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: 11,
            padding: "2px 4px",
          }}
          title="Clear filter"
        >
          Clear
        </button>
      )}
    </div>
  );
}
