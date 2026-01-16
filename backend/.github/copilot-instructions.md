# Instructions for AI Assistants (GitHub Copilot, Claude, etc.)

> **This file contains critical rules and patterns that must be followed when making changes to this codebase.**

# DATABASE PATTERNS & CRITICAL RULES
## 🚨 Critical Rules

### 1. `ultima_revisao` Column Pattern

**ALWAYS set `ultima_revisao = NULL` (NOT `false`) when marking old records as superseded.**

❌ **WRONG:**
```sql
UPDATE variavel_global_ciclo_analise
SET ultima_revisao = false  -- WRONG! Will cause conflicts
WHERE ...;
```

✅ **CORRECT:**
```sql
UPDATE variavel_global_ciclo_analise
SET ultima_revisao = NULL  -- Correct! Allows multiple historical records
WHERE ...;
```

**Why?** Because `NULL != NULL` in SQL, allowing multiple historical records, while `false = false` would create unique constraint violations.

### 2. Before INSERT with `ultima_revisao = true`

Always update existing records first:

```sql
-- Step 1: Mark existing records as historical
UPDATE table_name
SET ultima_revisao = NULL
WHERE key_columns = values
  AND ultima_revisao = true;

-- Step 2: Insert new current record
INSERT INTO table_name (..., ultima_revisao, ...)
VALUES (..., true, ...);
```

## 📚 Affected Tables

- Any table with revision tracking using `ultima_revisao` column
- If in doubt, check schema.prisma for indexes/constraints on `ultima_revisao`

## 🔍 When Working on This Project

1. **Always check** DATABASE_PATTERNS.md for patterns specific to this codebase
2. **Never assume** standard patterns - this project has specific requirements
3. **Test carefully** - many stored procedures have complex state management
4. **Respect timezone** - Use `'America/Sao_Paulo'` for all timezone conversions

## 📁 Project Structure Notes

- SQL migrations are in `prisma/migrations/`
- Manual SQL functions are in `prisma/manual-copy/`
- TypeScript source is in `src/`
- Prisma schema is `prisma/schema.prisma`
