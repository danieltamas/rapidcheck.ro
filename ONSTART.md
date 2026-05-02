# ONSTART — Agent Operating Manual

Execute the START GATE before doing any work.

---

## Worktree Policy

1. **Orchestrator stays on `main`.** Never switches branches.
2. **Code Workers run in worktrees under `.claude/worktrees/`.** Always `isolation: "worktree"`. The Claude Code harness manages this path automatically — do not relocate. Heads-up: subagent setup pre-installs `web-ext` (Firefox dev tooling) which transitively pulls `node-forge` containing a legacy `SocketPool.swf` file. Some antivirus products false-positive on it. Whitelist `**/node_modules/node-forge/flash/**` if your AV is noisy.
3. **Process docs live on `main` only.** `CLAUDE.md`, `ONSTART.md`, `CODING.md`, `TESTING.md`, `SECURITY.md`, `SPEC.md`, `SITES_COVERAGE.md`, `docs/` — committed directly to `main`.
4. **Multiple workers may run in parallel only if they touch different packages.** Two workers in `packages/core/` will collide silently. Sequence them.

---

## START GATE

### Step 0: Branch Hygiene

```bash
git status
git branch --show-current
git worktree list
```

- Uncommitted changes → STOP. Ask: commit, stash, or discard?
- Behind main → `git checkout main && git pull` first.
- Stale worktree from prior agent → `git worktree prune` and remove the directory.

### Step 1: Determine Your Mode

| Mode | Trigger | You DO | You NEVER DO |
|------|---------|--------|--------------|
| **Orchestrator** | "plan", "create tasks", "start job" | Create specs, spawn workers, handle merges, spawn reviewer | Write code |
| **Worker** | "implement", "build", "fix" | Branch, implement, write tests, DONE report | Merge into group. Skip DONE report. Skip tests. Touch original DOM. |
| **Reviewer** | spawned by orchestrator after a worker completes | Read all changed files, run tests, run cross-browser smoke, write REVIEW report | Modify code. Approve with open invariant violations. |
| **Rule-pack author** | "write a pack for X", "extend verified list" | Author JSON, validate, manually QA in Chrome + Firefox, commit screenshots | Touch TypeScript. Add manifest permissions. |
| **Single-agent** | direct instruction without role context | Branch → implement → self-review → DONE → docs → merge | Skip branch or DONE report |
| **Diagnoser** | "extension breaks on X", "icon stuck", regression in shadow DOM mounting, persona switch lag, rule-pack misfire | Follow Diagnosis Workflow (below) | Branch and start editing. Try opposites. Commit reverts without diagnostic note. |

### Step 1.5: Classify the Work Shape

Before proceeding, classify:

| Shape | You are in... | Triggers |
|-------|---------------|----------|
| **Codegen** | default workflow below | new module, new component, new rule pack, refactor, scaffolding |
| **Diagnosis** | Diagnosis Workflow (separate section) | regressions, "works in Chrome breaks in Firefox", shadow DOM doesn't mount, manifest permission errors, content script silently no-ops, lookalike false positives |

If the task is Diagnosis shape, STOP. Go to the Diagnosis Workflow. Do NOT branch and start editing.

### Step 2: Read Task File

Read the task in `./jobs/<job>/`. Do NOT read other docs upfront — read on demand.

### Step 3: Create Branch

```bash
git checkout main && git pull 2>/dev/null
git checkout -b job/<job>/<group> 2>/dev/null || git checkout job/<job>/<group>
git checkout -b job/<job>/<group>-<task>
git branch --show-current  # VERIFY
```

---

## Single-Agent Workflow

```
1. BRANCH       → Create task branch
2. IMPLEMENT    → Code + commit incrementally
3. SELF-REVIEW  → Re-read all changed files
4. TEST         → bun test + bun run validate-packs (+ bun run e2e if applicable)
5. CROSS-BROWSER → Load unpacked in Chrome + Firefox, smoke test
6. DONE REPORT  → jobs/<job>/DONE-<task>.md
7. UPDATE DOCS  → ARCHITECTURE.md + LOG.md
8. MERGE        → Squash into group branch
9. CLEANUP      → Delete task branch, prune worktrees
```

### Self-Review Checklist

- [ ] **The five invariants hold** (DOM untouched, no form data, no remote code, no network, escape hatch works)
- [ ] No `chrome.*` API access outside `packages/extension`
- [ ] Closed shadow root (`mode: 'closed'`)
- [ ] No `innerHTML` with rule-pack data
- [ ] No `eval` / `Function()` / string-based timers
- [ ] No `fetch()` to external origins (only `chrome.runtime.getURL`)
- [ ] Bundle size still ≤ 80KB content script (`du -sh dist/extension/content.js`)
- [ ] Mobile responsive checked (375px, 768px, 1024px, 1440px) — if UI changed
- [ ] Loading / error / empty states present — if UI changed
- [ ] Keyboard accessible — if UI changed
- [ ] No file exceeds 500 lines
- [ ] No `any` types
- [ ] Conventional commit messages, no `Co-Authored-By`
- [ ] Tests pass in Chrome **and** Firefox

---

## Diagnosis Workflow (for regressions and weird breakage)

Most regressions come from skipping these steps and guessing.

1. **OBSERVE**       — State what you actually see. Browser console output, exact error, network tab, the failing page's HTML, `chrome://extensions` errors panel. If you don't have evidence, collect it FIRST. Ask the user.
2. **HYPOTHESIZE**   — Write ONE theory of the cause. Not three. One.
3. **PREDICT**       — If the theory is right, what will the fix change? How will you verify? If you can't state this, you're guessing — go back to OBSERVE.
4. **ACT**           — Smallest possible change. ONE variable at a time.
5. **VERIFY**        — Did the predicted symptom actually change? Get evidence (console output, screenshot), not vibes.
6. **STOP IF WRONG** — If the fix didn't work, return to OBSERVE. Do NOT "try the opposite."

### Common diagnosis traps in browser-extension work

| Symptom | First thing to check | Don't immediately... |
|---------|----------------------|----------------------|
| Content script doesn't run | `chrome://extensions` error panel; `manifest.json` `matches` patterns; `run_at` timing | rewrite the content script |
| Shadow DOM doesn't render | Was the host appended? Closed-mode handle stored? CSS reset present? | switch to open mode |
| Works in Chrome, breaks in Firefox | `browser.*` vs `chrome.*` namespacing; `browser_specific_settings` in manifest; MV3 service worker support gaps | duplicate the codepath |
| Persona switch silent no-op | `chrome.storage.onChanged` listener wired? Message routed via background? | re-architect storage |
| Lookalike false positive | Was the domain added to `_verified-domains.json` after the test was written? | weaken the algorithm |
| Icon stuck on gray | `webNavigation.onCommitted` permission? `tabId` correctly threaded into `setIcon`? | poll in the background |

### Revert Circuit Breaker

Before any commit, check: "am I reverting or reversing something I committed in the last 3 commits?"
If yes: STOP. Do not commit. Write a note to the user:
- what I tried
- what I observed
- what evidence I'd need to stop guessing

Wait for the user.

### No Parallel Hypotheses

One fix in flight per symptom. If fix #1 didn't work, DO NOT immediately try fix #2. Collect evidence why #1 failed before trying anything else.

### Commit Rate Alarm

If you notice yourself committing more than 5 times in an hour on a single regression, you have dropped into guessing mode. STOP. Go back to OBSERVE.

---

## Agent Pipeline (Orchestrator perspective)

```
ORCHESTRATOR (main)
│
│  Phase 1: SETUP        — Read SPEC.md, SITES_COVERAGE.md if not in context. Read task.
│  Phase 2: PLAN         — Decompose into worker tasks. Create group branch.
│  Phase 3: IMPLEMENT    — Spawn Worker(s) (worktree, Sonnet)
│  Phase 4: GATE CHECK   — Verify DONE report + commits + invariant checks
│  Phase 5: REVIEW       — Spawn Reviewer (worktree, Sonnet)
│  Phase 6: VERDICT      — Read REVIEW report, decide. If FAIL, loop to Phase 3 with feedback.
│  Phase 7: COMPLETE     — Rebase, run tests, merge, cleanup, update docs
```

### Worker Prompt Template

```
You are a CODE WORKER on onegov.ro — a Manifest V3 WebExtension that
transforms Romanian government portals into a unified persona-adapted UI without
modifying underlying form data, sessions, or submissions.

Tech: Vite + TypeScript + Preact + bun:test, Bun workspaces monorepo.
Read CLAUDE.md, then SPEC.md, then CODING.md before writing code.

## Your Job
Implement the task. Write code, write tests, commit, write DONE report.

## Task
{paste task spec from jobs/<job>/<task>.md}

## Branch
You are on branch: `{branch name}` in worktree `.claude/worktrees/{branch}`.
Verify with `git branch --show-current` before writing code.

## Non-Negotiable Invariants
1. Original DOM is never mutated (only the appended `<div id="onegov-root">`)
2. No form data read or written in v0.1
3. No remote code (no eval, no Function, no remote scripts)
4. No network requests outside bundled assets
5. "Afișează site-ul original" hides the overlay completely

If your implementation weakens any of these, STOP and ask the orchestrator.

## Coding Rules
- TypeScript strict, no `any`
- ENGLISH in code; Romanian only in user-facing UI text
- MAX 500 lines per file
- Closed shadow root only (`mode: 'closed'`)
- No `chrome.*` outside packages/extension
- No new dependencies without orchestrator approval
- No new host_permissions without orchestrator approval
- Tests required for every change (bun:test unit, Playwright E2E if user-flow changed)

## Commit Rules
- NEVER add Co-Authored-By
- Conventional Commits: `<type>(<scope>): <description>`
- Small logical commits

## Required Output
1. Code committed on task branch
2. All tests passing (`bun test` + `bun run validate-packs`)
3. Loaded unpacked in Chrome + Firefox, no console errors
4. DONE report at `jobs/{job}/DONE-{task}.md` (template in CLAUDE.md §Step 4)
5. Summary back to orchestrator: changed files, commit count, blockers
```

### Reviewer Prompt Template

```
You are a CODE REVIEWER on onegov.ro.

## Your Job
Review the implementation. Read every changed file. Run tests. Load the extension
in Chrome and Firefox. Write a REVIEW report. You do NOT modify code or commit.

## Task Spec
{paste task spec}

## Branch
Worker's branch: `{branch}` in worktree `.claude/worktrees/{branch}-review`.

## Hard Checks (any failure = REJECT)
- [ ] Five invariants hold (DOM, form data, remote code, network, escape hatch)
- [ ] Closed shadow root
- [ ] No new host_permissions without orchestrator approval
- [ ] No new runtime dependencies without orchestrator approval
- [ ] No `chrome.*` outside packages/extension
- [ ] No `eval` / `Function()` / `innerHTML` with rule-pack data

## Quality Checks
- [ ] All bun:test tests pass
- [ ] All rule packs validate
- [ ] Loads in Chrome — no console errors
- [ ] Loads in Firefox — no console errors
- [ ] Bundle size: content.js ≤ 80KB gzipped
- [ ] Conventional commit messages
- [ ] DONE report complete and honest
- [ ] No file > 500 lines
- [ ] No `any` types
- [ ] Tests cover error paths, not just happy paths

## Output
Write to: `jobs/{job}/REVIEW-{task}.md` using the template in CLAUDE.md §Step 5.
Verdict: PASS | FAIL.
```
