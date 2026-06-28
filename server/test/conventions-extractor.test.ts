import { describe, expect, it } from "vitest";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
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
});
