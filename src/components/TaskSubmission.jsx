import { useCallback, useEffect } from 'react';
import TaskList from './TaskList';
import TaskListCount from './TaskCount';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { createEntityId } from '../utils/id';

//logic for creating the interactivity of the task submission form,
//including handling form submission, toggling task completion, 
// deleting tasks, and clearing all tasks. 
// It also ensures that each task has a unique ID, 
// even if older tasks were created without one.

export default function TaskSubmission() {
  const [tasks, setTasks] = useLocalStorage('tasks', []);

  useEffect(() => {
    setTasks((prevTasks) => {
      let hasMissingId = false;
      const normalizedTasks = prevTasks.map((task) => {
        if (task?.id) {
          return task;
        }
//missing ID logic to ensure that all tasks have a unique identifier, 
// which is crucial for managing task state and interactions effectively.
//this insures that even if there are older tasks that were created without an ID,
// they will be assigned a unique ID when the component mounts, 
// allowing for consistent behavior across all tasks. I had AI help me understand why and how the
//code would work and then used previos knowledge of how to generate unique IDs 
// to implement the createTaskId function.
        hasMissingId = true;
        return { ...task, id: createEntityId() };
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
    const dueDate = formData.get('dueDate')?.toString().trim();

    if (!name || !description) {
      return;
    }
//I kept struggling with the form submission logic, so I had AI help me implement the handleSubmit 
// function to ensure that it correctly captures the form data, validates it, and creates a 
// new task with a unique ID.
    const newTask = {
      id: createEntityId(),
      name,
      description,
      dueDate: dueDate || null,
      completed: false,
    };
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
        <input className="task-input" type="date" name="dueDate" aria-label="Task due date" />
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