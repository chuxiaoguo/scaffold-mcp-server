import { Card, Button, Typography, Space } from 'antd';
import { HomeOutlined, TableOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';

const { Title, Text } = Typography;

const TablePage: React.FC = () => {
  return (
    <PageContainer ghost>
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <Title level={2} className="text-center mb-4">
            <TableOutlined className="mr-2" />
            表格页面
          </Title>
          
          <div className="text-center mb-6">
            <Text className="text-lg">
              这里可以展示数据表格、列表等内容
            </Text>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <Title level={4} className="mb-4">📊 功能特性</Title>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded border">
                <Text strong>ProTable 组件</Text>
                <br />
                <Text type="secondary">高级表格组件，支持搜索、筛选、排序</Text>
              </div>
              <div className="bg-white p-4 rounded border">
                <Text strong>CRUD 操作</Text>
                <br />
                <Text type="secondary">完整的增删改查功能</Text>
              </div>
              <div className="bg-white p-4 rounded border">
                <Text strong>数据导出</Text>
                <br />
                <Text type="secondary">支持 Excel、CSV 等格式导出</Text>
              </div>
              <div className="bg-white p-4 rounded border">
                <Text strong>权限控制</Text>
                <br />
                <Text type="secondary">基于角色的访问控制</Text>
              </div>
            </div>
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
                onClick={() => history.push('/access')}
                size="large"
              >
                查看权限页面
              </Button>
            </Space>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

export default TablePage;
