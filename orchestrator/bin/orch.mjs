#!/usr/bin/env node
import { createServer } from "node:http";
import { existsSync, mkdirSync, writeFileSync, readFileSync, watch } from "node:fs";
import { resolve } from "node:path";
import { loadFactoryConfig, validateFactoryConfig } from "../src/engine/config.mjs";
import { selectModelForStep } from "../src/engine/router.mjs";
import {
  ensureOrchestratorDir,
  readState,
  writeState,
  saveScoutBrief,
  lockSpecAndPublishDag,
  recordVerifyReceipt,
  recordInterrogateReceipt,
  getOrchestratorPaths,
  INITIAL_STATE
} from "../src/engine/state.mjs";

export function runInit(rootDir = process.cwd()) {
  const config = loadFactoryConfig(rootDir);
  const paths = ensureOrchestratorDir(rootDir);

  // Ensure .cursor/mcp.json uses repo-relative path (zero hardcoded /Users/... paths)
  const cursorDir = resolve(rootDir, ".cursor");
  mkdirSync(cursorDir, { recursive: true });
  const mcpPath = resolve(cursorDir, "mcp.json");
  writeFileSync(
    mcpPath,
    JSON.stringify(
      {
        mcpServers: {
          "agent-factory": {
            command: "node",
            args: ["./orchestrator/bin/orch-mcp.mjs"]
          }
        }
      },
      null,
      2
    ) + "\n",
    "utf8"
  );

  return {
    initialized: true,
    githubAccount: config.project.githubAccount,
    statePath: paths.statePath,
    mcpPath
  };
}

export function runDoctor(rootDir = process.cwd(), env = process.env) {
  const config = validateFactoryConfig(loadFactoryConfig(rootDir), env);
  const paths = ensureOrchestratorDir(rootDir);
  const mcpPath = resolve(rootDir, ".cursor/mcp.json");

  const checks = [
    {
      id: "github_account",
      ok: config.project.githubAccount === "cesarchavezcal",
      detail: `GitHub account locked to "${config.project.githubAccount}"`
    },
    {
      id: "claude_free",
      ok: !JSON.stringify(config.models).toLowerCase().includes("claude"),
      detail: "100% Claude-free model roster verified (Gemini + Cursor Composer + Grok only)"
    },
    {
      id: "zero_api_keys",
      ok: config.invariants.forbidEnvKeys.every((k) => !env[k]),
      detail: "Zero paid API keys in environment"
    },
    {
      id: "relative_mcp_config",
      ok: existsSync(mcpPath) && !readFileSync(mcpPath, "utf8").includes("/Users/"),
      detail: ".cursor/mcp.json uses portable repo-relative paths"
    },
    {
      id: "state_initialized",
      ok: existsSync(paths.statePath),
      detail: ".orchestrator/state.json is ready"
    }
  ];

  const allOk = checks.every((c) => c.ok);
  return { ok: allOk, githubAccount: config.project.githubAccount, checks };
}

export async function runSimulationDemo(rootDir = process.cwd(), delayMs = 20) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const config = loadFactoryConfig(rootDir);
  const seed = structuredClone(INITIAL_STATE);
  seed.githubAccount = config.project.githubAccount;
  seed.sourceTicket = {
    provider: "linear",
    id: "LIN-204",
    title: "Add Neon Webhook Inbox & T3 Thread Dispatcher",
    url: "https://linear.app/issue/LIN-204",
    status: "claimed"
  };
  writeState(seed, { type: "TICKET_CLAIMED_FROM_NEON", ticketId: "LIN-204" }, rootDir);
  await sleep(delayMs);

  // Phase 0: Flash Context Scout
  saveScoutBrief(
    "# ContextBrief (LIN-204)\n- `orchestrator/src/engine/neon-sync.mjs`: webhook_inbox schema\n- `orchestrator/src/engine/router.mjs`: selectModelForStep()",
    rootDir
  );
  await sleep(delayMs);

  // Phase 1 & 2: Gemini 4 Argon Spec & DAG
  lockSpecAndPublishDag(
    {
      feature: "Neon Webhook Inbox & T3 Thread Dispatcher",
      playbook: "feature",
      specPath: "docs/specs/lin-204-neon-inbox.md",
      tickets: [
        {
          id: "T-1",
          title: "Create Neon webhook_inbox schema & lease query",
          dependsOn: [],
          files: ["orchestrator/src/engine/neon-sync.mjs"],
          tags: ["db", "sql"],
          verifyCmd: "npm test"
        },
        {
          id: "T-2",
          title: "Wire Live Board UI components for 3-Pool Quota Bar",
          dependsOn: ["T-1"],
          files: ["orchestrator/src/ui/App.tsx"],
          tags: ["ui", "react"],
          verifyCmd: "npm test"
        }
      ]
    },
    rootDir
  );
  await sleep(delayMs);

  // Ticket T-1 (routed to Grok 4.7 Build-Fast due to ["db", "sql"] tags)
  recordVerifyReceipt("T-1", { exitCode: 0, stdout: "PASS: neon-sync schema & lease tests (2/2)" }, rootDir);
  await sleep(delayMs);
  recordInterrogateReceipt(
    "T-1",
    { verdict: "PASS", summary: "Grok 4.7 verified minimal diff and scale-to-zero backoff." },
    rootDir
  );
  await sleep(delayMs);

  // Ticket T-2 (routed to Cursor Composer 2.5 due to ["ui", "react"] tags)
  recordVerifyReceipt("T-2", { exitCode: 0, stdout: "PASS: UI quota bar render test (1/1)" }, rootDir);
  await sleep(delayMs);
  recordInterrogateReceipt(
    "T-2",
    { verdict: "PASS", summary: "Grok 4.7 verified React Flow node badges and zero scope creep." },
    rootDir
  );

  // Delivery: GitHub PR under cesarchavezcal
  const finalState = readState(rootDir);
  finalState.phases.delivery.status = "done";
  finalState.phases.delivery.artifact = `https://github.com/${config.project.githubAccount}/${config.project.name}/pull/1`;
  writeState(
    finalState,
    {
      type: "GITHUB_PR_OPENED",
      githubAccount: config.project.githubAccount,
      prUrl: finalState.phases.delivery.artifact
    },
    rootDir
  );

  return finalState;
}

function startUiServer(rootDir = process.cwd(), port = Number(process.env.ORCH_UI_PORT || 4321)) {
  const paths = ensureOrchestratorDir(rootDir);
  const clients = new Set();

  watch(paths.orchDir, () => {
    try {
      const payload = JSON.stringify(readState(rootDir));
      for (const res of clients) {
        res.write(`data: ${payload}\n\n`);
      }
    } catch {}
  });

  const server = createServer((req, res) => {
    if (req.url === "/api/state") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(readState(rootDir)));
      return;
    }
    if (req.url === "/api/events") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive"
      });
      res.write(`data: ${JSON.stringify(readState(rootDir))}\n\n`);
      clients.add(res);
      req.on("close", () => clients.delete(res));
      return;
    }
    const htmlPath = resolve(rootDir, "orchestrator/src/ui/index.html");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(existsSync(htmlPath) ? readFileSync(htmlPath, "utf8") : "<h1>Mission Control</h1>");
  });

  server.listen(port, () => {
    console.log(`Mission Control Live UI running at http://localhost:${port}`);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [cmd, arg1] = process.argv.slice(2);
  if (cmd === "init") {
    console.log(JSON.stringify(runInit(), null, 2));
  } else if (cmd === "doctor") {
    const res = runDoctor();
    console.log(JSON.stringify(res, null, 2));
    process.exit(res.ok ? 0 : 1);
  } else if (cmd === "route") {
    console.log(JSON.stringify(selectModelForStep(arg1 || "scout"), null, 2));
  } else if (cmd === "demo") {
    runSimulationDemo().then((s) => console.log("Demo completed. Active phase:", s.activePhase));
  } else if (cmd === "ui") {
    startUiServer();
  } else {
    console.log("Usage: orch <init|doctor|route|demo|ui>");
  }
}
