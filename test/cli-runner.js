// Running the CLI the way a user would, for the tests that assert on its exit
// status rather than on a report object.
import { spawnSync } from "node:child_process";

const CLI_PATH = new URL("../src/cli.js", import.meta.url);

export function runCli(args, options = {}) {
  return spawnSync(process.execPath, [CLI_PATH.pathname, ...args], {
    encoding: "utf8",
    input: options.input
  });
}
