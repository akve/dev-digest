import { describe, expect, it } from "vitest";
import { mkdtemp, mkdir, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { LLMProvider, ModelInfo, StructuredRequest } from "@devdigest/shared";
import { extractConventions } from "../src/modules/conventions/extractor.js";

function mockLlm(candidates: unknown[]): LLMProvider {
  return {
    id: "openai",
    async listModels(): Promise<ModelInfo[]> {
      return [];
    },
    async complete() {
      return { text: "", model: "mock", tokensIn: 0, tokensOut: 0, costUsd: 0 };
    },
    async completeStructured<T>(req: StructuredRequest<T>) {
      return {
        data: req.schema.parse({ candidates }) as T,
        model: "mock",
        tokensIn: 0,
        tokensOut: 0,
        costUsd: 0,
        raw: JSON.stringify({ candidates }),
        attempts: 1,
      };
    },
    async embed() {
      return [];
    },
  };
}

describe("extractConventions path safety", () => {
  it("rejects evidence paths that escape clone root", async () => {
    const clonePath = await mkdtemp(join(tmpdir(), "dd-conv-"));
    await mkdir(join(clonePath, "src"), { recursive: true });
    await writeFile(join(clonePath, "src", "safe.ts"), "const safe = true;\n", "utf-8");

    const llm = mockLlm([
      {
        category: "security",
        rule: "Always do X",
        evidence: {
          file: "../outside.ts",
          line_start: 1,
          line_end: 1,
          snippet: "const safe = true;",
        },
        confidence: 0.9,
      },
    ]);

    const result = await extractConventions({
      clonePath,
      samplePaths: ["src/safe.ts"],
      repoName: "repo",
      llm,
      model: "mock",
    });

    expect(result).toEqual([]);
  });

  it("keeps valid in-repo evidence paths", async () => {
    const clonePath = await mkdtemp(join(tmpdir(), "dd-conv-"));
    await mkdir(join(clonePath, "src"), { recursive: true });
    await writeFile(join(clonePath, "src", "safe.ts"), "const safe = true;\n", "utf-8");

    const llm = mockLlm([
      {
        category: "style",
        rule: "Prefer const",
        evidence: {
          file: "src/safe.ts",
          line_start: 1,
          line_end: 1,
          snippet: "const safe = true;",
        },
        confidence: 0.9,
      },
    ]);

    const result = await extractConventions({
      clonePath,
      samplePaths: ["src/safe.ts"],
      repoName: "repo",
      llm,
      model: "mock",
    });

    expect(result).toHaveLength(1);
    expect(result[0]!.evidencePath).toBe("src/safe.ts");
  });

  it("rejects evidence with standalone dot path segments", async () => {
    const clonePath = await mkdtemp(join(tmpdir(), "dd-conv-"));
    await mkdir(join(clonePath, "src"), { recursive: true });
    await writeFile(join(clonePath, "src", "safe.ts"), "const safe = true;\n", "utf-8");

    const llm = mockLlm([
      {
        category: "security",
        rule: "No dot segments",
        evidence: {
          file: "./src/safe.ts",
          line_start: 1,
          line_end: 1,
          snippet: "const safe = true;",
        },
        confidence: 0.9,
      },
    ]);

    const result = await extractConventions({
      clonePath,
      samplePaths: ["src/safe.ts"],
      repoName: "repo",
      llm,
      model: "mock",
    });

    expect(result).toEqual([]);
  });

  it("rejects symlink-based escape paths", async () => {
    const clonePath = await mkdtemp(join(tmpdir(), "dd-conv-"));
    const outsideDir = await mkdtemp(join(tmpdir(), "dd-outside-"));
    await mkdir(join(clonePath, "src"), { recursive: true });
    await writeFile(join(clonePath, "src", "safe.ts"), "const safe = true;\n", "utf-8");
    await writeFile(join(outsideDir, "secret.ts"), "const secret = 1;\n", "utf-8");

    // Symlink inside repo that points outside.
    await symlink(outsideDir, join(clonePath, "escape"));

    const llm = mockLlm([
      {
        category: "security",
        rule: "Do not allow traversal",
        evidence: {
          file: "escape/secret.ts",
          line_start: 1,
          line_end: 1,
          snippet: "const secret = 1;",
        },
        confidence: 0.95,
      },
    ]);

    const result = await extractConventions({
      clonePath,
      samplePaths: ["src/safe.ts"],
      repoName: "repo",
      llm,
      model: "mock",
    });

    expect(result).toEqual([]);
  });

  it("skips in-repo symlinked files from extraction", async () => {
    const clonePath = await mkdtemp(join(tmpdir(), "dd-conv-"));
    await mkdir(join(clonePath, "src"), { recursive: true });
    await writeFile(join(clonePath, "src", "safe.ts"), "const safe = true;\n", "utf-8");
    await symlink(join(clonePath, "src", "safe.ts"), join(clonePath, "src", "safe-link.ts"));

    const llm = mockLlm([
      {
        category: "style",
        rule: "No symlink evidence",
        evidence: {
          file: "src/safe-link.ts",
          line_start: 1,
          line_end: 1,
          snippet: "const safe = true;",
        },
        confidence: 0.95,
      },
    ]);

    const result = await extractConventions({
      clonePath,
      samplePaths: ["src/safe.ts"],
      repoName: "repo",
      llm,
      model: "mock",
    });

    expect(result).toEqual([]);
  });
});
