#!/usr/bin/env node
import { execFileSync } from "node:child_process";

const run = (command, args) => {
  console.log(`\n$ ${command} ${args.join(" ")}`);
  execFileSync(command, args, { stdio: "inherit" });
};

const runAudit = (omitDev) => {
  const args = ["audit", "--json"];
  if (omitDev) args.splice(1, 0, "--omit=dev");

  console.log(`\n$ npm ${args.join(" ")}`);
  let output;
  try {
    output = execFileSync("npm", args, { encoding: "utf8" });
  } catch (error) {
    output = error.stdout?.toString() ?? "";
  }

  const report = JSON.parse(output);
  const totals = report.metadata?.vulnerabilities ?? {};
  const total = totals.total ?? 0;
  console.log(`Audit result: ${total} finding(s); high=${totals.high ?? 0}, critical=${totals.critical ?? 0}`);
  if (total > 0) {
    throw new Error(`${omitDev ? "Production" : "Full"} dependency audit has unresolved findings.`);
  }
};

const scanTrackedSecrets = () => {
  const pattern = "BEGIN (RSA|OPENSSH|EC) PRIVATE KEY|gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}";
  console.log(`\n$ git grep -nE ${pattern}`);
  try {
    execFileSync("git", [
      "grep",
      "-nE",
      pattern,
      "--",
      ":(exclude).env*",
      ":(exclude)package-lock.json",
    ], { stdio: "inherit" });
    throw new Error("Tracked credential-like content was found.");
  } catch (error) {
    if (error.status === 1) {
      console.log("Tracked-secret scan: no matching patterns.");
      return;
    }
    throw error;
  }
};

run("npm", ["run", "check"]);
run("npm", ["run", "test:e2e"]);
runAudit(true);
runAudit(false);
scanTrackedSecrets();
console.log("\nRelease preflight passed.");
