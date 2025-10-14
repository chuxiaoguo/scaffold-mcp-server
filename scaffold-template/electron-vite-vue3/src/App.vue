<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-semibold text-gray-900">Electron + Vue 3 + TS</h1>
          </div>
          <div class="flex items-center space-x-4">
            <router-link to="/" class="text-gray-700 hover:text-blue-600">Home</router-link>
            <router-link to="/about" class="text-gray-700 hover:text-blue-600">About</router-link>
          </div>
        </div>
      </div>
    </nav>
    
    <main class="py-8">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
// Electron App component with navigation
</script>
