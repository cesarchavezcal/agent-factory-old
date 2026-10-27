import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

export const DEFAULT_CONFIG = {
  project: {
    name: "agent-factory",
    githubAccount: "cesarchavezcal",
    repository: "cesarchavezcal/agent-factory",
    stack: "node",
    defaultVerifyCmd: "npm test",
    baseBranch: "main"
  },
  invariants: {
    strictZeroCost: true,
    disallowClaude: true,
    requireGitHubAccount: "cesarchavezcal",
    forbidEnvKeys: [
      "GEMINI_API_KEY",
      "XAI_API_KEY",
      "CURSOR_API_KEY",
      "ANTHROPIC_API_KEY",
      "OPENAI_API_KEY"
    ]
  },
  intake: {
    sources: ["linear", "github", "slack"],
    syncMode: "auto",
    maxConcurrentThreads: 2,
    leaseMinutes: 15,
    idlePollSeconds: 60
  },
  delivery: {
    autoMerge: false,
    mergeMethod: "squash",
    deleteBranchOnMerge: true,
    requireChecksPass: true
  },
  models: {
    scout: {
      pool: "AGY_FAST",
      providerInstanceId: "antigravity",
      model: "gemini-3.8-flash-high",
      fallback: "gemini-3.8-flash-medium",
      mechanism: "invoke_subagent",
      subagentModel: "flash"
    },
    planner: {
      pool: "AGY_PRO",
      providerInstanceId: "antigravity",
      model: "gemini-4-argon-high",
      fallback: "gemini-3.8-flash-high",
      mechanism: "lead_thread"
    },
    builderStandard: {
      pool: "CURSOR_WORK",
      providerInstanceId: "cursor",
      model: "composer-2.5",
      options: { fastMode: true },
      fallbackProvider: "grok",
      fallbackModel: "grok-4.7-build-fast",
      mechanism: "delegate_task",
      role: "implementation"
    },
    builderComplex: {
      pool: "GROK_WORK",
      providerInstanceId: "grok",
      model: "grok-4.7-build-fast",
      retryModel: "grok-4.7",
      options: { reasoningEffort: "medium" },
      retryOptions: { reasoningEffort: "high" },
      mechanism: "delegate_task",
      role: "implementation"
    },
    verifier: {
      pool: "AGY_FAST",
      providerInstanceId: "antigravity",
      model: "gemini-3.8-flash-high",
      fallback: "gemini-3.8-flash-low",
      mechanism: "invoke_subagent",
      subagentModel: "flash"
    },
    interrogator: {
      pool: "GROK_AUDIT",
      providerInstanceId: "grok",
      model: "grok-4.7",
      fallback: "grok-4.6",
      options: { reasoningEffort: "high" },
      mechanism: "delegate_task",
      role: "review"
    }
  },
  gates: {
    requireRuntimeVerify: true,
    requireAdversarialInterrogate: true,
    maxRetries: 2,
    maxContextBriefBytes: 2048
  }
};

export function isClaudeModel(modelIdentifier) {
  if (!modelIdentifier || typeof modelIdentifier !== "string") return false;
  const lower = modelIdentifier.toLowerCase();
  return lower.includes("claude") || lower.includes("anthropic");
}

export function loadFactoryConfig(rootDir = process.cwd()) {
  const configPath = resolve(rootDir, "factory.config.json");
  if (!existsSync(configPath)) {
    return structuredClone(DEFAULT_CONFIG);
  }
  const raw = JSON.parse(readFileSync(configPath, "utf8"));
  return validateFactoryConfig(raw);
}

export function validateFactoryConfig(config, env = process.env) {
  if (!config || typeof config !== "object") {
    throw new Error("Invalid factory.config.json: root must be an object.");
  }

  // Validate required blocks
  if (!config.project || typeof config.project !== "object") {
    throw new Error("Invalid factory.config.json: missing required 'project' block.");
  }

  // 1. Enforce GitHub account invariant (cesarchavezcal)
  const requiredAccount = config.invariants?.requireGitHubAccount || "cesarchavezcal";
  if (config.project?.githubAccount !== requiredAccount) {
    throw new Error(
      `GitHub Account Invariant Failed: project.githubAccount must be "${requiredAccount}" (found "${config.project?.githubAccount}").`
    );
  }

  // 2. Enforce 100% Claude-free model roster
  if (config.invariants?.disallowClaude !== false) {
    const serializedModels = JSON.stringify(config.models || {}).toLowerCase();
    if (serializedModels.includes("claude") || serializedModels.includes("anthropic")) {
      throw new Error(
        "Claude-Free Invariant Failed: Claude/Anthropic models are strictly forbidden in factory.config.json. Use Gemini, Cursor Composer, and Grok only."
      );
    }
  }

  // 3. Enforce Zero Paid API Keys invariant
  if (config.invariants?.strictZeroCost !== false) {
    const forbidden = config.invariants?.forbidEnvKeys || DEFAULT_CONFIG.invariants.forbidEnvKeys;
    for (const key of forbidden) {
      if (env[key] && String(env[key]).trim().length > 0) {
        throw new Error(
          `Zero-Cost Invariant Failed: Paid API key "${key}" detected in environment. All execution must use personal T3 Code accounts.`
        );
      }
    }
  }

  return config;
}
