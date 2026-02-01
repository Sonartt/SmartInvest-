# CI/CD Workflow Updates

## Overview
This commit updates the CI/CD workflows to properly support the SmartInvest Africa Node.js/Express application and fixes failing pull request checks.

## Changes Made

### 1. New Comprehensive CI/CD Workflow (`nodejs-ci.yml`)
Created a new comprehensive workflow that includes:

- **Test & Lint Job**: Runs on Node.js 18.x and 20.x
  - Syntax checking for all JavaScript files
  - Security vulnerability scanning
  - Automated dependency installation

- **HTML & Accessibility Validation Job**:
  - Validates HTML structure (DOCTYPE, html, head, body tags)
  - Runs accessibility checks using axe-core
  - Ensures web standards compliance

- **Security Scan Job**:
  - NPM security audit
  - Checks for exposed secrets in code
  - Prevents accidental credential commits

- **Build Verification Job**:
  - Verifies server can start successfully
  - Runs acceptance tests
  - Ensures deployment readiness

- **Deploy Preview Job** (for PRs):
  - Automatically deploys preview to Vercel
  - Only runs on pull requests
  - Requires Vercel secrets to be configured

### 2. Updated Quick CI Workflow (`ci.yml`)
Simplified the existing CI workflow to:
- Run quick syntax checks
- Perform security audits
- Provide fast feedback on basic code quality

### 3. Deprecated Jekyll Workflow
The Jekyll workflow (`jekyll-docker.yml`) was causing failures because:
- SmartInvest Africa is a Node.js/Express application, not a Jekyll site
- The workflow expected Jekyll files (Gemfile.lock, _site directory)
- This was causing PRs #6, #7, #12, and #13 to fail

**Action Required**: The `jekyll-docker.yml` file still exists on the main branch in GitHub and should be deleted to prevent future failures.

## How to Delete the Jekyll Workflow

Run these commands to remove the Jekyll workflow:

```bash
# Switch to main branch
git checkout main

# Delete the Jekyll workflow file
git rm .github/workflows/jekyll-docker.yml

# Commit the change
git commit -m "Remove Jekyll workflow (not applicable to Node.js app)"

# Push to GitHub
git push origin main
```

## Required GitHub Secrets

For the full CI/CD pipeline to work (especially Vercel deployment), ensure these secrets are configured in your GitHub repository:

- `VERCEL_TOKEN` - Your Vercel authentication token
- `VERCEL_ORG_ID` - Your Vercel organization ID
- `VERCEL_PROJECT_ID` - Your Vercel project ID

## Testing the Workflows

The workflows will automatically run when:
- Code is pushed to `main` or any `copilot/**` branch
- A pull request is opened targeting `main`

You can also manually trigger workflows from the GitHub Actions tab.

## Benefits

1. **Comprehensive Testing**: Multi-layered testing approach catches issues early
2. **Security**: Automated security scanning prevents vulnerabilities
3. **Quality**: HTML and accessibility validation ensures web standards
4. **Fast Feedback**: Quick CI provides immediate feedback on basic checks
5. **Preview Deployments**: Automatic Vercel previews for every PR

## Files Modified

- `.github/workflows/nodejs-ci.yml` - NEW comprehensive CI/CD workflow
- `.github/workflows/ci.yml` - UPDATED quick CI workflow
- `.github/workflows/jekyll-deprecated.yml` - NEW placeholder to document deprecation

## Next Steps

1. Delete `jekyll-docker.yml` from the main branch (see above)
2. Configure Vercel secrets if deployment is needed
3. Review and merge this PR
4. All future PRs will use the new workflow and should pass checks
