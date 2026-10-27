#!/usr/bin/env node
import { createInterface } from "node:readline";
import {
  readState,
  saveScoutBrief,
  askOnSourceTicket,
  lockSpecAndPublishDag,
  recordVerifyReceipt,
  recordInterrogateReceipt,
  writeState
} from "../src/engine/state.mjs";
import { selectModelForStep } from "../src/engine/router.mjs";
import { loadFactoryConfig } from "../src/engine/config.mjs";

const TOOLS = [
  {
    name: "orch_status",
    description:
      "Returns current factory phase, active model & quota pool (Gemini/Cursor/Grok), next unblocked ticket, and exact T3 Code delegation instructions.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "orch_save_scout_brief",
    description:
      "Called by Gemini 3.8 Flash in Phase 0 to save a compressed (<2KB) ContextBrief before Gemini 4 Argon plans the spec.",
    inputSchema: {
      type: "object",
      required: ["briefMarkdown"],
      properties: { briefMarkdown: { type: "string" } }
    }
  },
  {
    name: "orch_ask_ticket",
    description:
      "Called by Gemini 4 Argon when a Linear/GitHub ticket is unclear. Posts the question back to the ticket and pauses the thread.",
    inputSchema: {
      type: "object",
      required: ["question"],
      properties: { question: { type: "string" } }
    }
  },
  {
    name: "orch_lock_spec_and_dag",
    description:
      "Called by Gemini 4 Argon after to-spec and to-tickets finish; registers the tracer-bullet DAG and tags so router.mjs assigns Composer 2.5 or Grok 4.7.",
    inputSchema: {
      type: "object",
      required: ["feature", "specPath", "tickets"],
      properties: {
        feature: { type: "string" },
        playbook: { type: "string", enum: ["feature", "bugfix", "refactor"] },
        specPath: { type: "string" },
        tickets: { type: "array", items: { type: "object" } }
      }
    }
  },
  {
    name: "orch_claim_ticket",
    description: "Marks an unblocked DAG ticket as coding on Cursor Composer 2.5 or Grok 4.7 Build-Fast.",
    inputSchema: {
      type: "object",
      required: ["ticketId"],
      properties: { ticketId: { type: "string" } }
    }
  },
  {
    name: "orch_verify_ticket",
    description:
      "Records the Phase 4a runtime verification receipt executed by Gemini 3.8 Flash.",
    inputSchema: {
      type: "object",
      required: ["ticketId", "exitCode", "stdout"],
      properties: {
        ticketId: { type: "string" },
        exitCode: { type: "number" },
        stdout: { type: "string" },
        stderr: { type: "string" }
      }
    }
  },
  {
    name: "orch_interrogate_ticket",
    description:
      "Records the Phase 4b adversarial interrogation verdict ('PASS' | 'FAIL') executed by Grok 4.7.",
    inputSchema: {
      type: "object",
      required: ["ticketId", "verdict", "summary"],
      properties: {
        ticketId: { type: "string" },
        verdict: { type: "string", enum: ["PASS", "FAIL"] },
        summary: { type: "string" },
        objections: { type: "array", items: { type: "string" } }
      }
    }
  }
];

export function handleMcpCall(toolName, args = {}, rootDir = process.cwd()) {
  const config = loadFactoryConfig(rootDir);

  switch (toolName) {
    case "orch_status": {
      const state = readState(rootDir);
      const nextTicket = state.tickets.find((t) => t.status === "ready" || t.status === "rework") || null;
      const nextRoute = nextTicket
        ? selectModelForStep("implement", nextTicket, { cursorEnabled: true }, config)
        : selectModelForStep(
            state.activePhase === "scout" ? "scout" : "spec_and_dag",
            {},
            { cursorEnabled: true },
            config
          );
      return {
        githubAccount: config.project.githubAccount,
        activePhase: state.activePhase,
        activePool: state.activePool,
        nextTicket,
        nextRoute,
        state
      };
    }

    case "orch_save_scout_brief":
      return saveScoutBrief(args.briefMarkdown, rootDir);

    case "orch_ask_ticket":
      return askOnSourceTicket(args.question, rootDir);

    case "orch_lock_spec_and_dag":
      return lockSpecAndPublishDag(args, rootDir);

    case "orch_claim_ticket": {
      const state = readState(rootDir);
      const ticket = state.tickets.find((t) => t.id === args.ticketId);
      if (!ticket) throw new Error(`Ticket "${args.ticketId}" not found.`);
      if (ticket.status !== "ready" && ticket.status !== "rework") {
        throw new Error(`Ticket "${args.ticketId}" cannot be claimed from status "${ticket.status}".`);
      }
      ticket.status = "coding";
      state.activePhase = "execution";
      state.activePool = ticket.assignedPool;
      return writeState(
        state,
        {
          type: "TICKET_CLAIMED",
          ticketId: ticket.id,
          model: ticket.assignedModel,
          pool: ticket.assignedPool
        },
        rootDir
      );
    }

    case "orch_verify_ticket":
      return recordVerifyReceipt(args.ticketId, args, rootDir);

    case "orch_interrogate_ticket":
      return recordInterrogateReceipt(args.ticketId, args, rootDir);

    default:
      throw new Error(`Unknown MCP tool: ${toolName}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rl = createInterface({ input: process.stdin, terminal: false });
  rl.on("line", (line) => {
    if (!line.trim()) return;
    let req;
    try {
      req = JSON.parse(line);
      if (req.method === "initialize") {
        process.stdout.write(
          JSON.stringify({
            jsonrpc: "2.0",
            id: req.id,
            result: {
              protocolVersion: "2024-11-05",
              capabilities: { tools: {} },
              serverInfo: { name: "agent-factory-mcp", version: "1.0.0" }
            }
          }) + "\n"
        );
      } else if (req.method === "tools/list") {
        process.stdout.write(
          JSON.stringify({ jsonrpc: "2.0", id: req.id, result: { tools: TOOLS } }) + "\n"
        );
      } else if (req.method === "tools/call") {
        const result = handleMcpCall(req.params.name, req.params.arguments || {});
        process.stdout.write(
          JSON.stringify({
            jsonrpc: "2.0",
            id: req.id,
            result: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
          }) + "\n"
        );
      }
    } catch (err) {
      if (req?.id !== undefined) {
        process.stdout.write(
          JSON.stringify({
            jsonrpc: "2.0",
            id: req.id,
            error: { code: -32000, message: err.message }
          }) + "\n"
        );
      }
    }
  });
}
