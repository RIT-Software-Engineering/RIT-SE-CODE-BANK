const errorHandler = require("../middleware/errorHandler");

describe("Express errorHandler middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { originalUrl: "/api/test" };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it("includes stack trace in development mode", () => {
    process.env.NODE_ENV = "development";
    const err = new Error("Test error");
    err.statusCode = 500;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    const json = res.json.mock.calls[0][0];
    expect(json.error).toBe("Test error");
    expect(json.statusCode).toBe(500);
    expect(json.url).toBe("/api/test");
    expect(json.stack).toBeDefined();
  });

  it("hides stack trace in production mode", () => {
    process.env.NODE_ENV = "production";
    const err = new Error("Prod error");
    err.statusCode = 400;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    const json = res.json.mock.calls[0][0];
    expect(json.error).toBe("Prod error");
    expect(json.statusCode).toBe(400);
    expect(json.url).toBe("/api/test");
    expect(json.stack).toBeUndefined();
  });

  it("defaults to 500 if statusCode is missing", () => {
    process.env.NODE_ENV = "production";
    const err = new Error("Missing code error");

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    const json = res.json.mock.calls[0][0];
    expect(json.statusCode).toBe(500);
  });

  it("defaults to generic message if error.message is missing", () => {
    process.env.NODE_ENV = "production";
    const err = { statusCode: 500 }; // no message

    errorHandler(err, req, res, next);

    const json = res.json.mock.calls[0][0];
    expect(json.error).toBe("Internal Server Error");
  });

  it("always includes the original request URL", () => {
    process.env.NODE_ENV = "production";
    const err = new Error("Has URL");
    err.statusCode = 404;

    errorHandler(err, req, res, next);

    const json = res.json.mock.calls[0][0];
    expect(json.url).toBe("/api/test");
  });

  it("always includes a valid ISO timestamp", () => {
    process.env.NODE_ENV = "production";
    const err = new Error("Time test");
    err.statusCode = 400;

    errorHandler(err, req, res, next);

    const json = res.json.mock.calls[0][0];
    expect(new Date(json.timestamp).toString()).not.toBe("Invalid Date");
  });
  
});
