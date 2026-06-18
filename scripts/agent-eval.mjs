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

function validateOptionalStringField(item, field, label, issues) {
  if (!(field in item)) return;
  if (typeof item[field] !== "string" || item[field].trim().length === 0) {
    issues.push(`${label}: optional field "${field}" must be a non-empty string when present`);
  }
}

function includesNormalized(haystack, needle) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function validateSampleResponse(item, label, issues) {
  if (!("sample_response" in item)) {
    return { checked: false, assertions: 0 };
  }

  validateOptionalStringField(item, "sample_response", label, issues);
  if (typeof item.sample_response !== "string" || item.sample_response.trim().length === 0) {
    return { checked: true, assertions: 0 };
  }

  let assertions = 0;
  if (Array.isArray(item.must_include)) {
    for (const expected of item.must_include) {
      if (typeof expected !== "string" || expected.trim().length === 0) continue;
      assertions += 1;
      if (!includesNormalized(item.sample_response, expected)) {
        issues.push(`${label}: sample_response must include "${expected}"`);
      }
    }
  }

  if (Array.isArray(item.must_not_include)) {
    for (const forbidden of item.must_not_include) {
      if (typeof forbidden !== "string" || forbidden.trim().length === 0) continue;
      assertions += 1;
      if (includesNormalized(item.sample_response, forbidden)) {
        issues.push(`${label}: sample_response must not include "${forbidden}"`);
      }
    }
  }

  return { checked: true, assertions };
}

function validateItem(item, filePath, index) {
  const label = `${relative(filePath)} item ${index + 1}${item && item.id ? ` (${item.id})` : ""}`;
  const issues = [];
  let sampleCheck = { checked: false, assertions: 0 };

  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return { issues: [`${label}: item must be an object`], sampleCheck };
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

  for (const field of ["sample_response", "expected_policy"]) {
    validateOptionalStringField(item, field, label, issues);
  }

  sampleCheck = validateSampleResponse(item, label, issues);

  return { issues, sampleCheck };
}

const files = findJsonFiles(evalRoot);
const issues = [];
const categoryCounts = new Map();
const fileCounts = new Map();
let totalItems = 0;
let sampleResponsesChecked = 0;
let sampleAssertionsChecked = 0;

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
    const result = validateItem(item, filePath, index);
    issues.push(...result.issues);
    if (result.sampleCheck.checked) {
      sampleResponsesChecked += 1;
      sampleAssertionsChecked += result.sampleCheck.assertions;
    }
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
console.log(`Sample responses checked: ${sampleResponsesChecked}`);
console.log(`Sample-response assertions checked: ${sampleAssertionsChecked}`);
console.log("");

if (issues.length > 0) {
  console.error("Fixture validation issues:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("All eval fixtures are valid.");
console.log("Deterministic sample-response checks passed where sample_response is present.");
console.log("Advisory only: these fixtures define expected behavior and do not replace Jest, lint, build, or human review.");
