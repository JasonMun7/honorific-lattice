#!/usr/bin/env node

/**
 * Spirited Away Addressee Tagger
 * 
 * Command-line tool to analyze and tag speaker-addressee relationships in film scripts.
 * 
 * SETUP:
 *   npm install @anthropic-ai/sdk papaparse
 * 
 * USAGE:
 *   node tagger.js <input.csv> [options]
 * 
 * EXAMPLES:
 *   # Using environment variable for API key
 *   export ANTHROPIC_API_KEY=sk-ant-...
 *   node tagger.js script.csv
 * 
 *   # Passing API key as argument
 *   node tagger.js script.csv --api-key sk-ant-...
 * 
 *   # Custom output file
 *   node tagger.js script.csv --output tagged.csv
 * 
 *   # Adjust batch size and concurrency
 *   node tagger.js script.csv --batch-size 15 --concurrency 2
 */

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";
import Papa from "papaparse";

// ============================================================================
// PROMPT FUNCTIONS
// ============================================================================

function buildSystemPrompt(cast) {
  return `You are analyzing the screenplay of "Spirited Away" (千と千尋の神隠し).

For each line of dialogue, identify the most likely ADDRESSEE — the character being spoken TO.

Known cast: ${cast.join(", ")}

Rules:
- Use names EXACTLY from the cast list when applicable
- For monologue or self-talk, use: self
- For lines addressed to a group, use: group:<short description> (e.g. group:bathhouse workers)
- For lines that are truly ambiguous, use: unknown
- Output ONLY a JSON array. No markdown fences, no preamble.

Each element must be:
{"id": <integer>, "addressee": "<name>", "confidence": "high"|"medium"|"low", "reasoning": "<one short sentence>"}`;
}

function buildUserPrompt(batch, context) {
  let prompt = "";
  if (context.length > 0) {
    prompt += "Preceding context (do NOT label these, only use for reference):\n";
    context.forEach((c) => {
      prompt += `  [${c.speaker}] ${c.line}\n`;
    });
    prompt += "\n";
  }
  prompt += "Lines to label:\n";
  batch.forEach((b) => {
    prompt += `  ${b.id}. [${b.speaker}] ${b.line}\n`;
  });
  prompt += "\nReturn the JSON array now, with one object per line above.";
  return prompt;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function tagBatch(client, batch, context, cast) {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    system: buildSystemPrompt(cast),
    messages: [
      {
        role: "user",
        content: buildUserPrompt(batch, context),
      },
    ],
  });

  const text = response.content.map((c) => (c.type === "text" ? c.text : "")).join("");
  const stopReason = response.stop_reason;

  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();

  // Find the JSON array
  const firstBracket = cleaned.indexOf("[");
  const lastBracket = cleaned.lastIndexOf("]");
  if (firstBracket === -1 || lastBracket === -1) {
    const err = new Error("No JSON array found in model response");
    err.kind = "parse";
    err.rawResponse = text;
    err.stopReason = stopReason;
    throw err;
  }

  const jsonStr = cleaned.slice(firstBracket, lastBracket + 1);
  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    const err = new Error(`JSON parse failed: ${e.message}`);
    err.kind = "parse";
    err.rawResponse = text;
    err.stopReason = stopReason;
    throw err;
  }

  if (!Array.isArray(parsed)) {
    const err = new Error("Model response was not a JSON array");
    err.kind = "parse";
    err.rawResponse = text;
    err.stopReason = stopReason;
    throw err;
  }

  if (stopReason === "max_tokens") {
    const err = new Error("Response truncated at max_tokens — reduce batch size");
    err.kind = "truncation";
    err.rawResponse = text;
    err.stopReason = stopReason;
    err.partial = parsed;
    throw err;
  }

  return parsed;
}

// ============================================================================
// CONCURRENCY HELPER
// ============================================================================

async function runWithConcurrency(tasks, concurrency, onProgress) {
  const results = new Array(tasks.length);
  let next = 0;
  let done = 0;

  async function worker() {
    while (true) {
      const idx = next++;
      if (idx >= tasks.length) return;
      try {
        results[idx] = { ok: true, value: await tasks[idx]() };
      } catch (e) {
        results[idx] = {
          ok: false,
          error: e.message,
          kind: e.kind || "unknown",
          rawResponse: e.rawResponse,
          stopReason: e.stopReason,
        };
      }
      done++;
      onProgress(done, tasks.length);
    }
  }

  await Promise.all(
    Array(Math.min(concurrency, tasks.length))
      .fill(0)
      .map(worker)
  );
  return results;
}

// ============================================================================
// CSV FUNCTIONS
// ============================================================================

function parseCSV(content, hasHeader) {
  const result = Papa.parse(content, {
    header: false,
    skipEmptyLines: true,
  });

  let data = result.data;
  if (hasHeader && data.length > 0) data = data.slice(1);

  const rows = data
    .filter((r) => r.length >= 2 && r[0] && r[1])
    .map((r, i) => ({
      id: i + 1,
      speaker: String(r[0]).trim(),
      line: String(r[1]).trim(),
    }));

  return rows;
}

function rowsToCSV(rows, results) {
  const lines = ["id,speaker,line,addressee,confidence,reasoning"];

  rows.forEach((r) => {
    const tag = results[r.id] || {};
    const fields = [
      r.id,
      `"${r.speaker.replace(/"/g, '""')}"`,
      `"${r.line.replace(/"/g, '""')}"`,
      tag.addressee || "",
      tag.confidence || "",
      `"${(tag.reasoning || "").replace(/"/g, '""')}"`,
    ];
    lines.push(fields.join(","));
  });

  return lines.join("\n");
}

// ============================================================================
// PROGRESS DISPLAY
// ============================================================================

function formatProgress(done, total) {
  const pct = Math.round((done / total) * 100);
  const filled = Math.round((pct / 100) * 40);
  const bar = "█".repeat(filled) + "░".repeat(40 - filled);
  return `[${bar}] ${done}/${total} (${pct}%)`;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  let inputFile = null;
  let outputFile = null;
  let apiKey = process.env.ANTHROPIC_API_KEY;
  let batchSize = 20;
  let concurrency = 4;
  let hasHeader = true;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--output" && args[i + 1]) {
      outputFile = args[++i];
    } else if (args[i] === "--api-key" && args[i + 1]) {
      apiKey = args[++i];
    } else if (args[i] === "--batch-size" && args[i + 1]) {
      batchSize = Math.max(5, Math.min(40, parseInt(args[++i]) || 20));
    } else if (args[i] === "--concurrency" && args[i + 1]) {
      concurrency = Math.max(1, Math.min(8, parseInt(args[++i]) || 4));
    } else if (args[i] === "--no-header") {
      hasHeader = false;
    } else if (!args[i].startsWith("--")) {
      inputFile = args[i];
    }
  }

  // Validate inputs
  if (!inputFile) {
    console.error("Usage: node tagger.js <input.csv> [options]");
    console.error("\nOptions:");
    console.error("  --output <file>       Output CSV file (default: <input>_tagged.csv)");
    console.error("  --api-key <key>       Anthropic API key (or set ANTHROPIC_API_KEY)");
    console.error("  --batch-size <n>      Lines per API call (default: 20)");
    console.error("  --concurrency <n>     Parallel API calls (default: 4)");
    console.error("  --no-header           Input CSV has no header row");
    process.exit(1);
  }

  if (!fs.existsSync(inputFile)) {
    console.error(`Error: File not found: ${inputFile}`);
    process.exit(1);
  }

  if (!apiKey) {
    console.error("Error: No API key provided.");
    console.error("  Set ANTHROPIC_API_KEY environment variable, or use --api-key flag");
    process.exit(1);
  }

  if (!outputFile) {
    outputFile = inputFile.replace(/\.csv$/i, "") + "_tagged.csv";
  }

  // Parse CSV
  console.log(`📖 Reading ${inputFile}...`);
  const content = fs.readFileSync(inputFile, "utf-8");
  const rows = parseCSV(content, hasHeader);
  console.log(`   Found ${rows.length} lines, extracting cast list...`);

  const cast = Array.from(new Set(rows.map((r) => r.speaker))).sort();
  console.log(`   Cast: ${cast.join(", ")}\n`);

  // Initialize API client
  const client = new Anthropic({ apiKey });

  // Create batches
  const batches = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    batches.push({
      start: i,
      batch: rows.slice(i, i + batchSize),
    });
  }

  console.log(`🏷️  Tagging ${rows.length} lines in ${batches.length} batches...`);
  console.log(`   Batch size: ${batchSize}, Concurrency: ${concurrency}\n`);

  const results = {};
  const batchErrors = [];

  // Run analysis
  const tasks = batches.map(({ start, batch }) => async () => {
    const contextStart = Math.max(0, start - 5);
    const context = rows.slice(contextStart, start);
    const tagged = await tagBatch(client, batch, context, cast);
    return { start, tagged };
  });

  const batchResults = await runWithConcurrency(tasks, concurrency, (done, total) => {
    process.stdout.write(`\r${formatProgress(done, total)}`);
  });

  console.log("\n");

  // Process results
  batchResults.forEach((br, i) => {
    if (br.ok) {
      br.value.tagged.forEach((t) => {
        if (t && typeof t.id === "number") {
          results[t.id] = {
            addressee: t.addressee || "unknown",
            confidence: t.confidence || "low",
            reasoning: t.reasoning || "",
          };
        }
      });
    } else {
      const batch = batches[i];
      batchErrors.push({
        batchIndex: i,
        range: `${batch.batch[0].id}-${batch.batch[batch.batch.length - 1].id}`,
        error: br.error,
        kind: br.kind,
      });
    }
  });

  // Report results
  const taggedCount = Object.keys(results).length;
  const stats = { high: 0, medium: 0, low: 0 };
  Object.values(results).forEach((r) => {
    if (stats[r.confidence] !== undefined) stats[r.confidence]++;
  });

  console.log("📊 Results:");
  console.log(`   Tagged: ${taggedCount}/${rows.length}`);
  console.log(`   High confidence: ${stats.high}`);
  console.log(`   Medium confidence: ${stats.medium}`);
  console.log(`   Low confidence: ${stats.low}`);

  if (batchErrors.length > 0) {
    console.log(`\n⚠️  ${batchErrors.length} batch(es) failed:`);
    batchErrors.forEach((err) => {
      console.log(`   Lines ${err.range} (${err.kind}): ${err.error}`);
    });
  }

  // Write output
  console.log(`\n✍️  Writing ${outputFile}...`);
  const csv = rowsToCSV(rows, results);
  fs.writeFileSync(outputFile, csv, "utf-8");

  console.log(`✅ Done! Output written to ${outputFile}`);
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});