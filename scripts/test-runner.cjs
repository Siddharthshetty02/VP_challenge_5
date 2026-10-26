const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function findTestFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findTestFiles(fullPath, files);
    } else if (entry.name.endsWith(".test.ts") || entry.name.endsWith(".test.js")) {
      files.push(fullPath);
    }
  }
  return files;
}

const testFiles = findTestFiles(path.join(process.cwd(), "__tests__"));
console.log(`\n======================================================`);
console.log(`🚀 EventGenie Test Suite (${testFiles.length} suites discovered)`);
console.log(`======================================================\n`);

let passedCount = 0;
let failedCount = 0;

for (const file of testFiles) {
  const relPath = path.relative(process.cwd(), file);
  process.stdout.write(`• Running ${relPath} ... `);

  const res = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--test", file],
    { encoding: "utf-8" }
  );

  if (res.status === 0) {
    console.log(`\x1b[32mPASSED\x1b[0m`);
    passedCount++;
  } else {
    console.log(`\x1b[31mFAILED\x1b[0m`);
    failedCount++;
    console.error(res.stdout || res.stderr);
  }
}

console.log(`\n------------------------------------------------------`);
console.log(`Summary: ${passedCount} passed, ${failedCount} failed (${testFiles.length} total)`);
console.log(`======================================================\n`);

process.exit(failedCount > 0 ? 1 : 0);
