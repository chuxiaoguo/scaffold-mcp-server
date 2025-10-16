import React from 'react';
import { Button } from 'antd';
import './index.less';

const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      <h1>欢迎使用 nima-test</h1>
      <p>这是一个基于 Umi 4 的 React 项目</p>
      <Button type="primary">开始使用</Button>
    </div>
  );
};

export default HomePage;
