Create a git commit for the current staged changes. Follow these steps:

1. Run `git status` (never use -uall) and `git diff --cached` in parallel to see what's staged.
2. If nothing is staged, run `git diff` to check for unstaged changes. Show the user what's changed and ask which files to stage.
3. Run `git log --oneline -10` to see recent commit style.
4. Analyze the staged diff and generate a commit message following these rules:
   - **Format**: `type: subject` (no scope unless clearly needed)
   - **Allowed types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
   - **Subject rules**: lowercase start, no period at end, imperative mood, concise (under 72 chars)
   - Pick the type that best describes the change:
     - `feat` = new feature or capability
     - `fix` = bug fix
     - `refactor` = code restructuring without behavior change
     - `style` = formatting, whitespace, semicolons (not CSS)
     - `docs` = documentation only
     - `perf` = performance improvement
     - `test` = adding/updating tests
     - `build` = dependencies or build config
     - `ci` = CI/CD pipeline changes
     - `chore` = maintenance tasks
     - `revert` = reverting a previous commit
5. Present the proposed commit message to the user and ask for confirmation before committing.
6. Commit using a HEREDOC format:
   ```
   git commit -m "$(cat <<'EOF'
   type: subject

   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
   EOF
   )"
   ```
7. After committing, run `git status` to verify success.

**Important**: The pre-commit hook runs `lint-staged` (ESLint + Prettier) and `commitlint` validates the message. If the hook fails, fix the issue and create a NEW commit (never amend).
