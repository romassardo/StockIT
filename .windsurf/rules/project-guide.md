---
trigger: always_on
---

# 📘 Mandatory Project Rule for Code Agent

## 🔧 Technical and Functional Blueprint Compliance

All backend and frontend code written for this project **must strictly comply with the detailed specifications outlined in:**

`E:\Proyectos\StockIT\proyecto-inventario-it.md`

---

### 📌 Scope of Enforcement:
- Business logic
- Component behavior
- Inventory flows (serial-based vs stock-based)
- Assignment and repair rules
- Database schema and stored procedures
- Role-based permissions and validations
- API architecture
- Frontend–backend synchronization
- Data integrity and logging standards

---

### ✅ Agent Responsibilities:

1. **Read and internalize** the business rules and technical architecture defined in `proyecto-inventario-it.md` before generating code.
2. Every flow implemented must **follow the separation between “Individual Inventory” (Notebooks/Cellphones)** and **“General Stock” (everything else)** exactly as documented.
3. No logic should be invented or assumed. If unsure, **replicate the logic and flow exactly as documented**.
4. Use stored procedures where indicated. **Do not bypass them** for critical operations like assignments, repairs, or stock movements.
5. Ensure validations, state transitions, and restrictions **match the business rules section (see section 6 of the document)**.
6. Respect all role-based access restrictions and soft-delete logic.

---

### 🔒 Mandatory Business Constraints to Follow:
- **Only notebooks and cellphones** have:
  - Serial numbers
  - Assignment history
  - Repair tracking
- **All other items** are managed by quantity only (no serials)
- No item with state `"Assigned"` or `"In Repair"` can be deleted or reassigned
- Password fields are required on assignment for notebooks and Gmail info for cellphones
- Stock withdrawals cannot exceed available quantity
- Logs must be created for all critical operations

---

### 🧪 Validation Criteria:
- Code must reflect the correct category-based logic separation
- Any process flow must mirror the sequences defined in section 7 (Workflows)
- If the code violates any business rule, it should be flagged as non-compliant

---

### 🛑 This rule is mandatory. Deviation from the documented specification will be considered a critical error in the generated code.
