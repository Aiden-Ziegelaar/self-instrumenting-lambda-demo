import { IConstruct, Construct } from "constructs";
import { IAspect, Aspects, App, TerraformStack } from "cdktf";
import * as aws from "@cdktf/provider-aws";

const APP_NAME = "self-instrumenting-lambda-demo";

export class LambdaLayerInstrumentAspect implements IAspect {
  constructor(private instrumentationLayerArn: string ) {}

  // This method is called on every Construct within the specified scope (resources, data sources, etc.).
  visit(visited_node: IConstruct) {
    if (visited_node instanceof aws.lambdaFunction.LambdaFunction) {
      let node = visited_node as aws.lambdaFunction.LambdaFunction;
      // We need to take the input value to not create a circular reference
      const currentHandler = node.handler ?? "index.hander";
      const currentLayers = node.layers ?? [];
      const currentEnvironment = node.environment.variables?? {};
      

      node.handler = "instrumentationLayer.handler";
      node.layers = [...currentLayers, this.instrumentationLayerArn];
      node.environment.variables = {
        ...currentEnvironment,
        USER_HANDLER: currentHandler
      };
    }
  }
}

class SelfInstrumentingStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    
    const instrumentationLayer = new aws.lambdaLayerVersion.LambdaLayerVersion(
      this,
      "instrumentation-layer",
      {
        layerName: `${APP_NAME}_instrumentation-layer`,
        compatibleRuntimes: ["nodejs18.x"],
        filename: "dist/instrumentation-layer.zip"
      }
    );

    const lambdaRole = new aws.iamRole.IamRole(
      this,
      "lambda-role",
      {
        name: `${APP_NAME}_lambda-role`,
        assumeRolePolicy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Action: "sts:AssumeRole",
              Principal: {
                Service: "lambda.amazonaws.com"
              },
              Effect: "Allow",
              Sid: "Allow Lambda to assume role"
            }
          ]
        })
      }
    );

    new aws.lambdaFunction.LambdaFunction(
      this,
      "hello-world-lambda",
      {
        functionName: `${APP_NAME}_hello-world-lambda`,
        runtime: "nodejs18.x",
        handler: "index.handler",
        role: lambdaRole.arn
      }
    );

    Aspects.of(this).add(new LambdaLayerInstrumentAspect(instrumentationLayer.arn));
  }
}

const app = new App();
new SelfInstrumentingStack(app, "self-instrumenting-lambda-demo");
app.synth();
