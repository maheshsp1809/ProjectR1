// Updated index.js
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import pkg from "pg";
const { Pool } = pkg;
import { config } from "dotenv";
import { ELEPHANTSQL_URL } from "../.env.js";

config(); // Load environment variables from .env

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Parse the ElephantSQL connection URL
const connectionString = ELEPHANTSQL_URL;
const pool = new Pool({ connectionString });

pool
  .connect()
  .then(() => {
    console.log("Connected to PostgreSQL database");
  })
  .catch((err) => {
    console.error("Error connecting to the database:", err);
  });

// Generic error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

// Socket.IO connection like that of whatsapp
io.on("connection", (socket) => {
  console.log("Client connected");

  // Socket.IO error handling
  socket.on("error", (err) => {
    console.error("Socket error:", err);
  });
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

// Handle CORS options requests
app.options("*", cors());

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on  default http://localhost:${PORT}`);
});
