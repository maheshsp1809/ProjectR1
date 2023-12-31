const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const http = require("http");
const socketIO = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Mysql4571@",
  database: "todo_app",
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
  } else {
    console.log("Connected to MySQL database");
  }
});

// Get all tasks from the database
app.get("/tasks", (req, res) => {
  db.query("SELECT * FROM todos", (err, results) => {
    if (err) {
      console.error("Error fetching tasks from the database:", err);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    } else {
      const tasks = results.map((row) => ({ id: row.id, task: row.task }));
      res.json({ tasks });
    }
  });
});

// Add a new task to the database
app.post("/tasks", (req, res) => {
  const { task } = req.body;

  if (task.trim() !== "") {
    db.query("INSERT INTO todos (task) VALUES (?)", [task], (err, result) => {
      if (err) {
        console.error("Error adding task to the database:", err);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      } else {
        const newTaskId = result.insertId;
        io.emit("newTask", { id: newTaskId, task }); // Notify clients about the new task
        res.json({ success: true, message: "Task added successfully" });
      }
    });
  } else {
    res.status(400).json({ success: false, message: "Task cannot be empty." });
  }
});

// Remove a task from the database
app.delete("/tasks/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM todos WHERE id = ?", [id], (err) => {
    if (err) {
      console.error("Error removing task from the database:", err);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    } else {
      io.emit("removeTask", { id }); // Notify clients about the removed task
      res.json({ success: true, message: "Task removed successfully" });
    }
  });
});

io.on("connection", (socket) => {
  console.log("Client connected");
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
