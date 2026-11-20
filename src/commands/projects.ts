// `braid projects add|remove|list`: the per-machine list of projects one board serves (`~/.braid/projects.json`),
// each shown with its readiness. GitHub is not asked here (one `gh` call per project would make `list` slow);
// the board checks it when it serves the project.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { basename, resolve } from "node:path";
import { mainCheckout } from "../board/t3.js";
import { problemLine, readiness } from "../braids/readiness.js";
import { braidHome } from "../notify/config.js";
import { folderKey, projectsFile, readProjects, samePath, updateProjects, validName, validPort, type Project } from "../projects/list.js";
import { UsageError } from "./braids.js";

export interface ProjectsDeps {
  readonly home?: string;
  readonly cwd?: string;
}

export interface ProjectsOut {
  readonly stdout: string;
  readonly stderr: string;
}

const USAGE = "usage: braid projects add [<path>] [--name <name>] [--port <n>] | remove <name> | list";

/** Splits `add`'s arguments into the path and the --name and --port values. */
function parseAdd(args: readonly string[]): { path: string | undefined; name: string | undefined; port: string | undefined } {
  const out: { path: string | undefined; name: string | undefined; port: string | undefined } = { path: undefined, name: undefined, port: undefined };
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i] ?? "";
    if (a === "--name" || a === "--port") {
      const value = args[i + 1];
      if (value === undefined || value.startsWith("--")) {
        throw new UsageError(`${a} needs a value`);
      }
      out[a === "--name" ? "name" : "port"] = value;
      i += 1;
    } else if (a.startsWith("--") || out.path !== undefined) {
      throw new UsageError(`braid projects add takes one path, --name <name> and --port <n>; got: ${args.join(" ")}`);
    } else {
      out.path = a;
    }
  }
  return out;
}

/** The main checkout of the repository `path` is in; throws when it is not in one. */
function mainCheckoutOf(path: string): string {
  if (!existsSync(path)) {
    throw new UsageError(`${path} does not exist`);
  }
  const top = spawnSync("git", ["rev-parse", "--show-toplevel"], { cwd: path, encoding: "utf8" });
  if (top.status !== 0 || top.stdout.trim() === "") {
    throw new UsageError(`${path} is not in a Git repository`);
  }
  return resolve(mainCheckout(top.stdout.trim()));
}

/** The readiness lines of one project, indented under it. */
function readinessLines(p: Project): string[] {
  if (!existsSync(p.path)) {
    return [`  problem: the folder no longer exists; run braid projects remove ${p.name}, or add it again from where it is now`];
  }
  const problems = readiness(p.path, null);
  return problems.length === 0 ? ["  ready (GitHub not checked here)"] : problems.map((x) => `  ${problemLine(x)}`);
}

function header(p: Project): string {
  return `${p.name}  ${p.path}${p.port === undefined ? "" : `  port ${p.port}`}`;
}

function add(args: readonly string[], home: string, cwd: string): ProjectsOut {
  const { path: pathArg, name: nameArg, port: portArg } = parseAdd(args);
  let port: number | undefined;
  if (portArg !== undefined) {
    port = /^\d+$/.test(portArg) ? Number(portArg) : NaN;
    if (!validPort(port)) {
      throw new UsageError(`--port takes a number from 1 to 65535; got: ${portArg}`);
    }
  }
  const path = mainCheckoutOf(resolve(cwd, pathArg ?? "."));
  const name = nameArg ?? basename(path);
  if (!validName(name)) {
    throw new UsageError(nameArg === undefined ? `the folder name ${name} can't be a project name; give one with --name (letters, digits, ., _ and -)` : `--name takes 1 to 64 letters, digits, ., _ and -; got: ${name}`);
  }
  const project: Project = port === undefined ? { name, path } : { name, path, port };
  const others = updateProjects((list) => {
    const byPath = list.find((p) => samePath(p.path, path));
    if (byPath !== undefined) {
      throw new UsageError(`${path} is already listed as ${byPath.name}`);
    }
    const byName = list.find((p) => p.name === name);
    if (byName !== undefined) {
      throw new UsageError(`a project named ${name} is already listed (${byName.path}); pick another with --name`);
    }
    return { list: [...list, project], result: list };
  }, home);
  const twins = others.filter((p) => folderKey(p.path) === folderKey(path));
  const warnings = twins.map(
    (t) => `warning: ${t.name} (${t.path}) has the same folder name ${basename(path)}; both projects' item worktrees go to ~/braid-worktrees/${basename(path)}/\n`,
  );
  return { stdout: [`Added ${header(project)}`, ...readinessLines(project), `List: ${projectsFile(home)}`, ""].join("\n"), stderr: warnings.join("") };
}

function remove(args: readonly string[], home: string): ProjectsOut {
  const [name, ...extra] = args;
  if (name === undefined || extra.length > 0 || name.startsWith("--")) {
    throw new UsageError("usage: braid projects remove <name>");
  }
  const gone = updateProjects((list) => {
    const found = list.find((p) => p.name === name);
    return found === undefined ? { list: null, result: null } : { list: list.filter((p) => p !== found), result: found };
  }, home);
  if (gone === null) {
    throw new UsageError(`no project named ${name}; braid projects list shows the names`);
  }
  return { stdout: `Removed ${header(gone)}\n`, stderr: "" };
}

function list(args: readonly string[], home: string): ProjectsOut {
  if (args.length > 0) {
    throw new UsageError(`braid projects list takes no arguments; got: ${args.join(" ")}`);
  }
  const projects = readProjects(home);
  if (projects.length === 0) {
    return { stdout: `No projects yet. Add one with braid projects add [<path>].\nList: ${projectsFile(home)}\n`, stderr: "" };
  }
  return { stdout: [...projects.flatMap((p) => [header(p), ...readinessLines(p)]), `List: ${projectsFile(home)}`, ""].join("\n"), stderr: "" };
}

export function projectsCommand(args: readonly string[], deps: ProjectsDeps = {}): ProjectsOut {
  const home = deps.home ?? braidHome();
  const cwd = deps.cwd ?? process.cwd();
  const [sub, ...rest] = args;
  switch (sub) {
    case "add":
      return add(rest, home, cwd);
    case "remove":
      return remove(rest, home);
    case "list":
      return list(rest, home);
    default:
      throw new UsageError(USAGE);
  }
}
