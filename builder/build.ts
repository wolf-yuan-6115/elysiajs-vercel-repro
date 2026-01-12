// @ts-nocheck
import { mkdir, rename, rm, writeFile } from "fs/promises";
import { join, resolve } from "path";

const entryArg = Bun.argv[2];

if (!entryArg) {
  console.error("Usage: bun run build/build.ts <entry-file>");
  process.exit(1);
}

const entryFile = resolve(entryArg);
const distRoot = resolve("dist");
const outputRoot = join(distRoot, ".vercel", "output");
const functionName = "api";
const functionDir = join(outputRoot, "functions", `${functionName}.func`);

try {
  await rm(distRoot, { recursive: true, force: true });
  await mkdir(functionDir, { recursive: true });

  const build = await Bun.build({
    entrypoints: [entryFile],
    outdir: functionDir,
    target: "bun",
    format: "esm",
    minify: true,
    sourcemap: "external",
  });

  if (!build.success) {
    throw new Error("Bun.build failed");
  }

  const jsOutput = build.outputs.find((output) => output.path.endsWith(".js"));

  if (!jsOutput) {
    throw new Error("No JS output produced by Bun.build");
  }

  const indexPath = join(functionDir, "index.js");

  if (jsOutput.path !== indexPath) {
    await rename(jsOutput.path, indexPath);
  }

  const functionConfig = {
    runtime: "nodejs20.x",
    handler: "index.js",
    launcherType: "Nodejs",
  };

  await writeFile(
    join(functionDir, ".vc-config.json"),
    `${JSON.stringify(functionConfig, null, 2)}\n`,
  );

  const buildOutputConfig = {
    version: 3,
    routes: [
      {
        src: "/(.*)",
        dest: `functions/${functionName}.func`,
      },
    ],
  };

  await writeFile(
    join(outputRoot, "config.json"),
    `${JSON.stringify(buildOutputConfig, null, 2)}\n`,
  );

  console.log(`Build output written to ${distRoot}`);
} catch (error) {
  console.error(error);
  process.exit(1);
}
