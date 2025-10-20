import type { TechStack } from '../../types/index.js';
import type { IToolInjector, InjectorResult } from './index.js';

export class MockInjector implements IToolInjector {
  async inject(techStack: TechStack, projectName: string): Promise<InjectorResult> {
    const result: InjectorResult = {
      files: {},
      devDependencies: {},
      scripts: {}
    };

    // Mock 相关依赖
    result.devDependencies!['mockjs'] = '^1.1.0';
    result.devDependencies!['@types/mockjs'] = '^1.0.10';

    if (techStack.builder === 'vite') {
      result.devDependencies!['vite-plugin-mock'] = '^3.0.1';
    } else if (techStack.builder === 'webpack') {
      result.devDependencies!['webpack-dev-server'] = '^4.15.1';
    }

    // 生成 Mock 配置文件
    result.files['mock/index.ts'] = this.generateMockIndex();
    result.files['mock/user.ts'] = this.generateUserMock();
    result.files['mock/api.ts'] = this.generateApiMock();

    if (techStack.builder === 'vite') {
      result.files['mock/vite-plugin-mock.ts'] = this.generateViteMockPlugin();
    }

    // 添加脚本
    result.scripts!['mock'] = 'node mock/server.js';

    return result;
  }

  isRequired(techStack: TechStack): boolean {
    // Mock 服务是可选的，通常在开发环境中使用
    return false;
  }

  private generateMockIndex(): string {
    return `import Mock from 'mockjs';
import userAPI from './user';
import apiMocks from './api';

// 设置延迟时间
Mock.setup({
  timeout: '200-600'
});

// 注册用户相关接口
userAPI.forEach(item => {
  Mock.mock(item.url, item.type, item.response);
});

// 注册其他 API 接口
apiMocks.forEach(item => {
  Mock.mock(item.url, item.type, item.response);
});

export default Mock;
`;
  }

  private generateUserMock(): string {
    return `import { MockMethod } from 'vite-plugin-mock';

const userAPI: MockMethod[] = [
  {
    url: '/api/user/login',
    method: 'post',
    response: ({ body }) => {
      const { username, password } = body;
      
      if (username === 'admin' && password === '123456') {
        return {
          code: 200,
          message: '登录成功',
          data: {
            token: 'mock-token-' + Date.now(),
            userInfo: {
              id: 1,
              username: 'admin',
              nickname: '管理员',
              avatar: 'https://via.placeholder.com/100x100',
              email: 'admin@example.com',
              roles: ['admin']
            }
          }
        };
      } else {
        return {
          code: 400,
          message: '用户名或密码错误',
          data: null
        };
      }
    }
  },
  {
    url: '/api/user/info',
    method: 'get',
    response: () => {
      return {
        code: 200,
        message: '获取用户信息成功',
        data: {
          id: 1,
          username: 'admin',
          nickname: '管理员',
          avatar: 'https://via.placeholder.com/100x100',
          email: 'admin@example.com',
          roles: ['admin'],
          permissions: ['read', 'write', 'delete']
        }
      };
    }
  },
  {
    url: '/api/user/logout',
    method: 'post',
    response: () => {
      return {
        code: 200,
        message: '退出登录成功',
        data: null
      };
    }
  }
];

export default userAPI;
`;
  }

  private generateApiMock(): string {
    return `import { MockMethod } from 'vite-plugin-mock';

const apiMocks: MockMethod[] = [
  {
    url: '/api/list',
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10 } = query;
      
      const list = Array.from({ length: Number(pageSize) }, (_, index) => ({
        id: (Number(page) - 1) * Number(pageSize) + index + 1,
        title: \`标题 \${(Number(page) - 1) * Number(pageSize) + index + 1}\`,
        content: \`这是第 \${(Number(page) - 1) * Number(pageSize) + index + 1} 条数据的内容\`,
        status: Math.random() > 0.5 ? 'active' : 'inactive',
        createTime: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
        updateTime: new Date().toISOString()
      }));

      return {
        code: 200,
        message: '获取列表成功',
        data: {
          list,
          total: 100,
          page: Number(page),
          pageSize: Number(pageSize)
        }
      };
    }
  },
  {
    url: '/api/item/:id',
    method: 'get',
    response: ({ query }) => {
      const { id } = query;
      
      return {
        code: 200,
        message: '获取详情成功',
        data: {
          id: Number(id),
          title: \`标题 \${id}\`,
          content: \`这是第 \${id} 条数据的详细内容\`,
          status: 'active',
          createTime: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
          updateTime: new Date().toISOString(),
          tags: ['标签1', '标签2', '标签3'],
          author: {
            id: 1,
            name: '作者名称',
            avatar: 'https://via.placeholder.com/50x50'
          }
        }
      };
    }
  }
];

export default apiMocks;
`;
  }

  private generateViteMockPlugin(): string {
    return `import { viteMockServe } from 'vite-plugin-mock';

export function createMockPlugin(isBuild: boolean) {
  return viteMockServe({
    mockPath: 'mock',
    localEnabled: !isBuild,
    prodEnabled: isBuild,
    supportTs: true,
    logger: true,
    injectCode: \`
      import { setupProdMockServer } from './mockProdServer';
      setupProdMockServer();
    \`
  });
}
`;
  }
}