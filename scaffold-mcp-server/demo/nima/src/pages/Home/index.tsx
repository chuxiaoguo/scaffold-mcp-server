import { Card, Button, Space, Typography } from 'antd';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { history } from '@umijs/max';

const { Title, Text } = Typography;

const HomePage: React.FC = () => {
  const { count, increment, decrement } = useModel('counter');

  return (
    <PageContainer ghost>
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="mb-6 shadow-lg">
          <Title level={2} className="text-center mb-4">
            欢迎使用 UmiJS 模板
          </Title>
          <div className="text-center mb-6">
            <Text className="text-lg">
              这是一个基于 UmiJS + Ant Design + Tailwind CSS 的现代化 React 应用模板
            </Text>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <Title level={4}>🚀 技术栈</Title>
              <ul className="list-disc list-inside space-y-1">
                <li>UmiJS - 企业级前端应用框架</li>
                <li>React 18 - 现代化 UI 库</li>
                <li>TypeScript - 类型安全</li>
                <li>Ant Design - 企业级 UI 组件库</li>
                <li>Tailwind CSS - 实用优先的 CSS 框架</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <Title level={4}>📦 特性</Title>
              <ul className="list-disc list-inside space-y-1">
                <li>开箱即用的企业级配置</li>
                <li>内置路由和状态管理</li>
                <li>完善的构建和部署方案</li>
                <li>丰富的插件生态</li>
                <li>响应式设计支持</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="shadow-lg">
          <Title level={3} className="text-center mb-4">
            计数器示例 (DVA 状态管理)
          </Title>
          <div className="text-center">
            <div className="mb-4">
              <Text className="text-2xl font-bold">当前计数: {count}</Text>
            </div>
            <Space size="large">
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={increment}
                size="large"
              >
                增加
              </Button>
              <Button 
                icon={<MinusOutlined />} 
                onClick={decrement}
                size="large"
              >
                减少
              </Button>
            </Space>
            <div className="mt-6">
              <Button 
                type="link" 
                onClick={() => history.push('/table')}
                className="text-lg"
              >
                查看表格页面 →
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

export default HomePage;
