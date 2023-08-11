import fs from "node:fs";
import path from "node:path";

function getHandlerPath(handler: string) {
  const parts = handler.split(".");

  if (parts.length < 2) {
    throw new Error(`Improperly formatted handler string variable: ${handler}`);
  }

  const handlerToWrap = parts[parts.length - 1];
  const moduleToImport = handler.slice(0, handler.lastIndexOf("."));
  return { moduleToImport, handlerToWrap };
}

function getFullyQualifiedModulePath(modulePath: string, extensions: string[]) {
  let fullModulePath;

  extensions.forEach((extension) => {
    const filePath = modulePath + extension;
    if (fs.existsSync(filePath)) {
      fullModulePath = filePath;
      return;
    }
  });

  if (!fullModulePath) {
    throw new Error(
      `Unable to resolve module file at ${modulePath} with the following extensions: ${extensions.join(
        ",",
      )}`,
    );
  }

  return fullModulePath;
}

function getModuleWithRequire(appRoot: string, moduleToImport: string) {
  const modulePath = path.resolve(appRoot, moduleToImport);
  const validExtensions = [".cjs", ".js"];
  const fullModulePath = getFullyQualifiedModulePath(
    modulePath,
    validExtensions,
  );

  return require(fullModulePath);
}

function validateHandlerDefinition(
  userHandler: unknown,
  handlerName: string,
  moduleName: string,
) {
  if (typeof userHandler === "undefined") {
    throw new Error(
      `Handler '${handlerName}' missing on module '${moduleName}'`,
    );
  }

  if (typeof userHandler !== "function") {
    throw new Error(
      `Handler '${handlerName}' from '${moduleName}' is not a function`,
    );
  }
}

function requireHandler(handlerPath: string) {
  const { LAMBDA_TASK_ROOT = "." } = process.env;
  const { moduleToImport, handlerToWrap } = getHandlerPath(handlerPath);

  const userHandler = getModuleWithRequire(LAMBDA_TASK_ROOT, moduleToImport)[
    handlerToWrap
  ];
  validateHandlerDefinition(userHandler, handlerToWrap, moduleToImport);

  return userHandler;
}

export type TLambdaFunction<T, U, V> = (event: T, context: U) => V;

export type TLambdaWrapper<T, U, V> = (
  sourceFn: TLambdaFunction<T, U, V>,
) => TLambdaFunction<T, U, V>;

export function patchCommonJSHandler<T, U, V>(
  wrapperFn: TLambdaWrapper<T, U, V>,
  handlerPath?: string,
) {
  if (!handlerPath) {
    throw new Error(
      "handlerPath is required. Please provide a handler path in the format of 'path/to/module.handler'",
    );
  }
  const userHandler = requireHandler(handlerPath);
  return wrapperFn(userHandler);
}
