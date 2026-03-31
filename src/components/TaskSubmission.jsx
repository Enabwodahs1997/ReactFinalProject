import React from 'react';
import TaskList from './TaskList';
import TaskListCount from './TaskCount';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function TaskSubmission() {
  const [tasks, setTasks] = useLocalStorage('tasks', []);

  const handleClearTasks = () => {
    setTasks([]);
  };

  const handleToggleTask = (taskIndex) => {
    setTasks((prevTasks) =>
      prevTasks.map((task, index) =>
        index === taskIndex ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleDeleteTask = (taskIndex) => {
    setTasks((prevTasks) => prevTasks.filter((_, index) => index !== taskIndex));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);

    const name = formData.get('name')?.toString().trim();
    const description = formData.get('description')?.toString().trim();

    if (!name || !description) {
      return;
    }

    const newTask = { name, description, completed: false };
    setTasks((prevTasks) => [...prevTasks, newTask]);
    event.target.reset();
  };


  return (
    <div className="task-submission">
      <form className="task-form" onSubmit={handleSubmit}>
        <input className="task-input" type="text" name="name" placeholder="Task Name" required />
        <input className="task-input" type="text" name="description" placeholder="Task Description" required />
        <button className="btn btn-primary" type="submit">Add Task</button>
      </form>

      <TaskListCount tasks={tasks} />

      <TaskList
        tasks={tasks}
        onClearTasks={handleClearTasks}
        onToggleTask={handleToggleTask}
        onDeleteTask={handleDeleteTask}
      />
    </div>
  );
}