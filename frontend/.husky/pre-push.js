import { execSync } from 'child_process';

// Get the name of the current branch
const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

console.log(`Running tests on branch: ${currentBranch}`);

// Check if the current branch is either 'master' or 'homol'
if (currentBranch === 'master' || currentBranch === 'homol') {
  // Run npm test script
  execSync('npx vitest run --project front', { stdio: 'inherit' });
} else {
  console.log("Skipping tests as you are not in 'master' or 'homol' branches.");
}

// Exit with status 0 to allow the push
process.exit(0);
