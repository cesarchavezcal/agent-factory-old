import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { loadFactoryConfig, validateFactoryConfig } from "../src/engine/config.mjs";
import { selectModelForStep } from "../src/engine/router.mjs";
import {
  saveScoutBrief,
  lockSpecAndPublishDag,
  recordVerifyReceipt,
  recordInterrogateReceipt,
  completeTicket,
  readState
} from "../src/engine/state.mjs";
import { computeAdaptivePollMs } from "../src/engine/neon-sync.mjs";
import { runInit, runDoctor, runSimulationDemo } from "../bin/orch.mjs";

function createTempWorkspace() {
  const dir = mkdtempSync(join(tmpdir(), "agent-factory-test-"));
  const rootCfg = loadFactoryConfig(process.cwd());
  writeFileSync(join(dir, "factory.config.json"), JSON.stringify(rootCfg, null, 2), "utf8");
  runInit(dir);
  return dir;
}

describe("Agent Factory Template (`cesarchavezcal`) — Invariants, Router & PStack Gates", () => {
  test("1. Enforces cesarchavezcal GitHub account, 100% Claude-free roster, and zero paid API keys", () => {
    const cfg = loadFactoryConfig(process.cwd());
    assert.equal(cfg.project.githubAccount, "cesarchavezcal");
    assert.equal(cfg.invariants.requireGitHubAccount, "cesarchavezcal");

    // Rejects wrong GitHub account
    const badAccount = structuredClone(cfg);
    badAccount.project.githubAccount = "someone-else";
    assert.throws(() => validateFactoryConfig(badAccount, {}), /GitHub Account Invariant Failed/);

    // Rejects any Claude model in config
    const badClaude = structuredClone(cfg);
    badClaude.models.planner.model = "claude-sonnet-4";
    assert.throws(() => validateFactoryConfig(badClaude, {}), /Claude-Free Invariant Failed/);

    // Rejects paid API keys in environment
    assert.throws(
      () => validateFactoryConfig(cfg, { ANTHROPIC_API_KEY: "sk-ant-123" }),
      /Zero-Cost Invariant Failed/
    );
  });

  test("2. Quota-aware router splits Gemini (Scout/Spec/Verify) vs Cursor Composer & Grok (Work/Audit)", () => {
    const scout = selectModelForStep("scout");
    assert.equal(scout.providerInstanceId, "antigravity");
    assert.equal(scout.model, "gemini-3.8-flash-high");

    const spec = selectModelForStep("spec_and_dag", { playbook: "feature", files: ["a.ts", "b.ts", "c.ts"] });
    assert.equal(spec.providerInstanceId, "antigravity");
    assert.equal(spec.model, "gemini-4-argon-high");

    // Standard UI/CRUD ticket -> Cursor Composer 2.5
    const uiWork = selectModelForStep("implement", { tags: ["ui", "react"], retryCount: 0 }, { cursorEnabled: true });
    assert.equal(uiWork.providerInstanceId, "cursor");
    assert.equal(uiWork.model, "composer-2.5");

    // Complex DB/SQL ticket -> Grok 4.7 Build-Fast
    const dbWork = selectModelForStep("implement", { tags: ["db", "sql"], retryCount: 0 }, { cursorEnabled: true });
    assert.equal(dbWork.providerInstanceId, "grok");
    assert.equal(dbWork.model, "grok-4.7-build-fast");

    // Rework retry -> escalates to full grok-4.7 with high reasoningEffort
    const rework = selectModelForStep("implement", { tags: ["ui"], retryCount: 1 }, { cursorEnabled: true });
    assert.equal(rework.providerInstanceId, "grok");
    assert.equal(rework.model, "grok-4.7");
    assert.equal(rework.options.reasoningEffort, "high");

    // Interrogation -> Grok 4.7 High
    const audit = selectModelForStep("interrogate");
    assert.equal(audit.providerInstanceId, "grok");
    assert.equal(audit.model, "grok-4.7");
  });

  test("3. Enforces <2KB Flash ContextBrief quota shield and hard dual PStack gate with rework loop", () => {
    const ws = createTempWorkspace();
    try {
      // Rejects oversized brief (>2048 bytes)
      assert.throws(() => saveScoutBrief("x".repeat(2500), ws), /ContextBrief Exceeds Quota Budget/);

      saveScoutBrief("# Compact Brief\n- router.mjs", ws);
      lockSpecAndPublishDag(
        {
          feature: "Test Gate",
          playbook: "feature",
          specPath: "docs/specs/test.md",
          tickets: [
            { id: "T-1", title: "Core DB", dependsOn: [], tags: ["db"], files: ["db.mjs"] },
            { id: "T-2", title: "UI Panel", dependsOn: ["T-1"], tags: ["ui"], files: ["ui.tsx"] }
          ]
        },
        ws
      );

      // Cannot complete T-1 without receipts
      assert.throws(() => completeTicket("T-1", ws), /lacks a passing Gemini 3.8 Flash verification receipt/);

      // Failed Grok interrogation triggers rework and escalates model to grok-4.7
      recordVerifyReceipt("T-1", { exitCode: 0, stdout: "ok" }, ws);
      recordInterrogateReceipt("T-1", { verdict: "FAIL", summary: "Missing edge case", objections: ["Add null check"] }, ws);

      let state = readState(ws);
      const t1AfterFail = state.tickets.find((t) => t.id === "T-1");
      assert.equal(t1AfterFail.status, "rework");
      assert.equal(t1AfterFail.retryCount, 1);
      assert.equal(t1AfterFail.assignedModel, "grok-4.7");

      // Passing both Flash + Grok completes T-1 and unlocks dependent T-2
      recordVerifyReceipt("T-1", { exitCode: 0, stdout: "ok v2" }, ws);
      recordInterrogateReceipt("T-1", { verdict: "PASS", summary: "Clean minimal diff" }, ws);

      state = readState(ws);
      assert.equal(state.tickets.find((t) => t.id === "T-1").status, "done");
      assert.equal(state.tickets.find((t) => t.id === "T-2").status, "ready");
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  });

  test("4. Runs doctor preflight, Neon scale-to-zero backoff, and full end-to-end simulation demo", async () => {
    const ws = createTempWorkspace();
    try {
      const doc = runDoctor(ws, {});
      assert.equal(doc.ok, true);
      assert.equal(doc.githubAccount, "cesarchavezcal");

      assert.ok(computeAdaptivePollMs(3, 60) > 60000);

      const finalState = await runSimulationDemo(ws, 1);
      assert.equal(finalState.githubAccount, "cesarchavezcal");
      assert.equal(finalState.phases.delivery.status, "done");
      assert.match(finalState.phases.delivery.artifact, /github\.com\/cesarchavezcal\//);
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  });

  test("5. Verifies complete Matt Pocock (including wayfinder & grill-with-docs) and PStack skill catalogs", () => {
    const skillsDir = join(process.cwd(), ".agents/skills");
    const mattSkills = [
      "wayfinder",
      "ask-matt",
      "grill-me",
      "grill-with-docs",
      "to-spec",
      "to-tickets",
      "code-review",
      "handoff"
    ];
    const pstackSkills = [
      "poteto-mode",
      "how",
      "why",
      "tdd",
      "show-me-your-work",
      "interrogate",
      "unslop",
      "no-comments",
      "blast-radius",
      "architect",
      "arena",
      "swarm",
      "figure-it-out",
      "verify-and-interrogate"
    ];

    for (const s of [...mattSkills, ...pstackSkills]) {
      const skillPath = join(skillsDir, s, "SKILL.md");
      assert.ok(existsSync(skillPath), `Missing required skill: ${s}/SKILL.md`);
    }
  });
});
