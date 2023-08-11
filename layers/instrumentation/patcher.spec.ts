import { patchCommonJSHandler, TLambdaWrapper } from "./patcher";

describe("Wrapper Lambda Layer", () => {
  const env = process.env;

  afterEach(() => {
    process.env = env;
  });

  it("Should throw on bad handler string", () => {
    // Arrange
    const wrappedFn = jest.fn();
    const lambdaHandler = "BadLambdaHandler";
    const wrapperFn: TLambdaWrapper<unknown, unknown, unknown> = () => {
      return wrappedFn;
    };
    //Act
    const fn = () =>
      patchCommonJSHandler<unknown, unknown, unknown>(wrapperFn, lambdaHandler);
    //Assert
    expect(fn).toThrow(/Improperly formatted handler string/);
  });

  it("Should throw on bad task route", () => {
    // Arrange
    const wrappedFn = jest.fn();
    const lambdaHandler = "nonExistant.cjs";
    const wrapperFn: TLambdaWrapper<unknown, unknown, unknown> = () => {
      return wrappedFn;
    };
    process.env = {
      LAMBDA_TASK_ROOT: "layers/instrumentation/fixtures",
    };
    //Act
    const fn = () =>
      patchCommonJSHandler<unknown, unknown, unknown>(wrapperFn, lambdaHandler);
    //Assert
    expect(fn).toThrow(/Unable to resolve module file/);
  });

  it("Should throw on handler not existing", () => {
    // Arrange
    const wrappedFn = jest.fn();
    const lambdaHandler = "handlerNotNamed.handler";
    const wrapperFn: TLambdaWrapper<unknown, unknown, unknown> = () => {
      return wrappedFn;
    };
    process.env = {
      LAMBDA_TASK_ROOT: "layers/instrumentation/fixtures",
    };
    //Act
    const fn = () =>
      patchCommonJSHandler<unknown, unknown, unknown>(wrapperFn, lambdaHandler);
    //Assert
    expect(fn).toThrow(/Handler 'handler' missing on module/);
  });

  it("Should throw on handler not being function", () => {
    // Arrange
    const wrappedFn = jest.fn();
    const lambdaHandler = "handlerNotFunction.handler";
    const wrapperFn: TLambdaWrapper<unknown, unknown, unknown> = () => {
      return wrappedFn;
    };
    process.env = {
      LAMBDA_TASK_ROOT: "layers/instrumentation/fixtures",
    };
    //Act
    const fn = () =>
      patchCommonJSHandler<unknown, unknown, unknown>(wrapperFn, lambdaHandler);
    //Assert
    expect(fn).toThrow(/is not a function/);
  });

  it("Should throw on handler being undefined", () => {
    // Arrange
    const wrappedFn = jest.fn();
    const lambdaHandler: string | undefined = undefined;
    const wrapperFn: TLambdaWrapper<unknown, unknown, unknown> = () => {
      return wrappedFn;
    };
    process.env = {
      LAMBDA_TASK_ROOT: "layers/instrumentation/fixtures",
    };
    //Act
    const fn = () =>
      patchCommonJSHandler<unknown, unknown, unknown>(wrapperFn, lambdaHandler);
    //Assert
    expect(fn).toThrow(/handlerPath is required./);
  });

  it("Should return handler on success", () => {
    // Arrange
    const wrappedFn = jest.fn();
    const lambdaHandler = "handler.handler";
    const wrapperFn: TLambdaWrapper<unknown, unknown, unknown> = (fn) => {
      wrappedFn();
      return fn;
    };
    process.env = {
      LAMBDA_TASK_ROOT: "layers/instrumentation/fixtures",
    };
    //Act
    const patchedFunction = patchCommonJSHandler<unknown, unknown, unknown>(
      wrapperFn,
      lambdaHandler,
    );
    patchedFunction({}, {});
    //Assert
    expect(wrappedFn).toBeCalled();
  });
});
