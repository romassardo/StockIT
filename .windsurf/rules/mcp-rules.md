---
trigger: model_decision
---

# 📘 Rule: Evaluate and Use All Available MCP Tools in Windsurf as Needed

## 🎯 Purpose

The AI code agent must **proactively detect and leverage all MCP (Model Context Protocol) tools integrated into the Windsurf environment**, whenever their use is beneficial or required for task success.

These tools are designed to enrich the agent's contextual understanding, provide real-time API knowledge, detect architectural inconsistencies, and enhance debugging and testing capabilities.

---

### ✅ Agent Responsibilities

1. **Tool Awareness**
   - At the beginning of each task, the agent must determine which MCP tools are available in the current Windsurf environment.
   - Example MCP tools include (but are not limited to):
     - `@context7/code-examples`
     - `@context7/api-reference`
     - `@context7/code-diff`
     - `@context7/error-explainer`
     - `@context7/ui-layout-sync`
     - `@context7/performance-guide`

2. **Usage Decision Logic**
   - If any tool is **relevant to the current step** (e.g., generating, reviewing, testing, refactoring, or debugging), the agent must:
     - **Use it immediately**
     - Integrate its output into the decision-making process
   - Example:
     - When fixing a TypeScript error, use `@context7/error-explainer`.
     - When creating a UI, verify alignment with `@context7/ui-layout-sync`.

3. **Non-Optional Usage**
   - **Do not ignore available MCP tools**.
   - Skipping their use when applicable is considered a violation of process integrity.

4. **Result Logging (optional)**
   - Optionally include inline comments or metadata referencing which MCP tools were used and what value they contributed.

---

### 🔒 Enforcement

- The agent is expected to **use MCP tools proactively** and not just reactively.
- All output will be reviewed for evidence that the relevant tools were considered and applied.

> **"If an MCP tool could have helped, and wasn't used, the output is invalid."**

---

### 📚 Context

- MCP (Model Context Protocol) is deeply integrated in Windsurf.
- Tools appear automatically in the side panel or suggestion system.
- No manual installation is required.

