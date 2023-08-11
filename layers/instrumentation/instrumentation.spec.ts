describe("Patched handler export", () => {
  const env = process.env;

  afterEach(() => {
    process.env = env;
    delete require.cache[require.resolve("./instrumentation")];
  });

  it("Should be defined as function", () => {
    process.env.USER_HANDLER =
      "layers/instrumentation/fixtures/handler.handler";
    process.env.API_KEY = "a_cool_api_key";
    //eslint-disable-next-line @typescript-eslint/no-var-requires
    const { handler } = require("./instrumentation");
    expect(handler).toBeInstanceOf(Function);
  });
});
