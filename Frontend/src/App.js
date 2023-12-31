import React, { useState, useEffect } from "react";
import "./App.css";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");

  useEffect(() => {
    fetchTasks();

    // Listen for new task events
    socket.on("newTask", (data) => {
      setTasks((prevTasks) => [...prevTasks, { id: data.id, task: data.task }]);
    });

    // Listen for remove task events
    socket.on("removeTask", (data) => {
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== data.id));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch("http://localhost:5000/tasks");
      const data = await response.json();
      setTasks(data.tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const addTask = async () => {
    if (newTask.trim() !== "") {
      try {
        const response = await fetch("http://localhost:5000/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ task: newTask }),
        });

        const data = await response.json();

        if (data.success) {
          setNewTask("");
        } else {
          console.error("Error adding task:", data.message);
        }
      } catch (error) {
        console.error("Error adding task:", error);
      }
    }
  };

  const removeTask = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/tasks/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!data.success) {
        console.error("Error removing task:", data.message);
      }
    } catch (error) {
      console.error("Error removing task:", error);
    }
  };

  return (
    <div className="App">
      <h1>To-Do App</h1>
      <div>
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
        />
        <button onClick={addTask}>Add Task</button>
      </div>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            {task.task}{" "}
            <button onClick={() => removeTask(task.id)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
