/**
 * 工具注入器接口
 */
export interface ToolInjector {
  name: string;
  inject(
    files: Record<string, string>,
    packageJson: any
  ): {
    files: Record<string, string>;
    packageJson: any;
  };
}
