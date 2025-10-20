import {
  ErrorHandler,
  ErrorType,
  ErrorSeverity,
  ScaffoldError,
  safeExecute,
  safeExecuteSync,
  handleError,
} from "../../utils/errorHandler";

describe("ScaffoldError", () => {
  it("should create error with all properties", () => {
    const error = new ScaffoldError(
      "Test error",
      ErrorType.VALIDATION,
      ErrorSeverity.MEDIUM,
      "test-context",
      new Error("Original error")
    );

    expect(error.message).toBe("Test error");
    expect(error.type).toBe(ErrorType.VALIDATION);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(error.context).toBe("test-context");
    expect(error.originalError).toBeInstanceOf(Error);
    expect(error.timestamp).toBeDefined();
    expect(error.name).toBe("ScaffoldError");
  });

  it("should serialize to JSON correctly", () => {
    const error = new ScaffoldError(
      "Test error",
      ErrorType.TEMPLATE,
      ErrorSeverity.HIGH,
      "test-context"
    );

    const serialized = error.toJSON();
    expect(serialized.message).toBe("Test error");
    expect(serialized.type).toBe(ErrorType.TEMPLATE);
    expect(serialized.severity).toBe(ErrorSeverity.HIGH);
    expect(serialized.context).toBe("test-context");
    expect(serialized.timestamp).toBeDefined();
    expect(serialized.stack).toBeDefined();
  });
});

describe("ErrorHandler", () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = ErrorHandler.getInstance();
    errorHandler.clearStats();
  });

  afterEach(() => {
    errorHandler.clearStats();
  });

  describe("Singleton Pattern", () => {
    it("should return the same instance", () => {
      const handler1 = ErrorHandler.getInstance();
      const handler2 = ErrorHandler.getInstance();
      expect(handler1).toBe(handler2);
    });
  });

  describe("Error Handling", () => {
    it("should handle ScaffoldError", () => {
      const error = new ScaffoldError("Test error", ErrorType.VALIDATION);
      const result = errorHandler.handle(error);

      expect(result).toBeInstanceOf(ScaffoldError);
      expect(result.message).toBe("Test error");
      expect(result.type).toBe(ErrorType.VALIDATION);
    });

    it("should handle regular Error objects", () => {
      const error = new Error("Regular error");
      const result = errorHandler.handle(error);

      expect(result).toBeInstanceOf(ScaffoldError);
      expect(result.message).toBe("Regular error");
      expect(result.type).toBe(ErrorType.UNKNOWN);
    });
  });

  describe("Error Creation Methods", () => {
    it("should create validation error", () => {
      const error = errorHandler.createValidationError(
        "Validation failed",
        "test-context"
      );
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.message).toBe("Validation failed");
      expect(error.context).toBe("test-context");
    });

    it("should create network error", () => {
      const error = errorHandler.createNetworkError(
        "Network failed",
        "test-context"
      );
      expect(error.type).toBe(ErrorType.NETWORK);
      expect(error.message).toBe("Network failed");
      expect(error.context).toBe("test-context");
    });

    it("should create file system error", () => {
      const error = errorHandler.createFileSystemError(
        "File not found",
        "test-context"
      );
      expect(error.type).toBe(ErrorType.FILE_SYSTEM);
      expect(error.message).toBe("File not found");
      expect(error.context).toBe("test-context");
    });

    it("should create template error", () => {
      const error = errorHandler.createTemplateError(
        "Template invalid",
        "test-context"
      );
      expect(error.type).toBe(ErrorType.TEMPLATE);
      expect(error.message).toBe("Template invalid");
      expect(error.context).toBe("test-context");
    });

    it("should create configuration error", () => {
      const error = errorHandler.createConfigurationError(
        "Config invalid",
        "test-context"
      );
      expect(error.type).toBe(ErrorType.CONFIGURATION);
      expect(error.message).toBe("Config invalid");
      expect(error.context).toBe("test-context");
    });
  });

  describe("Error Statistics", () => {
    beforeEach(() => {
      errorHandler.handle(new ScaffoldError("Error 1", ErrorType.VALIDATION));
      errorHandler.handle(new ScaffoldError("Error 2", ErrorType.VALIDATION));
      errorHandler.handle(new ScaffoldError("Error 3", ErrorType.NETWORK));
      errorHandler.handle(new Error("Regular error"));
    });

    it("should track error statistics correctly", () => {
      const stats = errorHandler.getErrorStats();
      expect(stats[ErrorType.VALIDATION]).toBe(2);
      expect(stats[ErrorType.NETWORK]).toBe(1);
      expect(stats[ErrorType.UNKNOWN]).toBe(1);
    });

    it("should clear statistics", () => {
      let stats = errorHandler.getErrorStats();
      expect(stats[ErrorType.VALIDATION]).toBe(2);

      errorHandler.clearStats();
      stats = errorHandler.getErrorStats();
      expect(stats[ErrorType.VALIDATION]).toBe(0);
      expect(stats[ErrorType.NETWORK]).toBe(0);
      expect(stats[ErrorType.UNKNOWN]).toBe(0);
    });
  });
});

describe("Global Functions", () => {
  describe("safeExecute", () => {
    it("should execute async function successfully", async () => {
      const asyncFn = async () => "success";
      const result = await safeExecute(asyncFn, "test-context", "fallback");
      expect(result.success).toBe(true);
      expect(result.data).toBe("success");
      expect(result.error).toBeUndefined();
    });

    it("should return fallback on error", async () => {
      const asyncFn = async () => {
        throw new Error("Async error");
      };
      const result = await safeExecute(asyncFn, "test-context", "fallback");
      expect(result.success).toBe(false);
      expect(result.data).toBe("fallback");
      expect(result.error).toBeInstanceOf(ScaffoldError);
    });

    it("should handle promise rejection", async () => {
      const asyncFn = async () => Promise.reject(new Error("Rejected"));
      const result = await safeExecute(asyncFn, "test-context", "fallback");
      expect(result.success).toBe(false);
      expect(result.data).toBe("fallback");
      expect(result.error).toBeInstanceOf(ScaffoldError);
    });
  });

  describe("safeExecuteSync", () => {
    it("should execute sync function successfully", () => {
      const syncFn = () => "success";
      const result = safeExecuteSync(syncFn, "test-context", "fallback");
      expect(result.success).toBe(true);
      expect(result.data).toBe("success");
      expect(result.error).toBeUndefined();
    });

    it("should return fallback on error", () => {
      const syncFn = () => {
        throw new Error("Sync error");
      };
      const result = safeExecuteSync(syncFn, "test-context", "fallback");
      expect(result.success).toBe(false);
      expect(result.data).toBe("fallback");
      expect(result.error).toBeInstanceOf(ScaffoldError);
    });

    it("should handle undefined return", () => {
      const syncFn = () => undefined;
      const result = safeExecuteSync(syncFn, "test-context", "fallback");
      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
      expect(result.error).toBeUndefined();
    });
  });

  describe("handleError", () => {
    it("should handle error and return ScaffoldError", () => {
      const error = new Error("Test error");
      const result = handleError(error, "test-context");

      expect(result).toBeInstanceOf(ScaffoldError);
      expect(result.message).toBe("Test error");
      expect(result.context).toBe("test-context");
    });

    it("should handle ScaffoldError directly", () => {
      const scaffoldError = new ScaffoldError(
        "Scaffold error",
        ErrorType.VALIDATION,
        ErrorSeverity.HIGH,
        "test-context"
      );
      const result = handleError(scaffoldError, "test-context");

      expect(result).toBe(scaffoldError);
      expect(result.type).toBe(ErrorType.VALIDATION);
    });
  });
});
