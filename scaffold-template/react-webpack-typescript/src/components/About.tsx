import React from 'react'
import { Card, Button, Alert } from 'antd'
import { Link } from 'react-router-dom'

const About: React.FC = () => {
  return (
    <div className="p-6">
      <Card 
        title="About React App" 
        className="max-w-md mx-auto"
        extra={<Link to="/"><Button type="primary">Home</Button></Link>}
      >
        <div className="text-center space-y-4">
          <p className="text-gray-600">
            This is a React application with modern tooling.
          </p>
          
          <Alert
            message="Tech Stack"
            description={
              <ul className="text-left space-y-1 mt-2">
                <li>React 18</li>
                <li>TypeScript</li>
                <li>Webpack (via CRA)</li>
                <li>React Router</li>
                <li>Redux Toolkit</li>
                <li>Ant Design</li>
                <li>Tailwind CSS</li>
              </ul>
            }
            type="info"
            showIcon
          />
        </div>
      </Card>
    </div>
  )
}

export default About