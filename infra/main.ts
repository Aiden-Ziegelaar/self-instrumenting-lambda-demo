import "dotenv/config";

import * as path from "path";
import * as crypto from "crypto";
import * as fs from "fs";

import { IConstruct, Construct } from "constructs";
import { IAspect, Aspects, App, TerraformStack, Annotations } from "cdktf";
import * as aws from "@cdktf/provider-aws";

const PWD = process.cwd();

const APP_NAME = "self-instrumenting-lambda-demo";

function checkWafRulesValid(input: aws.wafWebAcl.WafWebAclRulesList) {
  return !!input; // we might check for inclusion of a specific rule group here without excludes
}

export class CloudfrontWafPunitiveAspect implements IAspect {
  constructor() {}

  visit(node: IConstruct) {
    if (node instanceof aws.cloudfrontDistribution.CloudfrontDistribution) {
      if (!node.webAclIdInput) {
        Annotations.of(node).addError("No WAF on CloudFront Distribution")
      }
    }
  }
}

export class CloudfrontWafRemedialAspect implements IAspect {
  constructor(private wafArn: string) {}

  visit(node: IConstruct) {
    if (node instanceof aws.cloudfrontDistribution.CloudfrontDistribution) {
      if (!node.webAclIdInput) {
        Annotations.of(node).addInfo("Added default WAF to Cloudfront")
        node.webAclId = this.wafArn;
      }
    }
  }
}

export class WafMinimumStandardsAspect implements IAspect {
  visit(node: IConstruct) {
    if (node instanceof aws.wafWebAcl.WafWebAcl) {
      if (!checkWafRulesValid(node.rules)) {
        Annotations.of(node).addError(
          'WAF does not meet minimum standards,' +
          'see companydocs.com/waf for more info'
        );
      }
    }
  }
}

export class ValidateLambdaIsPrefixed implements IAspect {
  constructor(private prefix: string) {}

  visit(node: IConstruct) {
    if (node instanceof aws.lambdaFunction.LambdaFunction) {
      if (
        node.functionName &&
        !node.functionNameInput?.startsWith(this.prefix)
      ) {
        Annotations.of(node).addError(
          `Each Lambda name needs to start with ${this.prefix}`
        );
      }
    }
  }
}

export class LambdaLayerInstrumentAspect implements IAspect {
  constructor(private instrumentationLayerArn: string) {}

  // This method is called on every Construct within the specified scope (resources, data sources, etc.).
  visit(node: IConstruct) {
    if (node instanceof aws.lambdaFunction.LambdaFunction) {
      // We need to take the input value to not create a circular reference
      const currentEnv = node.environmentInput ?? {};
      const currentHandler = node.handlerInput ?? "index.hander";
      const currentLayers = node.layersInput ?? [];

      if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable must be set");
      }

      node.handler = "/opt/instrumentation.handler";
      node.layers = [...currentLayers, this.instrumentationLayerArn];
      node.environment.internalValue = {
        variables: {
          ...currentEnv.variables,
          API_KEY: process.env.API_KEY,
          USER_HANDLER: currentHandler,
        },
      };
    }
  }
}

class SelfInstrumentingStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new aws.provider.AwsProvider(this, "aws", {});

    const instrumentationLayer = new aws.lambdaLayerVersion.LambdaLayerVersion(
      this,
      "instrumentation-layer",
      {
        layerName: `${APP_NAME}_instrumentation-layer`,
        compatibleRuntimes: ["nodejs18.x"],
        filename: path.join(PWD, "dist/layers/instrumentation.zip"),
        sourceCodeHash: crypto
          .createHash("sha256")
          .update(
            fs.readFileSync(path.join(PWD, "dist/layers/instrumentation.zip")),
          )
          .digest("base64"),
      },
    );

    const lambdaRole = new aws.iamRole.IamRole(this, "lambda-role", {
      name: `${APP_NAME}_lambda-role`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Principal: {
              Service: "lambda.amazonaws.com",
            },
            Effect: "Allow",
          },
        ],
      }),
    });

    new aws.lambdaFunction.LambdaFunction(this, "hello-world-lambda", {
      functionName: `${APP_NAME}_hello-world-lambda`,
      runtime: "nodejs18.x",
      handler: "index.handler",
      sourceCodeHash: crypto
        .createHash("sha256")
        .update(
          fs.readFileSync(path.join(PWD, "dist/functions/hello-world.zip")),
        )
        .digest("base64"),
      role: lambdaRole.arn,
      filename: path.join(PWD, "dist/functions/hello-world.zip"),
      environment: {
        variables: {
          FUNCTION_NAME: `${APP_NAME}_hello-world-lambda`,
        },
      },
    });

    Aspects.of(this).add(
      new LambdaLayerInstrumentAspect(instrumentationLayer.arn),
    );
  }
}

const app = new App();
new SelfInstrumentingStack(app, "self-instrumenting-lambda-demo");
app.synth();
