import React from "react";
import { useFilterTasks } from '../hooks/useFilterTasks';

export default function TaskList({ tasks = [], onClearTasks, onToggleTask, onDeleteTask }) {
  const [filterInput, setFilterInput] = React.useState('');
  const filteredTasks = useFilterTasks(tasks, filterInput);
  const hasFilter = filterInput.trim().length > 0;

  return (
    <div className="task-list">
      <div className="task-list-header">
        <h2>Task List</h2>
        <button
          className="btn btn-clear"
          type="button"
          onClick={onClearTasks}
          disabled={tasks.length === 0}
        >
          Clear Tasks
        </button>
      </div>
      <div className="task-filter-row">
        <input
          type="text"
          placeholder="Search tasks by title or notes..."
          className="filter-input"
          value={filterInput}
          onChange={(event) => setFilterInput(event.target.value)}
          aria-label="Filter tasks"
        />
        {hasFilter ? (
          <button
            type="button"
            className="btn btn-filter-reset"
            onClick={() => setFilterInput('')}
          >
            Reset
          </button>
        ) : null}
      </div>
      {tasks.length === 0 ? (
        <p className="empty-state">No tasks available.</p>
      ) : filteredTasks.length === 0 ? (
        <p className="empty-state">No tasks match your search.</p>
      ) : (
        <ul className="task-items">
            {filteredTasks.map(({ task, index }) => (
                <li className="task-item" key={`${task.name}-${index}`}>
                    <label className="task-check">
                      <input
                        type="checkbox"
                        checked={Boolean(task.completed)}
                        onChange={() => onToggleTask(index)}
                      />
                      <strong className={task.completed ? 'task-name done' : 'task-name'}>
                        {task.name}
                      </strong>
                    </label>
                    <span className={task.completed ? 'task-description done' : 'task-description'}>
                      {task.description}
                    </span>
                    <button className="btn btn-delete" type="button" onClick={() => onDeleteTask(index)}>
                      Delete
                    </button>
                </li>
            ))}
        </ul>
      )}
    </div>
  );
}