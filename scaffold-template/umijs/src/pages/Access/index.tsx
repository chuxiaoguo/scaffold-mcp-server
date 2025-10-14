import { Card, Button, Typography, Space, Alert } from 'antd';
import { HomeOutlined, SafetyOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Access, useAccess } from '@umijs/max';
import { history } from '@umijs/max';

const { Title, Text } = Typography;

const AccessPage: React.FC = () => {
  const access = useAccess();
  
  return (
    <PageContainer ghost>
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <Title level={2} className="text-center mb-4">
            <SafetyOutlined className="mr-2" />
            权限控制示例
          </Title>
          
          <div className="text-center mb-6">
            <Text className="text-lg">
              演示基于角色的访问控制 (RBAC) 功能
            </Text>
          </div>

          <div className="mb-6">
            <Alert
              message="权限说明"
              description="UmiJS 提供了完善的权限控制机制，可以基于用户角色、权限码等进行细粒度的访问控制。"
              type="info"
              showIcon
              className="mb-4"
            />
          </div>

          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <Title level={4} className="mb-4">🔐 权限功能</Title>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded border">
                <Text strong>路由权限</Text>
                <br />
                <Text type="secondary">控制页面访问权限</Text>
              </div>
              <div className="bg-white p-4 rounded border">
                <Text strong>组件权限</Text>
                <br />
                <Text type="secondary">控制组件显示/隐藏</Text>
              </div>
              <div className="bg-white p-4 rounded border">
                <Text strong>按钮权限</Text>
                <br />
                <Text type="secondary">控制操作按钮权限</Text>
              </div>
              <div className="bg-white p-4 rounded border">
                <Text strong>数据权限</Text>
                <br />
                <Text type="secondary">控制数据访问范围</Text>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <Title level={4} className="mb-3">权限演示</Title>
            <Access accessible={access.canSeeAdmin}>
              <Button type="primary" className="mr-2">
                管理员可见按钮
              </Button>
            </Access>
            <Access accessible={!access.canSeeAdmin}>
              <Button disabled>
                普通用户按钮（已禁用）
              </Button>
            </Access>
          </div>

          <div className="text-center">
            <Space size="large">
              <Button 
                type="primary" 
                icon={<HomeOutlined />}
                onClick={() => history.push('/')}
                size="large"
              >
                返回首页
              </Button>
              <Button 
                onClick={() => history.push('/table')}
                size="large"
              >
                查看表格页面
              </Button>
            </Space>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

export default AccessPage;
