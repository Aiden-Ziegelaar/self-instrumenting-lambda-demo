import { patchCommonJSHandler } from "./patcher";
import { wrapHandler } from "./apikey-lambda-layer";
import {
  APIGatewayProxyEventV2,
  APIGatewayEventRequestContextV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";

export const handler = patchCommonJSHandler<
  APIGatewayProxyEventV2,
  APIGatewayEventRequestContextV2,
  APIGatewayProxyStructuredResultV2 | Promise<APIGatewayProxyStructuredResultV2>
>(wrapHandler, process.env.USER_HANDLER);
