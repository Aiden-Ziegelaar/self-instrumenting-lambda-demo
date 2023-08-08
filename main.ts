import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";

class SelfInstrumentingStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
     
  }
}

const app = new App();
new SelfInstrumentingStack(app, "self-instrumenting-lambda-demo");
app.synth();
