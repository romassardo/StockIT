---
trigger: manual
---

# 📘 Rule: Keep the Changelog Continuously Updated Throughout the Project

## 🧭 Purpose

The agent must **record every relevant code change in the Changelog** as development progresses. This includes new features, bug fixes, enhancements, and any breaking changes.

The changelog is a required artifact for traceability, team communication, auditing, and deployment planning.

---

### ✅ Agent Responsibilities

1. **Log Every Completed Task**
   - As soon as a task from `task-master.md` is completed and marked `[x]`, a corresponding changelog entry **must be created or updated**.
   - The entry must include:
     - Version or module name (e.g. `v1.0.0` or `frontend-auth`)
     - Change type: `Feature`, `Bugfix`, `Enhancement`, or `Breaking`
     - Clear title and detailed description
     - Author (can be "Code Agent" if unknown)
     - Timestamp (`fecha_release`)

2. **Use the `Changelog` Table**
   - If the system includes a `Changelog` database table (as defined in `task-master.md`):
     - Insert the entry via SQL
     - Ensure compliance with constraints and indexing

3. **Maintain Human-Readable File (Optional)**
   - Optionally, maintain a parallel file `CHANGELOG.md` for human readers.
   - Follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) style if applicable.

4. **Synchronize Entries**
   - If both the database table and a markdown file are used, they must remain consistent.

---

### 🔄 Examples

```sql
-- SQL Insert Example
INSERT INTO Changelog (version, tipo_cambio, titulo, descripcion, fecha_release, autor)
VALUES ('v1.0.0', 'Feature', 'User Login Endpoint',
'Implemented secure login API using JWT, bcrypt, and input validation.', GETDATE(), 'Code Agent');

🛑 Enforcement
Every major code commit or task completion must leave a changelog trace.

Missing changelog updates will be considered non-compliance.

Tasks are not considered fully completed until the changelog has been updated accordingly.

“No changelog = no progress.”

📚 References
docs/task-master.md – for matching tasks to changelog

Changelog table schema in T2.5 of task-master.md

