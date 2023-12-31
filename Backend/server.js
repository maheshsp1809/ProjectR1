import { ELEPHANTSQL_URL } from "../.env";
const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIO = require("socket.io");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Parse the ElephantSQL connection URL
const connectionString = ELEPHANTSQL_URL;

const pool = new Pool({ connectionString });

pool.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
  } else {
    console.log("Connected to PostgreSQL database");
  }
});

// Get all tasks from the database
app.get("/tasks", (req, res) => {
  pool.query("SELECT * FROM todos", (err, results) => {
    if (err) {
      console.error("Error fetching tasks from the database:", err);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    } else {
      const tasks = results.rows.map((row) => ({
        id: row.id,
        task: row.task,
      }));
      res.json({ tasks });
    }
  });
});

// Add a new task to the database
app.post("/tasks", (req, res) => {
  const { task } = req.body;

  if (task.trim() !== "") {
    pool.query(
      "INSERT INTO todos (task) VALUES ($1) RETURNING id",
      [task],
      (err, result) => {
        if (err) {
          console.error("Error adding task to the database:", err);
          res
            .status(500)
            .json({ success: false, message: "Internal Server Error" });
        } else {
          const newTaskId = result.rows[0].id;
          io.emit("newTask", { id: newTaskId, task }); // Notify clients about the new task
          res.json({ success: true, message: "Task added successfully" });
        }
      }
    );
  } else {
    res.status(400).json({ success: false, message: "Task cannot be empty." });
  }
});

// Remove a task from the database
app.delete("/tasks/:id", (req, res) => {
  const { id } = req.params;

  pool.query("DELETE FROM todos WHERE id = $1", [id], (err) => {
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
