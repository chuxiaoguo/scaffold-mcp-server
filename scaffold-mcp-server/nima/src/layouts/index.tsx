import React from 'react';
import { Outlet } from 'umi';

const Layout: React.FC = () => {
  return (
    <div>
      <header style={{ padding: '16px', background: '#f0f0f0' }}>
        <h2>应用标题</h2>
      </header>
      <main style={{ padding: '16px' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
