import ts from 'typescript';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

// Compare strict diagnostics with the pulled source, which already has type errors.
// Line numbers are excluded so harmless shifts do not look like regressions.
const base = process.argv[2] || 'fb34e6d';
const root = process.cwd();
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true });
const configFile = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile);
const config = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root);
const baselinePaths = git('ls-tree', '-r', '--name-only', base, '--', 'src').trim().split(/\r?\n/).filter(p => /\.tsx?$/.test(p));
const baseline = new Map(baselinePaths.map(p => [path.normalize(path.join(root, p)), git('show', `${base}:public-preview/${p}`)]));
function diagnostics(isBase) {
  const host = ts.createCompilerHost(config.options);
  const read = host.readFile;
  if (isBase) host.readFile = filename => baseline.get(path.normalize(filename)) ?? read(filename);
  const roots = isBase ? config.fileNames.filter(p => !p.includes(`${path.sep}src${path.sep}`)).concat([...baseline.keys()]) : config.fileNames;
  const program = ts.createProgram(roots, { ...config.options, incremental: false, noEmit: true }, host);
  return ts.getPreEmitDiagnostics(program).map(d => ({ file: d.file ? path.relative(root, d.file.fileName).replaceAll('\\', '/') : '', code: d.code, message: ts.flattenDiagnosticMessageText(d.messageText, ' ') }));
}
const old = diagnostics(true), current = diagnostics(false);
const key = d => JSON.stringify(d);
const known = new Set(old.map(key));
const added = current.filter(d => !known.has(key(d)));
console.log(`Pulled source: ${old.length} strict TypeScript diagnostics. Current source: ${current.length}. New diagnostics: ${added.length}.`);
if (added.length) { for (const d of added) console.error(`${d.file}: TS${d.code}: ${d.message}`); process.exitCode = 1; }
