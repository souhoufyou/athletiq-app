import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(rootDir, ".test-build");
const sourceRoots = ["types", "data", "lib", "test"];

function collectTsFiles(dir) {
  if (!existsSync(dir)) return [];

  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectTsFiles(fullPath);
    return entry.isFile() && entry.name.endsWith(".ts") ? [fullPath] : [];
  });
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function relativeRequire(fromFile, aliasTarget) {
  const target = path.join(outDir, aliasTarget.replace(/^@\//, ""));
  let relative = toPosix(path.relative(path.dirname(fromFile), target));
  if (!relative.startsWith(".")) relative = `./${relative}`;
  return relative;
}

function rewriteAliases(output, fromFile) {
  return output.replace(/require\(["'](@\/[^"']+)["']\)/g, (_match, specifier) => {
    return `require("${relativeRequire(fromFile, specifier)}")`;
  });
}

rmSync(outDir, { force: true, recursive: true });
mkdirSync(outDir, { recursive: true });

const files = sourceRoots.flatMap((folder) => collectTsFiles(path.join(rootDir, folder)));

for (const file of files) {
  const source = readFileSync(file, "utf8");
  const relative = path.relative(rootDir, file).replace(/\.ts$/, ".js");
  const outputFile = path.join(outDir, relative);
  mkdirSync(path.dirname(outputFile), { recursive: true });

  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020
    },
    fileName: file,
    reportDiagnostics: true
  });

  const diagnostics = transpiled.diagnostics ?? [];
  const blockingDiagnostics = diagnostics.filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
  if (blockingDiagnostics.length > 0) {
    const formatted = ts.formatDiagnosticsWithColorAndContext(blockingDiagnostics, {
      getCanonicalFileName: (name) => name,
      getCurrentDirectory: () => rootDir,
      getNewLine: () => "\n"
    });
    console.error(formatted);
    process.exit(1);
  }

  writeFileSync(outputFile, rewriteAliases(transpiled.outputText, outputFile), "utf8");
}

const testFiles = collectTsFiles(path.join(rootDir, "test"))
  .map((file) => path.join(outDir, path.relative(rootDir, file).replace(/\.ts$/, ".js")));

if (testFiles.length === 0) {
  console.error("No test files found in test/**/*.ts");
  process.exit(1);
}

const result = spawnSync(process.execPath, ["--test", ...testFiles], {
  cwd: rootDir,
  stdio: "inherit"
});

process.exit(result.status ?? 1);
