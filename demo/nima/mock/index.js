// mocker-api配置
module.exports = {
  "GET /api/users": [
    { id: 1, name: "John Doe", email: "john@example.com" },
    { id: 2, name: "Jane Smith", email: "jane@example.com" },
  ],

  "POST /api/users": (req, res) => {
    const newUser = req.body;
    res.json({
      id: Date.now(),
      ...newUser,
    });
  },

  "GET /api/users/:id": (req, res) => {
    const { id } = req.params;
    res.json({
      id: Number(id),
      name: `User ${id}`,
      email: `user${id}@example.com`,
    });
  },

  // 延迟响应示例
  "GET /api/slow": (req, res) => {
    setTimeout(() => {
      res.json({ message: "This is a slow response" });
    }, 2000);
  },
};
