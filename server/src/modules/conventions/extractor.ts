import { readFile, realpath } from "fs/promises";
import { isAbsolute, relative, resolve, sep } from "path";
import { z } from "zod";
import type { LLMProvider } from "@devdigest/shared";

// Zod schema for model output.
const ExtractionSchema = z.object({
  candidates: z.array(
    z.object({
      category: z.string().min(1),
      rule: z.string(),
      evidence: z.object({
        file: z.string().min(1),
        line_start: z.number().int().positive(),
        line_end: z.number().int().positive().optional(),
        snippet: z.string().min(1),
      }),
      confidence: z.number().min(0).max(1),
    }),
  ),
});

async function resolveSafeRepoPath(
  clonePath: string,
  candidatePath: string,
): Promise<{ fullPath: string; relativePath: string } | null> {
  const trimmed = candidatePath.trim();
  if (!trimmed) return null;
  if (trimmed.includes("\0")) return null;
  if (trimmed.startsWith("\\\\")) return null;
  if (isAbsolute(trimmed)) return null;
  if (/^[A-Za-z]:[\\/]/.test(trimmed)) return null;

  const baseDir = resolve(clonePath);
  const fullPath = resolve(baseDir, trimmed);
  const lexicalRel = relative(baseDir, fullPath);
  if (!lexicalRel || lexicalRel === ".." || lexicalRel.startsWith(`..${sep}`)) {
    return null;
  }

  // Resolve symlinks and enforce containment again on canonical paths.
  const realBase = await realpath(baseDir).catch(() => null);
  const realTarget = await realpath(fullPath).catch(() => null);
  if (!realBase || !realTarget) return null;
  const realRel = relative(realBase, realTarget);
  if (!realRel || realRel === ".." || realRel.startsWith(`..${sep}`)) {
    return null;
  }

  return { fullPath: realTarget, relativePath: realRel.split("\\").join("/") };
}

/** Read file from clone. Returns null when missing. Trims for prompt budget. */
async function readSample(
  clonePath: string,
  relativePath: string,
): Promise<string | null> {
  try {
    const resolved = await resolveSafeRepoPath(clonePath, relativePath);
    if (!resolved) return null;
    const content = await readFile(resolved.fullPath, "utf-8");
    return content.slice(0, 2_000);
  } catch {
    return null;
  }
}

/**
 * Evidence verification after the model call:
 * - file exists;
 * - referenced lines exist;
 * - snippet text matches the referenced lines.
 */
async function verifyEvidence(
  clonePath: string,
  evidence: {
    file: string;
    lineStart: number;
    lineEnd: number;
    snippet: string;
  },
): Promise<{ path: string; lineStart: number; lineEnd: number } | null> {
  try {
    const resolved = await resolveSafeRepoPath(clonePath, evidence.file);
    if (!resolved) return null;
    const content = await readFile(resolved.fullPath, "utf-8");
    const lines = content.split(/\r?\n/);
    const lineStart = evidence.lineStart;
    const lineEnd = Math.max(lineStart, evidence.lineEnd);

    if (lineStart < 1 || lineStart > lines.length) return null;
    if (lineEnd < 1 || lineEnd > lines.length) return null;

    const rangeText = lines.slice(lineStart - 1, lineEnd).join("\n");
    const normalizedSnippet = evidence.snippet.trim();
    if (!normalizedSnippet) return null;

    // Exact range match first; then first meaningful snippet line fallback.
    if (rangeText.includes(normalizedSnippet)) {
      return { path: resolved.relativePath, lineStart, lineEnd };
    }
    const firstSnippetLine =
      normalizedSnippet
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find(Boolean) ?? "";
    if (!firstSnippetLine || !rangeText.includes(firstSnippetLine)) return null;

    return { path: resolved.relativePath, lineStart, lineEnd };
  } catch {
    return null;
  }
}

export interface ExtractedCandidate {
  category: string;
  rule: string;
  evidencePath: string;
  evidenceLineStart: number;
  evidenceLineEnd: number;
  evidenceSnippet: string;
  confidence: number;
}

/**
 * Основна функція екстракції:
 * 1. Читає конфіги (eslint, tsconfig, prettier) — без LLM
 * 2. Читає топ-12 файлів репо
 * 3. Викликає gpt-4.1-mini для аналізу
 * 4. Верифікує докази кодом
 * 5. Повертає тільки валідні кандидати
 */
export async function extractConventions(opts: {
  clonePath: string;
  samplePaths: string[];
  repoName: string;
  llm: LLMProvider;
  /** Model id understood by the injected provider (e.g. 'openai/gpt-4.1-mini' on OpenRouter). */
  model: string;
}): Promise<ExtractedCandidate[]> {
  const { clonePath, samplePaths, repoName, llm, model } = opts;

  const configFiles = [
    ".eslintrc.js",
    ".eslintrc.json",
    ".eslintrc",
    ".eslintrc.cjs",
    "tsconfig.json",
    "tsconfig.base.json",
    ".prettierrc",
    ".prettierrc.json",
    ".prettierrc.js",
    "biome.json",
    ".editorconfig",
  ];

  const configContents: string[] = [];
  for (const cfg of configFiles) {
    const content = await readSample(clonePath, cfg);
    if (content) {
      configContents.push(`--- ${cfg} ---\n${content}`);
    }
  }

  const sampleContents: string[] = [];
  for (const path of samplePaths.slice(0, 12)) {
    const content = await readSample(clonePath, path);
    if (content) {
      sampleContents.push(`--- ${path} ---\n${content}`);
    }
  }

  const allSamples = [...configContents, ...sampleContents].join("\n\n");

  if (allSamples.trim().length === 0) {
    return [];
  }

  const result = await llm.completeStructured({
    model,
    schema: ExtractionSchema,
    schemaName: "ConventionsExtraction",
    messages: [
      {
        role: "system",
        content: `You are a code-convention analyst. Analyze the provided code samples and extract concrete coding conventions that are consistently followed in this repository.

Return ONLY conventions that:
1. Have clear evidence in the provided files
2. Can be formulated as a specific, actionable rule (start with "Always...", "Never...", "Use X instead of Y...")
3. Appear in at least 2 places or are configured explicitly
4. Would be useful for a code reviewer to enforce
5. Include precise evidence path and line numbers

Do NOT include:
- Generic best practices obvious to any TypeScript developer
- Things with only 1 example unless it's in a config file
- Framework defaults`,
      },
      {
        role: "user",
        content: `Repository: ${repoName}

Analyze these files and extract coding conventions:

${allSamples}

Return JSON with a "candidates" array. Each candidate:
- category: one of ["architecture","typescript","style","testing","api","security","general"]
- rule: specific actionable rule in imperative form
- evidence: {
    file: relative file path where the convention was found,
    line_start: first line number (1-based),
    line_end: last line number (optional),
    snippet: exact code snippet (2-5 lines) demonstrating the rule
  }
- confidence: 0.0–1.0

Only include conventions with confidence > 0.6.`,
      },
    ],
    temperature: 0.2,
    maxTokens: 2048,
  });

  const verified: ExtractedCandidate[] = [];
  for (const c of result.data.candidates) {
    const verifiedEvidence = await verifyEvidence(clonePath, {
      file: c.evidence.file,
      lineStart: c.evidence.line_start,
      lineEnd: c.evidence.line_end ?? c.evidence.line_start,
      snippet: c.evidence.snippet,
    });
    if (!verifiedEvidence) continue;
    verified.push({
      category: c.category,
      rule: c.rule,
      evidencePath: verifiedEvidence.path,
      evidenceLineStart: verifiedEvidence.lineStart,
      evidenceLineEnd: verifiedEvidence.lineEnd,
      evidenceSnippet: c.evidence.snippet,
      confidence: c.confidence,
    });
  }

  return verified;
}
