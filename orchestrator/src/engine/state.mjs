import {
  readFileSync,
  writeFileSync,
  renameSync,
  appendFileSync,
  mkdirSync,
  existsSync
} from "node:fs";
import { resolve, dirname } from "node:path";
import { loadFactoryConfig } from "./config.mjs";
import { selectModelForStep } from "./router.mjs";
import { syncEventToNeon } from "./neon-sync.mjs";

export const INITIAL_STATE = {
  version: "1.0.0",
  githubAccount: "cesarchavezcal",
  sourceTicket: null,
  activeFeature: null,
  playbook: null,
  activePool: "AGY_FAST",
  activePhase: "scout",
  contextBriefPath: ".orchestrator/context-brief.md",
  phases: {
    scout: { status: "idle", provider: "antigravity", model: "gemini-3.8-flash-high", artifact: null },
    discovery: { status: "idle", provider: "antigravity", model: "gemini-4-argon-high", artifact: null },
    planning: { status: "idle", provider: "antigravity", model: "gemini-4-argon-high", artifact: null },
    execution: { status: "idle", provider: "cursor + grok", model: "composer-2.5 / grok-4.7-build-fast", artifact: null },
    verification: { status: "idle", provider: "antigravity + grok", model: "gemini-3.8-flash-high + grok-4.7", artifact: null },
    delivery: { status: "idle", provider: "antigravity", model: "gemini-3.8-flash-high", artifact: null }
  },
  tickets: [],
  handoff: null
};

export function getOrchestratorPaths(rootDir = process.cwd()) {
  const orchDir = resolve(rootDir, ".orchestrator");
  return {
    orchDir,
    statePath: resolve(orchDir, "state.json"),
    eventsPath: resolve(orchDir, "events.jsonl"),
    briefPath: resolve(orchDir, "context-brief.md")
  };
}

export function ensureOrchestratorDir(rootDir = process.cwd()) {
  const paths = getOrchestratorPaths(rootDir);
  if (!existsSync(paths.orchDir)) {
    mkdirSync(paths.orchDir, { recursive: true });
  }
  if (!existsSync(paths.statePath)) {
    const config = loadFactoryConfig(rootDir);
    const seed = structuredClone(INITIAL_STATE);
    seed.githubAccount = config.project.githubAccount;
    atomicWriteJson(paths.statePath, seed);
  }
  return paths;
}

export function atomicWriteJson(targetPath, data) {
  mkdirSync(dirname(targetPath), { recursive: true });
  const tmpPath = `${targetPath}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmpPath, JSON.stringify(data, null, 2) + "\n", "utf8");
  renameSync(tmpPath, targetPath);
}

export function readState(rootDir = process.cwd()) {
  const paths = ensureOrchestratorDir(rootDir);
  return JSON.parse(readFileSync(paths.statePath, "utf8"));
}

export function writeState(state, event = null, rootDir = process.cwd()) {
  const paths = ensureOrchestratorDir(rootDir);
  atomicWriteJson(paths.statePath, state);
  if (event) {
    const record = {
      timestamp: new Date().toISOString(),
      githubAccount: state.githubAccount || "cesarchavezcal",
      ...event
    };
    appendFileSync(paths.eventsPath, JSON.stringify(record) + "\n", "utf8");
    syncEventToNeon(record).catch(() => {});
  }
  return state;
}

export function saveScoutBrief(briefMarkdown, rootDir = process.cwd()) {
  const config = loadFactoryConfig(rootDir);
  const maxBytes = config.gates?.maxContextBriefBytes || 2048;
  const byteLength = Buffer.byteLength(briefMarkdown, "utf8");
  if (byteLength > maxBytes) {
    throw new Error(
      `ContextBrief Exceeds Quota Budget: ${byteLength} bytes > max ${maxBytes} bytes. Compress the Flash brief before passing to Gemini 4 Argon.`
    );
  }
  const paths = ensureOrchestratorDir(rootDir);
  writeFileSync(paths.briefPath, briefMarkdown, "utf8");
  const state = readState(rootDir);
  state.phases.scout.status = "done";
  state.phases.scout.artifact = ".orchestrator/context-brief.md";
  state.activePhase = "discovery";
  state.activePool = "AGY_PRO";
  return writeState(
    state,
    {
      type: "SCOUT_BRIEF_SAVED",
      phase: "scout",
      model: "gemini-3.8-flash-high",
      bytes: byteLength
    },
    rootDir
  );
}

export function askOnSourceTicket(question, rootDir = process.cwd()) {
  const state = readState(rootDir);
  if (state.sourceTicket) {
    state.sourceTicket.status = "waiting_for_human";
    state.sourceTicket.pendingQuestion = question;
  }
  state.phases.discovery.status = "waiting_for_human";
  state.handoff = {
    action: "ask_on_ticket",
    question,
    message: `Unclear requirement: Posted question to ${state.sourceTicket?.id || "ticket"} and paused lease.`
  };
  return writeState(
    state,
    {
      type: "TICKET_CLARIFICATION_REQUESTED",
      phase: "discovery",
      model: "gemini-4-argon-high",
      question
    },
    rootDir
  );
}

export function lockSpecAndPublishDag({ feature, playbook, specPath, tickets }, rootDir = process.cwd()) {
  const config = loadFactoryConfig(rootDir);
  const state = readState(rootDir);
  state.activeFeature = feature;
  state.playbook = playbook || "feature";
  state.phases.discovery.status = "done";
  state.phases.discovery.artifact = specPath;
  state.phases.planning.status = "done";
  state.phases.planning.artifact = `${tickets.length} tracer-bullet tickets`;
  state.activePhase = "execution";

  state.tickets = tickets.map((t) => {
    const route = selectModelForStep("implement", t, { cursorEnabled: true }, config);
    return {
      id: t.id,
      title: t.title,
      dependsOn: t.dependsOn || [],
      files: t.files || [],
      tags: t.tags || [],
      verifyCmd: t.verifyCmd || config.project.defaultVerifyCmd,
      status: (t.dependsOn || []).length === 0 ? "ready" : "blocked",
      assignedPool: route.pool,
      assignedProvider: route.providerInstanceId,
      assignedModel: route.model,
      routingReason: route.reason,
      retryCount: 0,
      maxRetries: config.gates.maxRetries ?? 2,
      reworkReason: null,
      verifyReceipt: null,
      interrogateReceipt: null
    };
  });

  return writeState(
    state,
    {
      type: "SPEC_AND_DAG_LOCKED",
      phase: "planning",
      model: "gemini-4-argon-high",
      specPath,
      ticketCount: state.tickets.length
    },
    rootDir
  );
}

export function recordVerifyReceipt(ticketId, { exitCode, stdout, stderr = "" }, rootDir = process.cwd()) {
  const state = readState(rootDir);
  const ticket = state.tickets.find((t) => t.id === ticketId);
  if (!ticket) throw new Error(`Ticket "${ticketId}" not found.`);

  ticket.verifyReceipt = {
    executedBy: "gemini-3.8-flash-high",
    provider: "antigravity",
    exitCode: Number(exitCode),
    stdout: String(stdout || "").slice(0, 4000),
    stderr: String(stderr || "").slice(0, 4000),
    timestamp: new Date().toISOString()
  };

  if (ticket.verifyReceipt.exitCode === 0) {
    ticket.status = "interrogating";
    state.activePhase = "verification";
    state.activePool = "GROK_AUDIT";
  } else {
    return triggerTicketRework(
      ticketId,
      `Phase 4a Flash Verification Failed (exitCode ${exitCode}): ${stderr || stdout}`,
      rootDir,
      state
    );
  }

  return writeState(
    state,
    {
      type: "TICKET_VERIFIED",
      ticketId,
      model: "gemini-3.8-flash-high",
      exitCode: ticket.verifyReceipt.exitCode
    },
    rootDir
  );
}

export function recordInterrogateReceipt(ticketId, { verdict, summary, objections = [] }, rootDir = process.cwd()) {
  const state = readState(rootDir);
  const ticket = state.tickets.find((t) => t.id === ticketId);
  if (!ticket) throw new Error(`Ticket "${ticketId}" not found.`);

  const normalizedVerdict = String(verdict).toUpperCase();
  ticket.interrogateReceipt = {
    executedBy: "grok-4.7",
    provider: "grok",
    verdict: normalizedVerdict,
    summary,
    objections,
    timestamp: new Date().toISOString()
  };

  if (normalizedVerdict !== "PASS") {
    return triggerTicketRework(
      ticketId,
      `Phase 4b Grok 4.7 Interrogation Failed: ${summary} (${objections.join("; ")})`,
      rootDir,
      state
    );
  }

  return completeTicket(ticketId, rootDir, state);
}

export function triggerTicketRework(ticketId, reason, rootDir = process.cwd(), existingState = null) {
  const config = loadFactoryConfig(rootDir);
  const state = existingState || readState(rootDir);
  const ticket = state.tickets.find((t) => t.id === ticketId);
  if (!ticket) throw new Error(`Ticket "${ticketId}" not found.`);

  ticket.retryCount = (ticket.retryCount || 0) + 1;
  ticket.reworkReason = reason;

  if (ticket.retryCount > (ticket.maxRetries ?? 2)) {
    ticket.status = "failed_gate";
    return writeState(
      state,
      {
        type: "TICKET_HALTED_MAX_RETRIES",
        ticketId,
        retryCount: ticket.retryCount,
        reason
      },
      rootDir
    );
  }

  ticket.status = "rework";
  const escalatedRoute = selectModelForStep("implement", ticket, { cursorEnabled: true }, config);
  ticket.assignedPool = escalatedRoute.pool;
  ticket.assignedProvider = escalatedRoute.providerInstanceId;
  ticket.assignedModel = escalatedRoute.model;
  ticket.routingReason = escalatedRoute.reason;
  state.activePhase = "execution";
  state.activePool = escalatedRoute.pool;

  return writeState(
    state,
    {
      type: "TICKET_REWORK_TRIGGERED",
      ticketId,
      retryCount: ticket.retryCount,
      escalatedTo: escalatedRoute.model,
      reason
    },
    rootDir
  );
}

export function completeTicket(ticketId, rootDir = process.cwd(), existingState = null) {
  const state = existingState || readState(rootDir);
  const ticket = state.tickets.find((t) => t.id === ticketId);
  if (!ticket) throw new Error(`Ticket "${ticketId}" not found.`);

  // Hard PStack Gate 1: Gemini 3.8 Flash Runtime Verification
  if (!ticket.verifyReceipt || ticket.verifyReceipt.exitCode !== 0) {
    throw new Error(
      `Gate Failed: Ticket ${ticketId} lacks a passing Gemini 3.8 Flash verification receipt.`
    );
  }

  // Hard PStack Gate 2: Grok 4.7 Adversarial Interrogation
  if (!ticket.interrogateReceipt || ticket.interrogateReceipt.verdict !== "PASS") {
    throw new Error(
      `Gate Failed: Ticket ${ticketId} lacks a passing Grok 4.7 interrogation receipt.`
    );
  }

  ticket.status = "done";

  // Unlock downstream dependent DAG tickets
  for (const candidate of state.tickets) {
    if (candidate.status === "blocked") {
      const allDepsDone = (candidate.dependsOn || []).every((depId) => {
        const dep = state.tickets.find((d) => d.id === depId);
        return dep && dep.status === "done";
      });
      if (allDepsDone) {
        candidate.status = "ready";
      }
    }
  }

  const allDone = state.tickets.length > 0 && state.tickets.every((t) => t.status === "done");
  if (allDone) {
    state.phases.execution.status = "done";
    state.phases.verification.status = "done";
    state.activePhase = "delivery";
    state.activePool = "AGY_FAST";
  }

  return writeState(
    state,
    {
      type: "TICKET_COMPLETED",
      ticketId,
      allTicketsDone: allDone
    },
    rootDir
  );
}
