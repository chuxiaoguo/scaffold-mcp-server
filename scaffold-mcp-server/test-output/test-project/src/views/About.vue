<template>
  <div class="about p-6">
    <el-card class="max-w-md mx-auto">
      <template #header>
        <div class="card-header">
          <span class="text-lg font-semibold">About Page</span>
        </div>
      </template>
      
      <div class="text-center space-y-4">
        <p class="text-gray-600">This is the about page demonstrating routing.</p>
        
        <el-alert
          title="Tech Stack"
          type="info"
          :closable="false"
          show-icon
        >
          <ul class="text-left space-y-1">
            <li>Vue 3 with Composition API</li>
            <li>TypeScript</li>
            <li>Vite</li>
            <li>Vue Router</li>
            <li>Pinia</li>
            <li>Element Plus</li>
            <li>Tailwind CSS</li>
          </ul>
        </el-alert>
        
        <router-link to="/">
          <el-button type="primary">Back to Home</el-button>
        </router-link>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
// This page demonstrates Vue 3 Composition API with TypeScript
</script>