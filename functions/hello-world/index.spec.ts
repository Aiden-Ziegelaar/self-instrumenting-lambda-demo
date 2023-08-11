import {
  APIGatewayProxyEventV2,
  APIGatewayEventRequestContextV2,
} from "aws-lambda";
import { handler } from "./index";

describe("Unpatched hello-world test", () => {
  it("Should return 200", async () => {
    const result = handler(
      {} as Partial<APIGatewayProxyEventV2> as APIGatewayProxyEventV2,
      {} as Partial<APIGatewayEventRequestContextV2> as APIGatewayEventRequestContextV2,
    );
    expect(result.statusCode).toBe(200);
  });

  it("Should return 200 with body", async () => {
    const result = handler(
      {} as Partial<APIGatewayProxyEventV2> as APIGatewayProxyEventV2,
      {} as Partial<APIGatewayEventRequestContextV2> as APIGatewayEventRequestContextV2,
    );
    expect(result.body).toBe(JSON.stringify({ message: "Hello world!" }));
  });
});
