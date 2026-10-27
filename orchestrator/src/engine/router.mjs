import { loadFactoryConfig } from "./config.mjs";

const COMPLEX_TAGS = new Set([
  "db",
  "database",
  "sql",
  "concurrency",
  "security",
  "algorithm",
  "state-machine",
  "architecture"
]);

/**
 * Deterministic, quota-aware model router for T3 Code.
 * Routes Planning & Verification to Gemini (Antigravity) and
 * Heavy Implementation & Adversarial Review to Cursor (Composer 2.5) + Grok (4.7).
 */
export function selectModelForStep(
  step,
  ticket = {},
  capabilities = { cursorEnabled: true, argonQuotaLow: false },
  config = null
) {
  const cfg = config || loadFactoryConfig();
  const models = cfg.models;

  switch (step) {
    case "scout": {
      const m = models.scout;
      return {
        step: "scout",
        pool: m.pool,
        providerInstanceId: m.providerInstanceId,
        model: m.model,
        mechanism: m.mechanism,
        subagentModel: m.subagentModel || "flash",
        reason: "Phase 0 Flash Context Scout compresses repo files (<2KB) to protect Argon & Grok quotas."
      };
    }

    case "spec_and_dag": {
      const m = models.planner;
      const isTrivial = ticket.playbook === "bugfix" && (ticket.files?.length || 0) <= 2;
      const chosenModel = capabilities.argonQuotaLow || isTrivial ? m.fallback : m.model;
      return {
        step: "spec_and_dag",
        pool: m.pool,
        providerInstanceId: m.providerInstanceId,
        model: chosenModel,
        mechanism: m.mechanism,
        reason: isTrivial
          ? "Trivial <=2 file bugfix routed to Flash to preserve Argon 5h quota."
          : "Lead Planner (Gemini 4 Argon) locks spec.md and dependency DAG from Flash ContextBrief."
      };
    }

    case "implement": {
      const tags = Array.isArray(ticket.tags) ? ticket.tags : [];
      const needsDeepLogic = tags.some((t) => COMPLEX_TAGS.has(String(t).toLowerCase()));
      const retryCount = Number(ticket.retryCount || 0);

      if (needsDeepLogic || !capabilities.cursorEnabled || retryCount > 0) {
        const m = models.builderComplex;
        const chosenModel = retryCount > 0 ? m.retryModel || "grok-4.7" : m.model;
        const chosenOptions = retryCount > 0 ? m.retryOptions || { reasoningEffort: "high" } : m.options;
        return {
          step: "implement",
          pool: m.pool,
          providerInstanceId: m.providerInstanceId,
          model: chosenModel,
          options: chosenOptions,
          mechanism: m.mechanism,
          role: m.role || "implementation",
          reason: retryCount > 0
            ? `Rework attempt #${retryCount}: escalated to ${chosenModel} (high reasoning).`
            : !capabilities.cursorEnabled
              ? `Cursor provider disabled in T3: routed to ${chosenModel}.`
              : `Complex tags [${tags.join(", ")}] routed to ${chosenModel}.`
        };
      }

      const m = models.builderStandard;
      return {
        step: "implement",
        pool: m.pool,
        providerInstanceId: m.providerInstanceId,
        model: m.model,
        options: m.options || { fastMode: true },
        mechanism: m.mechanism,
        role: m.role || "implementation",
        reason: "Standard implementation routed to Cursor Composer 2.5 to offload ~45% coding token burn."
      };
    }

    case "verify_runtime": {
      const m = models.verifier;
      return {
        step: "verify_runtime",
        pool: m.pool,
        providerInstanceId: m.providerInstanceId,
        model: m.model,
        mechanism: m.mechanism,
        subagentModel: m.subagentModel || "flash",
        reason: "Phase 4a runtime verification & log digestion routed to Gemini 3.8 Flash."
      };
    }

    case "interrogate": {
      const m = models.interrogator;
      return {
        step: "interrogate",
        pool: m.pool,
        providerInstanceId: m.providerInstanceId,
        model: m.model,
        options: m.options || { reasoningEffort: "high" },
        mechanism: m.mechanism,
        role: m.role || "review",
        reason: "Phase 4b cross-model adversarial review routed to Grok 4.7 (independent of Gemini & Composer)."
      };
    }

    default:
      throw new Error(`Unknown factory step: "${step}"`);
  }
}
