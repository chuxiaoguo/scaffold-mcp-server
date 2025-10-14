<template>
  <div class="home p-6">
    <el-card class="max-w-md mx-auto">
      <template #header>
        <div class="card-header flex justify-between items-center">
          <span class="text-lg font-semibold">Electron + Vue 3 + TypeScript</span>
        </div>
      </template>
      
      <div class="text-center space-y-4">
        <p class="text-gray-600">This is an Electron app with Vue 3, Element Plus and Tailwind CSS.</p>
        
        <div class="space-y-2">
          <p>Counter: {{ counter.count }}</p>
          <p>Double Count: {{ counter.doubleCount }}</p>
          
          <div class="space-x-2">
            <el-button type="primary" @click="counter.increment">
              <el-icon><Plus /></el-icon>
              Increment
            </el-button>
            <el-button @click="counter.decrement">
              <el-icon><Minus /></el-icon>
              Decrement
            </el-button>
          </div>
        </div>
        
        <router-link to="/about">
          <el-button type="success">Go to About</el-button>
        </router-link>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { Plus, Minus } from '@element-plus/icons-vue'
import { useCounterStore } from '../stores/counter'

const counter = useCounterStore()
</script>