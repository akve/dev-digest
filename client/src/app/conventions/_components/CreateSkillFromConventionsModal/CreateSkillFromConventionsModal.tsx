"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  useConventions,
  useCreateSkillFromConventions,
} from "@/lib/hooks/conventions";

interface Props {
  repoId: string;
  repoName: string;
  acceptedCount: number;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateSkillFromConventionsModal({
  repoId,
  repoName,
  acceptedCount,
  onClose,
  onCreated,
}: Props) {
  const t = useTranslations("conventions");
  const router = useRouter();
  const { data: conventions = [] } = useConventions(repoId);
  const createSkill = useCreateSkillFromConventions();
  const [name, setName] = React.useState("repo-conventions");
  const [description, setDescription] = React.useState(
    `${acceptedCount} house conventions extracted from ${repoName}`,
  );
  const [enabled, setEnabled] = React.useState(true);
  const [agentId, setAgentId] = React.useState("");
  const [body, setBody] = React.useState("");
  const [bodyTouched, setBodyTouched] = React.useState(false);

  const accepted = React.useMemo(
    () => conventions.filter((c) => c.accepted),
    [conventions],
  );

  React.useEffect(() => {
    if (bodyTouched) return;
    const sections = accepted.map((c) => {
      const lineSpan =
        c.evidence_line_start == null
          ? ""
          : c.evidence_line_end && c.evidence_line_end !== c.evidence_line_start
            ? `:${c.evidence_line_start}-${c.evidence_line_end}`
            : `:${c.evidence_line_start}`;
      return [
        `## [${c.category}] ${c.rule}`,
        "",
        `Detected in \`${c.evidence_path}${lineSpan}\`:`,
        "```",
        c.evidence_snippet || "// no snippet",
        "```",
      ].join("\n");
    });
    const generated = [
      `# ${name}`,
      "",
      `House conventions for \`${repoName}\`. Flag changes that violate any rule below and cite the offending \`file:line\`.`,
      "",
      ...sections,
    ].join("\n\n");
    setBody(generated);
  }, [accepted, bodyTouched, name, repoName]);

  const tokenCount = Math.ceil(body.length / 4);

  const handleCreate = async () => {
    const skill = await createSkill.mutateAsync({
      repoId,
      name,
      description,
      body,
      enabled,
      agent_id: agentId.trim() || undefined,
    });
    onCreated();
    router.push(`/skills/${skill.id}`);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 28,
          width: 480,
          maxWidth: "90vw",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
          {t("modal.title")}
        </h2>

        {/* Info banner */}
        <div
          style={{
            background: "color-mix(in srgb, var(--accent) 10%, transparent)",
            border:
              "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 13,
            color: "var(--text-secondary)",
          }}
        >
          ✦{" "}
          {t("modal.subtitle", {
            count: acceptedCount,
            repo: repoName,
          })}
        </div>

        {/* Name */}
        <div>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              display: "block",
              marginBottom: 6,
            }}
          >
            {t("modal.nameLabel")} *
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid var(--border)",
              borderRadius: 7,
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Description */}
        <div>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              display: "block",
              marginBottom: 6,
            }}
          >
            {t("modal.descriptionLabel")}
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid var(--border)",
              borderRadius: 7,
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                display: "block",
                marginBottom: 6,
              }}
            >
              {t("modal.typeLabel")}
            </label>
            <input
              value="convention"
              readOnly
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid var(--border)",
                borderRadius: 7,
                background: "var(--bg-elevated)",
                color: "var(--text-muted)",
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />
          </div>
          <label
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              marginTop: 22,
              fontSize: 13,
              color: "var(--text-secondary)",
            }}
          >
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            {t("modal.enabledLabel")}
          </label>
        </div>

        <div>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              display: "block",
              marginBottom: 6,
            }}
          >
            {t("modal.agentIdLabel")}
          </label>
          <input
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            placeholder={t("modal.agentIdHint")}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid var(--border)",
              borderRadius: 7,
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              display: "block",
              marginBottom: 6,
            }}
          >
            {t("modal.bodyLabel")} *
          </label>
          <textarea
            value={body}
            onChange={(e) => {
              setBodyTouched(true);
              setBody(e.target.value);
            }}
            rows={12}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid var(--border)",
              borderRadius: 7,
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              fontSize: 13,
              lineHeight: 1.45,
              boxSizing: "border-box",
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            }}
          />
          <div
            style={{
              marginTop: 6,
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              color: "var(--text-muted)",
            }}
          >
            <span>{t("modal.unsaved")}</span>
            <span>{t("modal.tokens", { count: tokenCount })}</span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 8,
          }}
        >
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            ← {t("modal.savedHint")}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                padding: "8px 16px",
                borderRadius: 7,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-secondary)",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {t("modal.cancel")}
            </button>
            <button
              onClick={handleCreate}
              disabled={!name.trim() || !body.trim() || createSkill.isPending}
              style={{
                padding: "8px 16px",
                borderRadius: 7,
                border: "none",
                background: "var(--accent)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor:
                  !name.trim() || !body.trim() || createSkill.isPending
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  !name.trim() || !body.trim() || createSkill.isPending
                    ? 0.6
                    : 1,
              }}
            >
              {createSkill.isPending
                ? t("modal.creating")
                : `✦ ${t("modal.create")}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
