import {
  VersionChecker,
  type TemplateConfig,
  type RemoteConfig,
} from "../../../core/templateManager/VersionChecker";
import * as fs from "fs/promises";
import * as path from "path";

// Mock fs module
jest.mock("fs/promises");
const mockFs = fs as jest.Mocked<typeof fs>;

describe("VersionChecker", () => {
  let versionChecker: VersionChecker;
  const testConfigPath = "/test/config/path";

  beforeEach(() => {
    versionChecker = new VersionChecker(testConfigPath);
    jest.clearAllMocks();
  });

  describe("Constructor", () => {
    it("should create instance with custom config path", () => {
      const customPath = "/custom/path";
      const checker = new VersionChecker(customPath);
      expect(checker).toBeInstanceOf(VersionChecker);
    });

    it("should create instance with default config path", () => {
      const checker = new VersionChecker();
      expect(checker).toBeInstanceOf(VersionChecker);
    });
  });

  describe("getLocalConfig", () => {
    it("should return local config when file exists", async () => {
      const mockConfig: TemplateConfig = {
        version: "1.0.0",
        lastUpdated: "2023-01-01T00:00:00.000Z",
        templates: { template1: {}, template2: {} },
        remoteConfig: {
          enabled: true,
          repository: {
            url: "https://github.com/test/repo",
            branch: "main",
            targetFolder: "templates",
          },
          checkInterval: "3600000",
          fallbackToLocal: true,
        },
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockConfig));

      const result = await versionChecker.getLocalConfig();
      expect(result).toEqual(mockConfig);
      expect(mockFs.readFile).toHaveBeenCalledWith(testConfigPath, "utf-8");
    });

    it("should return null when file does not exist", async () => {
      mockFs.readFile.mockRejectedValue(
        new Error("ENOENT: no such file or directory")
      );

      const result = await versionChecker.getLocalConfig();
      expect(result).toBeNull();
    });

    it("should return null when JSON is invalid", async () => {
      mockFs.readFile.mockResolvedValue("invalid json");

      const result = await versionChecker.getLocalConfig();
      expect(result).toBeNull();
    });
  });

  describe("getRemoteConfig", () => {
    it("should return null when remote config is disabled", async () => {
      const mockConfig: TemplateConfig = {
        version: "1.0.0",
        lastUpdated: "2023-01-01T00:00:00.000Z",
        templates: { template1: {} },
        remoteConfig: {
          enabled: false,
          repository: {
            url: "https://github.com/test/repo",
            branch: "main",
            targetFolder: "templates",
          },
          checkInterval: "3600000",
          fallbackToLocal: true,
        },
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockConfig));

      const result = await versionChecker.getRemoteConfig();
      expect(result).toBeNull();
    });

    it("should return null when local config is missing", async () => {
      mockFs.readFile.mockRejectedValue(
        new Error("ENOENT: no such file or directory")
      );

      const result = await versionChecker.getRemoteConfig();
      expect(result).toBeNull();
    });
  });

  describe("updateLocalConfig", () => {
    it("should update local config successfully", async () => {
      const newConfig: TemplateConfig = {
        version: "2.0.0",
        lastUpdated: "2023-02-01T00:00:00.000Z",
        templates: { template1: {}, template2: {}, template3: {} },
        remoteConfig: {
          enabled: true,
          repository: {
            url: "https://github.com/test/repo",
            branch: "main",
            targetFolder: "templates",
          },
          checkInterval: "3600000",
          fallbackToLocal: true,
        },
      };

      mockFs.writeFile.mockResolvedValue(undefined);

      const result = await versionChecker.updateLocalConfig(newConfig);

      expect(result).toBe(true);
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        testConfigPath,
        JSON.stringify(newConfig, null, 2),
        "utf-8"
      );
    });

    it("should return false when write fails", async () => {
      const newConfig: TemplateConfig = {
        version: "2.0.0",
        lastUpdated: "2023-02-01T00:00:00.000Z",
        templates: { template1: {} },
        remoteConfig: {
          enabled: false,
          repository: {
            url: "",
            branch: "main",
            targetFolder: "templates",
          },
          checkInterval: "3600000",
          fallbackToLocal: true,
        },
      };

      mockFs.writeFile.mockRejectedValue(new Error("Write failed"));

      const result = await versionChecker.updateLocalConfig(newConfig);
      expect(result).toBe(false);
    });
  });

  describe("checkForUpdates", () => {
    it("should return default version info when local config is missing", async () => {
      mockFs.readFile.mockRejectedValue(
        new Error("ENOENT: no such file or directory")
      );

      const result = await versionChecker.checkForUpdates();

      expect(result.version).toBe("0.0.0");
      expect(result.needsUpdate).toBe(false);
      expect(result.lastUpdated).toBeDefined();
    });

    it("should return local version info when remote config is not available", async () => {
      const localConfig: TemplateConfig = {
        version: "1.0.0",
        lastUpdated: "2023-01-01T00:00:00.000Z",
        templates: { template1: {} },
        remoteConfig: {
          enabled: false,
          repository: {
            url: "https://github.com/test/repo",
            branch: "main",
            targetFolder: "templates",
          },
          checkInterval: "3600000",
          fallbackToLocal: true,
        },
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(localConfig));

      const result = await versionChecker.checkForUpdates();

      expect(result.version).toBe("1.0.0");
      expect(result.lastUpdated).toBe("2023-01-01T00:00:00.000Z");
      expect(result.needsUpdate).toBe(false);
    });
  });

  describe("getConfigPath", () => {
    it("should return the config path", () => {
      const result = versionChecker.getConfigPath();
      expect(result).toBe(testConfigPath);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty config files", async () => {
      mockFs.readFile.mockResolvedValue("");

      const result = await versionChecker.getLocalConfig();
      expect(result).toBeNull();
    });

    it("should handle config files with null values", async () => {
      const configWithNulls = {
        version: null,
        lastUpdated: null,
        templates: null,
        remoteConfig: null,
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(configWithNulls));

      const result = await versionChecker.getLocalConfig();
      expect(result).toEqual(configWithNulls);
    });
  });
});
