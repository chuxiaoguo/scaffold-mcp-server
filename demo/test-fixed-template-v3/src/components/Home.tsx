import React from 'react'
import { Card, Button, Space } from 'antd'
import { PlusOutlined, MinusOutlined } from '@ant-design/icons'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { increment, decrement } from '../store/counterSlice'
import { Link } from 'react-router-dom'

const Home: React.FC = () => {
  const count = useSelector((state: RootState) => state.counter.value)
  const dispatch = useDispatch()

  return (
    <div className="p-6">
      <Card 
        title="React + TypeScript + Webpack" 
        className="max-w-md mx-auto"
        extra={<Link to="/about"><Button type="primary">About</Button></Link>}
      >
        <div className="text-center space-y-4">
          <p className="text-gray-600">
            This is a React app with TypeScript, Ant Design and Tailwind CSS.
          </p>
          
          <div className="space-y-2">
            <p className="text-lg">Counter: {count}</p>
            <p className="text-sm text-gray-500">Double: {count * 2}</p>
            
            <Space>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => dispatch(increment())}
              >
                Increment
              </Button>
              <Button 
                icon={<MinusOutlined />}
                onClick={() => dispatch(decrement())}
              >
                Decrement
              </Button>
            </Space>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Home