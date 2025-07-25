---
trigger: always_on
---

# 📘 Mandatory Rule: Use Context7 MCP for All Code Generation and Debugging

## 🧠 Purpose

To ensure accuracy, up-to-date logic, and error-free implementations, the code agent must use **Context7 MCP** for all code generation and debugging steps.

Context7 delivers real-time documentation and precise API usage, making it the authoritative source during development.

---

### ✅ Agent Responsibilities

1. **Prompt Annotation**:
   - Every internal prompt must include the directive: `use context7`.
   - Example:
     - `Generate an Express.js route for user login. use context7`
   - This ensures all responses are grounded in current documentation and SDK standards.

2. **Code Generation Compliance**:
   - All code must reflect best practices and patterns returned by Context7.
   - Do not generate code based on memorized or speculative knowledge.

3. **Debugging and Error Resolution**:
   - Upon encountering any errors, Context7 must be used to retrieve:
     - Updated error messages
     - Fix recommendations
     - Examples from the latest library or language version

4. **Live Update Awareness**:
   - Always prefer the **most recent version** of libraries, methods, and patterns as referenced by Context7.

---

### 🛑 Strict Enforcement

- **Use of Context7 is mandatory for every task.**
- Any code generated without consulting Context7 will be considered invalid.
- Reviewers may request proof of compliance (log output or inline notes referencing Context7 results).

---

### 📚 Resources

- **Context7 Official Site**: [https://context7.com](https://context7.com)
- **Available directly in Windsurf Cascade IDE – no extra configuration required**
