# Contributing Guide

This document explains how we (the Classtro team) will work together on this project. Please follow these standards so our workflow stays clean and consistent.

---

## 🔹 Branching Strategy
- **`main`** → always stable, production-ready code. Contains only tagged releases.
- **`development`** → integration branch. All features are merged here first.
- **Feature branches** → create from `development`. Naming convention:
  - `feature/auth`
  - `feature/sessions`
  - `feature/polls`
- **Hotfix branches** (urgent fixes to main):
  - `hotfix/login-bug`

👉 Flow: `feature/* → development → main`

---

## 🔹 Commit Message Convention


We use **Conventional Commits** to keep history clean and consistent. The following labels are used for GitHub push commits:


- **Fix(nameOfFeatureFixed)** 🐛: If you've fixed any issues or bugs.
- Ex. `Fix(auth): User response object on login`


- **Feat(nameOfFeatureDeveloped)** ✨: Added a new feature that is fully functional without any bugs.
- Ex. `Feat(Home Page): Home Page with UI & Backend Intgr.`


- **Refactor(nameOfFeatureRefactored)** 🔄: If you've modified existing functionality without changing its behavior.
- Ex. `Refactor(cart): Optimize price calculation logic`


- **Style(nameOfComponent)** 🎨: Changed only formatting, indentation, or styles. No functional changes.
- Ex. `Style(navbar): Fixed CSS indentation in navbar`


- **Docs(nameOfDocumentUpdated)** 📖: Updated documentation files like README, API docs, or comments.
- Ex. `Docs(API): Added authentication usage guide`


- **Chore(nameOfTask)** 🛠: Miscellaneous tasks like dependency updates, build scripts, or configs.
- Ex. `Chore(deps): Updated React to v18.2.0`


- **Test(nameOfTest)** 🧪: Added or updated unit/integration tests.
- Ex. `Test(auth): Added tests for JWT token validation`


- **CI(nameOfPipelineUpdated)** 🚀: Changes related to Continuous Integration (CI/CD).
- Ex. `CI(workflows): Updated GitHub Actions for deployment`


- **Perf(nameOfFeatureOptimized)** ⚡: Performance improvements, optimizing code for speed or efficiency.
- Ex. `Perf(api): Improved response time by caching results`


### Example Conventional Commits


- `feat: add QR code login`
- `fix: resolve socket disconnect issue`
- `chore: update eslint config`
- `docs: add system architecture diagram`
- `refactor: clean up poll controller`
- `test: add auth API tests`

👉 This helps us quickly see what changed and auto-generate changelogs later.

---

## 🔹 Pull Requests (PRs)
- Always open a PR from `feature/*` → `development`.
- PR Title = same style as commit messages (e.g., `feat(auth): implement JWT login`).
- PR Description should include:
  - What feature/bug is solved
  - How to test it
  - Related issue (if any)

**Merging methods:**
- Use **Squash & Merge** → keeps history clean (one commit per PR).

---

## 🔹 Code Reviews
- At least **one teammate reviews** a PR before merging into `development`.
- Review steps:
  1. Open PR → "Files Changed" tab
  2. Check logic, readability, edge cases
  3. Leave comments or Approve
- Small fixes (typos, config) can be merged directly.

👉 Before merging into `main`, everyone should review (since these are releases).
