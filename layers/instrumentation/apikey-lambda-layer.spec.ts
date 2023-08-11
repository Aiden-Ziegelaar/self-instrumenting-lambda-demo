import {
  APIGatewayProxyEventV2,
  APIGatewayEventRequestContextV2,
} from "aws-lambda";
import { wrapHandler } from "./apikey-lambda-layer";

describe("API Key Lambda Layer", () => {
  const env = process.env;

  afterEach(() => {
    process.env = env;
  });

  it("Should throw error on no API Key parameter", () => {
    // Arrange
    process.env = {};
    const fnToWrap = jest.fn();
    const wrappedFn = async () => wrapHandler(fnToWrap);
    //Act
    //Assert
    expect(wrappedFn).rejects.toThrow(/API_KEY/);
  });

  it("Should return 401 on invalid key", async () => {
    //Arrange
    process.env = {
      API_KEY: "a_cool_api_key",
    };
    const fnToWrap = jest.fn();
    const wrappedFn = wrapHandler(fnToWrap);
    //Act
    const result = await wrappedFn(
      {
        headers: {
          apikey: "a_different_cool_api_key",
        },
      } as Partial<APIGatewayProxyEventV2> as APIGatewayProxyEventV2,
      {} as Partial<APIGatewayEventRequestContextV2> as APIGatewayEventRequestContextV2,
    );
    //Assert
    expect(fnToWrap).not.toBeCalled();
    expect(result.statusCode).toBe(401);
  });

  it("Should return 401 on no headers", async () => {
    //Arrange
    process.env = {
      API_KEY: "a_cool_api_key",
    };
    const fnToWrap = jest.fn();
    const wrappedFn = wrapHandler(fnToWrap);
    //Act
    const result = await wrappedFn(
      {
        headers: {},
      } as Partial<APIGatewayProxyEventV2> as APIGatewayProxyEventV2,
      {} as Partial<APIGatewayEventRequestContextV2> as APIGatewayEventRequestContextV2,
    );
    //Assert
    expect(fnToWrap).not.toBeCalled();
    expect(result.statusCode).toBe(401);
  });

  it("Should return 200 on valid key with implicit port", async () => {
    //Arrange
    process.env = {
      API_KEY: "a_cool_api_key",
    };
    const fnToWrap = jest.fn(() => {
      return {
        statusCode: 200,
      };
    });
    const wrappedFn = wrapHandler(fnToWrap);
    //Act
    const result = await wrappedFn(
      {
        headers: {
          apikey: "a_cool_api_key",
        },
      } as Partial<APIGatewayProxyEventV2> as APIGatewayProxyEventV2,
      {} as Partial<APIGatewayEventRequestContextV2> as APIGatewayEventRequestContextV2,
    );
    //Assert
    expect(fnToWrap).toBeCalled();
    expect(result.statusCode).toBe(200);
  });
});
