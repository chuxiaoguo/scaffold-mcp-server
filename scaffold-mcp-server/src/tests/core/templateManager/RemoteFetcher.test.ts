import { RemoteFetcher, type FetchResult, type RemoteFetcherConfig, type ValidationResult } from '../../../core/templateManager/RemoteFetcher';

describe('RemoteFetcher', () => {
  const mockConfig: RemoteFetcherConfig = {
    enabled: true,
    repository: 'https://github.com/test/repo.git',
    branch: 'main',
    targetFolder: 'templates',
    checkInterval: 3600000,
    fallbackToLocal: true
  };

  const destinationPath = '/test/destination';

  describe('validateRemoteConfig', () => {
    it('should validate valid config', () => {
      const result = RemoteFetcher.validateRemoteConfig(mockConfig);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject config with empty repository', () => {
      const invalidConfig = { ...mockConfig, repository: '' };
      const result = RemoteFetcher.validateRemoteConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('仓库地址不能为空');
    });

    it('should reject config with empty branch', () => {
      const invalidConfig = { ...mockConfig, branch: '' };
      const result = RemoteFetcher.validateRemoteConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('分支名称不能为空');
    });

    it('should reject config with empty target folder', () => {
      const invalidConfig = { ...mockConfig, targetFolder: '' };
      const result = RemoteFetcher.validateRemoteConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('目标文件夹不能为空');
    });

    it('should reject negative check interval', () => {
      const invalidConfig = { ...mockConfig, checkInterval: -1 };
      const result = RemoteFetcher.validateRemoteConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('检查间隔不能为负数');
    });
  });

  describe('fetchRemoteTemplates', () => {
    it('should handle disabled config', async () => {
      const disabledConfig = { ...mockConfig, enabled: false };

      const result = await RemoteFetcher.fetchRemoteTemplates(disabledConfig, destinationPath);

      expect(result.success).toBe(false);
      expect(result.message).toContain('远程拉取功能已禁用');
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in repository URL', () => {
      const specialConfig = {
        ...mockConfig,
        repository: 'https://github.com/user/repo-with-special-chars_123.git'
      };

      const result = RemoteFetcher.validateRemoteConfig(specialConfig);
      expect(result.valid).toBe(true);
    });

    it('should handle different branch names', () => {
      const branchConfig = { ...mockConfig, branch: 'feature/new-templates' };
      const result = RemoteFetcher.validateRemoteConfig(branchConfig);
      expect(result.valid).toBe(true);
    });

    it('should handle nested target folders', () => {
      const nestedConfig = { ...mockConfig, targetFolder: 'src/templates/components' };
      const result = RemoteFetcher.validateRemoteConfig(nestedConfig);
      expect(result.valid).toBe(true);
    });

    it('should handle very long repository URLs', () => {
      const longUrl = 'https://github.com/' + 'a'.repeat(100) + '/repo.git';
      const longConfig = { ...mockConfig, repository: longUrl };
      const result = RemoteFetcher.validateRemoteConfig(longConfig);
      expect(result.valid).toBe(true);
    });
  });
});