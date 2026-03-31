import React from "react";

export default function TaskListCount ({ tasks = [] }) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
    return (
        <div className="task-count">
            <p>Total Tasks: {totalTasks}</p>
            <p>Completed Tasks: {completedTasks}</p>
        </div>
    );
}