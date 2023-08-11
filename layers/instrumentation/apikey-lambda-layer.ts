import { createHash, timingSafeEqual } from "crypto";
import { TLambdaFunction } from "./patcher";
import {
  APIGatewayProxyEventV2,
  APIGatewayEventRequestContextV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";

type THandler = TLambdaFunction<
  APIGatewayProxyEventV2,
  APIGatewayEventRequestContextV2,
  APIGatewayProxyStructuredResultV2 | Promise<APIGatewayProxyStructuredResultV2>
>;

export function wrapHandler(userHandler: THandler): THandler {
  const API_KEY = process.env.API_KEY;
  const API_KEY_HEADER = "apikey";

  if (!API_KEY) {
    throw new Error("No api key parameter provided, in env var API_KEY");
  }
  const apikeyHash = createHash("sha256").update(API_KEY).digest();
  return async function handler(
    event: APIGatewayProxyEventV2,
    context: APIGatewayEventRequestContextV2,
  ): Promise<APIGatewayProxyStructuredResultV2> {
    const authorization = event.headers[API_KEY_HEADER] || "";
    const authorizationHash = createHash("sha256")
      .update(authorization)
      .digest();

    if (timingSafeEqual(authorizationHash, apikeyHash)) {
      return await userHandler(event, context);
    }

    return {
      statusCode: 401,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Unauthorized",
      }),
    };
  };
}
