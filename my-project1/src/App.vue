<template>
  <div id="app">
    <h1>{{ title }}</h1>
    <p>欢迎使用 Vue 3 项目！</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const title = ref('my-project1')
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>