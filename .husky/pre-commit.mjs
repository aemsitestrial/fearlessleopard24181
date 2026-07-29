import { exec } from "node:child_process";

const run = (cmd) =>
  new Promise((resolve, reject) =>
    exec(cmd, (error, stdout, stderr) => {
      if (error) reject({ error, stdout, stderr });
      else resolve(stdout);
    }),
  );

const changeset = await run("git diff --cached --name-only --diff-filter=ACMR");
const modifiedFiles = changeset.split("\n").filter(Boolean);

// check if there are any model files staged
const modifledPartials = modifiedFiles.filter((file) =>
  file.match(/(^|\/)_.*.json/),
);
if (modifledPartials.length > 0) {
  const output = await run("npm run build:json --silent");
  console.log(output);
  await run(
    "git add component-models.json component-definition.json component-filters.json",
  );
}

// check for lint errors
try {
  await run("npm run lint");
  console.log("✓ Lint check passed");
} catch (error) {
  console.error("\n❌ Lint errors found! Please fix them before committing.\n");
  if (error.stdout) console.log(error.stdout);
  if (error.stderr) console.error(error.stderr);
  process.exit(1);
}
