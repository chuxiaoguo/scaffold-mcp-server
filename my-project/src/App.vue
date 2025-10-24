<template>
  <div id="app">
    <h1>{{ title }}</h1>
    <p>欢迎使用 Vue 2 项目！</p>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      title: 'my-project'
    }
  }
}
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>