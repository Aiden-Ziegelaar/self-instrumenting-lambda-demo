import * as aws from "@cdktf/provider-aws";
import fs from "fs";
import crypto from "crypto";


let instrumentationLayer = new aws.LambdaLayerVersion(
  "instrumentation-layer",
  {
    compatibleRuntimes: ["nodejs18.x"],
    sourceCodeHash: crypto.createHash("sha256").update(fs.readFileSync("staging/instrumentation-layer/instrumentation-layer.js")).digest("hex"),
    filename: "dist/instrumentation-layer.zip"
  }
);

