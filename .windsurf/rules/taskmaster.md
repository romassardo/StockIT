---
trigger: always_on
---

# 📋 Mandatory Execution Rule: Follow `task-master.md` as Project Roadmap

## 🎯 Rule Overview
All project work must be executed **step-by-step, in the exact order defined** in the official task plan:

> `docs/task-master.md`

This file is the **single source of truth** for project execution, task dependencies, and completion logic.

---

### ✅ Agent Responsibilities

1. **Strict Sequential Execution**
   - Tasks must be implemented **in the exact order listed** in the file.
   - A task **must not be started** until all its declared dependencies have been completed.

2. **Live Editing**
   - The agent must **update the file** `task-master.md` in real time:
     - Mark `[ ]` tasks as `[x]` once completed.
     - Fill in optional fields (e.g. timestamps, test results, comments) as progress is made.

3. **DoD Compliance**
   - Every task must meet its **"Definition of Done"** (DoD) checklist before being marked complete.
   - The code must match the structure, validations, and templates included in the task description.

4. **No Skipping, No Reordering**
   - It is **strictly prohibited** to skip steps or jump ahead in the plan.
   - Even seemingly "minor" tasks (e.g. setting up linters or docs) must be completed on schedule.

5. **Validation and Logging**
   - The agent must run the validation commands defined per task.
   - Test results, console logs, and errors (if any) should be added as inline code blocks in the `task-master.md` task sections.

---

### 🧪 Evaluation Criteria

- ✔️ All checkboxes in each task are manually or programmatically completed
- ✔️ Command outputs are included where required (linting, builds, DB tests)
- ✔️ No task is marked complete without passing all quantitative checks
- ✔️ Final code structure exactly matches the post-task expectations

---

### 🔒 This is a **non-optional** rule.

> The agent must **treat `task-master.md` as the executable contract of the project.**  
> Non-compliance or deviation will be interpreted as a critical failure.
