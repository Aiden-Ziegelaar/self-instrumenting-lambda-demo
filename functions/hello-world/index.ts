import {
  APIGatewayProxyEventV2,
  APIGatewayEventRequestContextV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";

export function handler(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _event: APIGatewayProxyEventV2,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context: APIGatewayEventRequestContextV2,
): APIGatewayProxyStructuredResultV2 {
  return {
    body: JSON.stringify({
      message: "Hello world!",
    }),
    statusCode: 200,
  };
}
