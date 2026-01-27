# Step-by-Step Conflict Resolution Guide

This guide provides detailed instructions for resolving merge conflicts in each pull request.

## Prerequisites

Before starting, ensure you have:
- Git installed locally
- Write access to the repository
- Basic understanding of git merge conflict resolution
- A code editor for resolving conflicts

## General Workflow

For each PR with conflicts:

```bash
# 1. Fetch all branches
git fetch origin

# 2. Checkout the PR branch
git checkout <branch-name>

# 3. Update your local main branch
git fetch origin main:main

# 4. Attempt to merge main into the PR branch
git merge main

# 5. If conflicts occur, resolve them
# - Open conflicted files in your editor
# - Look for conflict markers: <<<<<<<, =======, >>>>>>>
# - Decide which changes to keep
# - Remove conflict markers
# - Save files

# 6. Stage resolved files
git add <resolved-files>

# 7. Complete the merge
git commit -m "Resolve merge conflicts with main"

# 8. Push changes back to the PR branch
git push origin <branch-name>

# 9. Verify PR shows as mergeable on GitHub
```

## PR-Specific Resolution Instructions

### PR #10: Consolidate HTML files into /html directory

**Branch**: `copilot/move-html-files-to-directory`

**Likely Conflicts**:
- File moves may conflict with files modified in main
- Path references in other files

**Resolution Steps**:
```bash
git checkout copilot/move-html-files-to-directory
git merge main

# Expected conflicts:
# - index.html (if it was modified in main after PR creation)
# - File path references

# Resolution strategy:
# 1. Accept the file moves from this branch
# 2. Apply any updates from main to the moved files
# 3. Update any file path references to point to new /html directory
```

**Files to check after resolution**:
- Ensure all HTML files are in `/html` directory
- Verify any scripts/links pointing to HTML files use correct paths
- Check server.js for any static file serving paths

---

### PR #7: Add comprehensive UX enhancements

**Branch**: `copilot/improve-user-friendliness`

**Likely Conflicts**:
- `index.html` - extensive UI changes
- `server.js` - new API endpoints
- `package.json` - new dependencies

**Resolution Steps**:
```bash
git checkout copilot/improve-user-friendliness
git merge main

# Expected conflicts:
# - index.html: navigation, onboarding modal, chat widget
# - server.js: /api/contact, /api/feedback endpoints

# Resolution strategy:
# 1. For index.html: Keep UX enhancements (they're additive)
# 2. For server.js: Keep both existing routes and new ones
# 3. For package.json: Merge dependencies from both branches
```

**After resolution**:
- Test the onboarding flow
- Verify chat widget functionality
- Check that admin portal button works
- Test all new API endpoints

---

### PR #6: Convert static website to dynamic app

**Branch**: `copilot/convert-static-to-dynamic-app`

**Likely Conflicts**:
- `server.js` - JWT auth, password recovery
- `index.html` / `user.html` - dashboard changes
- `admin.html` - admin features
- `package.json` - dependencies

**Resolution Steps**:
```bash
git checkout copilot/convert-static-to-dynamic-app
git merge main

# Expected conflicts:
# - server.js: Authentication routes, middleware
# - admin.html: May conflict with PR #4 changes

# Resolution strategy:
# 1. Keep JWT authentication implementation
# 2. Merge any additional routes from main
# 3. Preserve premium content management features
# 4. Merge dependency lists
```

**Critical checks**:
- JWT token generation works
- Password recovery flow functions
- Premium content restrictions apply correctly
- User/admin dashboards load properly

---

### PR #5: Convert authentication from demo to JWT-based

**Branch**: `copilot/convert-static-to-authenticated-site`

**Likely Conflicts**:
- `server.js` - JWT implementation (likely conflicts with PR #6)
- `index.html` - admin UI embedding
- `package.json` - jsonwebtoken dependency

**Resolution Steps**:
```bash
git checkout copilot/convert-static-to-authenticated-site
git merge main

# Expected conflicts:
# - server.js: JWT routes may overlap with PR #6 if it was merged
# - index.html: Embedded admin UI

# Resolution strategy:
# 1. If PR #6 was already merged, this PR may be redundant
# 2. Otherwise, keep JWT implementation
# 3. Keep embedded admin UI approach
```

**Note**: PR #5 and PR #6 have significant overlap. Consider merging only one of them, or cherry-picking specific features.

---

### PR #4: Remove duplicates, fix runtime crashes

**Branch**: `copilot/remove-duplicates-and-update-files`

**Likely Conflicts**:
- `server.js` - helper functions, security updates
- `admin.html` - dashboard redesign
- `package.json` - dependency updates
- `.github/workflows/` - CI configuration

**Resolution Steps**:
```bash
git checkout copilot/remove-duplicates-and-update-files
git merge main

# Expected conflicts:
# - server.js: readPurchases, writePurchases, readTokens, writeTokens functions
# - admin.html: Tabbed interface changes
# - package.json: Updated dependency versions

# Resolution strategy:
# 1. Keep the helper functions (critical fixes)
# 2. Keep the security updates (multer, nodemailer)
# 3. Keep the modern admin dashboard with tabs
# 4. Merge dependencies, preferring newer versions
```

**Critical validations**:
- Run `npm audit` to ensure 0 vulnerabilities
- Test file marketplace features (require helper functions)
- Verify admin dashboard tabs work
- Check CI workflow runs successfully

---

## Conflict Resolution Best Practices

### 1. Understanding Conflict Markers

When you encounter a conflict, you'll see:
```
<<<<<<< HEAD
code from your current branch
=======
code from the branch being merged
>>>>>>> branch-name
```

### 2. Resolution Strategies

**Strategy A: Keep Current**
```
code from your current branch
```

**Strategy B: Keep Incoming**
```
code from the branch being merged
```

**Strategy C: Keep Both**
```
code from your current branch
code from the branch being merged
```

**Strategy D: Manual Merge**
```
carefully combined code from both
```

### 3. Common Conflict Scenarios

**Scenario 1: Different features added to same area**
- Solution: Keep both, ensure they don't conflict functionally

**Scenario 2: Same feature implemented differently**
- Solution: Choose the better implementation or combine best parts

**Scenario 3: Dependency version conflicts**
- Solution: Use the newer version, verify compatibility

**Scenario 4: Duplicate endpoints/routes**
- Solution: Remove duplicates, keep most complete implementation

### 4. Testing After Resolution

After resolving conflicts for any PR:

```bash
# 1. Install dependencies
npm install

# 2. Run linting (if available)
# Note: If lint script doesn't exist, this will show an error which can be ignored
npm run lint 2>/dev/null || echo "No lint script found, skipping"

# 3. Check for security vulnerabilities
npm audit

# 4. Start the server
node server.js

# 5. Test affected functionality manually
# - Open browser to http://localhost:3000
# - Test login/authentication
# - Test admin features
# - Test new features from the PR
```

## Recommended Merge Order

To minimize conflicts, merge PRs in this order:

1. **PR #4** - Foundational fixes and dependencies
2. **PR #6** OR **PR #5** - Choose one authentication approach
3. **PR #7** - UX enhancements (mostly additive)
4. **PR #10** - File reorganization (last to avoid path conflicts)

## Troubleshooting

### Issue: Too many conflicts

**Solution**: Consider creating a fresh branch from main and manually applying changes from the PR.

### Issue: Tests fail after resolution

**Solution**: Review changes carefully, may have inadvertently removed critical code.

### Issue: Merge creates duplicate functionality

**Solution**: Refactor after merge to consolidate duplicate code.

### Issue: Unsure which version to keep

**Solution**: Use `git log` and `git show` to understand the context of each change.

## Getting Help

If conflicts are too complex:
1. Create a new issue documenting the specific conflicts
2. Tag the PR author for guidance
3. Consider pair programming the resolution
4. Use `git diff` to understand all changes

## Final Checklist

Before marking a PR as resolved:
- [ ] All conflict markers removed
- [ ] Code compiles/runs without errors
- [ ] Tests pass (if applicable)
- [ ] No security vulnerabilities introduced
- [ ] Documentation updated if needed
- [ ] PR description updated with resolution notes
- [ ] Changes reviewed by at least one other person

---

*Document created: 2026-01-27*
*Last updated: 2026-01-27*
