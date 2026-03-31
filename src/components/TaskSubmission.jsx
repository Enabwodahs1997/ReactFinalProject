import { useCallback, useEffect } from 'react';
import TaskList from './TaskList';
import TaskListCount from './TaskCount';
import { useLocalStorage } from '../hooks/useLocalStorage';

//logic for creating the interactivity of the task submission form,
//including handling form submission, toggling task completion, 
// deleting tasks, and clearing all tasks. 
// It also ensures that each task has a unique ID, 
// even if older tasks were created without one.


function createTaskId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function TaskSubmission() {
  const [tasks, setTasks] = useLocalStorage('tasks', []);

  useEffect(() => {
    setTasks((prevTasks) => {
      let hasMissingId = false;
      const normalizedTasks = prevTasks.map((task) => {
        if (task?.id) {
          return task;
        }

        hasMissingId = true;
        return { ...task, id: createTaskId() };
      });

      return hasMissingId ? normalizedTasks : prevTasks;
    });
  }, [setTasks]);

  const handleClearTasks = useCallback(() => {
    setTasks([]);
  }, [setTasks]);

  const handleToggleTask = useCallback((taskId) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  }, [setTasks]);

  const handleDeleteTask = useCallback((taskId) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
  }, [setTasks]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);

    const name = formData.get('name')?.toString().trim();
    const description = formData.get('description')?.toString().trim();

    if (!name || !description) {
      return;
    }

    const newTask = { id: createTaskId(), name, description, completed: false };
    setTasks((prevTasks) => [...prevTasks, newTask]);
    event.target.reset();
  };

//visual return of what the user will see on the webpage, 
// including the form to submit tasks, the task count, 
// and the list of tasks with options to clear, toggle, or delete tasks.
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