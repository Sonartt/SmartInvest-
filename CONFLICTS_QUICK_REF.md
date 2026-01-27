# Quick Reference: PR Conflicts

## Summary
5 out of 7 open PRs have merge conflicts with the main branch.

## PRs with Conflicts

| PR # | Title | Branch | Files | Status |
|------|-------|--------|-------|--------|
| #4 | Remove duplicates, fix crashes | `copilot/remove-duplicates-and-update-files` | 29 | dirty |
| #5 | JWT authentication | `copilot/convert-static-to-authenticated-site` | 5 | dirty |
| #6 | Dynamic app with JWT | `copilot/convert-static-to-dynamic-app` | 10 | dirty |
| #7 | UX enhancements | `copilot/improve-user-friendliness` | 4 | dirty |
| #10 | Consolidate HTML files | `copilot/move-html-files-to-directory` | 8 | dirty |

## PRs without Conflicts

| PR # | Title | Status |
|------|-------|--------|
| #12 | Resolve conflicts (current) | unstable |
| #13 | Check exposed secrets | unstable |

## Quick Fix Commands

```bash
# For each PR branch:
git fetch origin
git checkout <branch-name>
git merge main
# Resolve conflicts in editor
git add .
git commit -m "Resolve merge conflicts"
git push origin <branch-name>
```

## Main Conflict Areas

1. **index.html** - Modified by PRs #5, #6, #7, #10
2. **server.js** - Modified by PRs #4, #5, #6, #7
3. **admin.html** - Modified by PRs #4, #5, #7
4. **package.json** - Modified by PRs #4, #5, #6, #7

## Recommended Merge Order

1. PR #4 (foundational fixes)
2. PR #6 OR PR #5 (choose one auth approach)
3. PR #7 (UX features)
4. PR #10 (file moves)

## Need More Help?

See `CONFLICT_RESOLUTION_GUIDE.md` for detailed step-by-step instructions.
