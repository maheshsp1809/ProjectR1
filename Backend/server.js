const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());
// Enable JSON parsing
app.use(express.json());

// Todo tasks array
let tasks = [];

// Get all tasks
app.get("/tasks", (req, res) => {
  res.json(tasks);
});

// Add a new task
app.post("/tasks", (req, res) => {
  const { task } = req.body;
  console.log("Received task:", task);
  if (task.trim() !== "") {
    tasks.push(task);
    res.json({ success: true, tasks });
  } else {
    res.status(400).json({ success: false, message: "Task cannot be empty." });
  }
});

// Remove a task
app.delete("/tasks/:index", (req, res) => {
  const { index } = req.params;
  if (index >= 0 && index < tasks.length) {
    tasks.splice(index, 1);
    res.json({ success: true, tasks });
  } else {
    res.status(404).json({ success: false, message: "Task not found." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
