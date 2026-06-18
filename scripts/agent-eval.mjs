#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const evalRoot = path.join(repoRoot, "evals");

const requiredFields = [
  "id",
  "category",
  "prompt",
  "expected_behavior",
  "must_include",
  "must_not_include",
  "notes",
];

function findJsonFiles(directory) {
  if (!existsSync(directory)) return [];

  const entries = readdirSync(directory).sort();
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry);
    const stats = statSync(absolutePath);
    if (stats.isDirectory()) {
      files.push(...findJsonFiles(absolutePath));
    } else if (stats.isFile() && entry.endsWith(".json")) {
      files.push(absolutePath);
    }
  }

  return files;
}

function relative(filePath) {
  return path.relative(repoRoot, filePath);
}

function itemsFromFixture(parsed, filePath) {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.items)) return parsed.items;
  throw new Error(`${relative(filePath)} must contain a JSON array or an object with an items array.`);
}

function validateStringField(item, field, label, issues) {
  if (typeof item[field] !== "string" || item[field].trim().length === 0) {
    issues.push(`${label}: missing non-empty string field "${field}"`);
  }
}

function validateArrayField(item, field, label, issues) {
  if (!Array.isArray(item[field])) {
    issues.push(`${label}: missing array field "${field}"`);
    return;
  }
  if (!item[field].every((value) => typeof value === "string" && value.trim().length > 0)) {
    issues.push(`${label}: field "${field}" must contain only non-empty strings`);
  }
}

function validateItem(item, filePath, index) {
  const label = `${relative(filePath)} item ${index + 1}${item && item.id ? ` (${item.id})` : ""}`;
  const issues = [];

  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return [`${label}: item must be an object`];
  }

  for (const field of requiredFields) {
    if (!(field in item)) issues.push(`${label}: missing required field "${field}"`);
  }

  for (const field of ["id", "category", "prompt", "expected_behavior", "notes"]) {
    validateStringField(item, field, label, issues);
  }

  for (const field of ["must_include", "must_not_include"]) {
    validateArrayField(item, field, label, issues);
  }

  return issues;
}

const files = findJsonFiles(evalRoot);
const issues = [];
const categoryCounts = new Map();
const fileCounts = new Map();
let totalItems = 0;

console.log("Delta site agent eval fixture check");
console.log("===================================");
console.log("Mode: local read-only fixture validation; no backend, browser, LLM, or side-effect calls.");
console.log(`Eval root: ${relative(evalRoot)}`);
console.log("");

if (files.length === 0) {
  console.error("No eval fixture JSON files found.");
  process.exit(1);
}

for (const filePath of files) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    issues.push(`${relative(filePath)}: malformed JSON (${error.message})`);
    continue;
  }

  let items;
  try {
    items = itemsFromFixture(parsed, filePath);
  } catch (error) {
    issues.push(error.message);
    continue;
  }

  fileCounts.set(relative(filePath), items.length);
  totalItems += items.length;

  items.forEach((item, index) => {
    issues.push(...validateItem(item, filePath, index));
    if (item && typeof item.category === "string" && item.category.trim()) {
      categoryCounts.set(item.category, (categoryCounts.get(item.category) || 0) + 1);
    }
  });
}

console.log("Fixture files:");
for (const [filePath, count] of fileCounts) {
  console.log(`- ${filePath}: ${count}`);
}
console.log("");

console.log("Counts by category:");
for (const [category, count] of [...categoryCounts.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  console.log(`- ${category}: ${count}`);
}
console.log("");

console.log(`Total eval items: ${totalItems}`);
console.log("");

if (issues.length > 0) {
  console.error("Fixture validation issues:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("All eval fixtures are valid.");
console.log("Advisory only: these fixtures define expected behavior and do not replace Jest, lint, build, or human review.");
