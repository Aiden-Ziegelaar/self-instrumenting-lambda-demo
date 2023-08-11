import * as fs from "node:fs/promises";
import * as esbuild from "esbuild";

const main = async () => {
  // Build the functions

  const functionSources = await fs.readdir(`${process.cwd()}/functions`);

  const entrypoints = functionSources.map(
    (source) => `${process.cwd()}/functions/${source}/index.ts`,
  );
  let subfolder = "";
  if (functionSources.length === 1) {
    subfolder = functionSources[0];
  }
  await esbuild.build({
    entryPoints: entrypoints,
    bundle: true,
    outdir: `staging/functions/${subfolder}`,
    platform: "node",
  });

  // Build the self-instrumenting layer

  await esbuild.build({
    entryPoints: ["layers/instrumentation/instrumentation.ts"],
    bundle: true,
    outdir: `staging/layers/instrumentation`,
    platform: "node",
  });
};

main();
