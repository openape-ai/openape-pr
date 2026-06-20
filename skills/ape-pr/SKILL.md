---
name: ape-pr
description: Use after opening a pull request that a human should review — package the diff + a markdown description (and any before/after images) and upload it to pr.openape.ai, then poll the verdict and act on it (merge on approve, address inline comments on request-changes).
---

# ape-pr — get a pull request reviewed on a beautiful diff

When you finish a change that needs human sign-off, don't paste a raw patch —
upload the PR and hand over one review link. The reviewer sees a proper diff
(split or unified, syntax-highlighted), your description, and leaves a verdict
plus inline comments. You poll the result and act.

## Workflow

1. **Produce the diff and description** in a directory:

   ```
   out/
   ├─ pr.json          # title, description (markdown), branch …
   ├─ diff.patch       # git diff main...HEAD
   └─ desc/before.png  # optional images the description embeds
   ```

   Write the diff: `git diff <base>...<head> > out/diff.patch`.
   Manifest format: `ape-pr docs manifest`. Put the *why* in the description,
   the *what* in the diff.

2. **Upload:**

   ```bash
   URL=$(ape-pr upload ./out)   # stdout = the review link
   SLUG=$(ape-pr upload ./out --json | jq -r .slug)
   ```

3. **Wait for the verdict and act:**

   ```bash
   ape-pr status "$SLUG" --wait   # blocks until reviewed, exit 0
   ```

   - `approve` → merge.
   - `request-changes` → address each inline comment, push, upload a fresh PR.
   - `comment` → read the notes; usually iterate.

## Rules

- Auth is the unified apes session (`apes login` once per device). If a call
  fails with NotLoggedInError, ask the human to run `apes login <email>`.
- Only a human can submit a verdict — you upload and poll, never self-approve.
- After request-changes, upload a new PR rather than mutating the old one.
- No secrets in the diff, description, or images.
- Local/dev instance: `--endpoint http://localhost:3006` or `APE_PR_ENDPOINT`.
