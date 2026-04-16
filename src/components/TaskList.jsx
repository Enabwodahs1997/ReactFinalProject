import { memo } from "react";
import { useTaskFilter } from '../hooks/useTaskFilter';
import { parseTaskDueDate } from '../utils/dateTime';

// This component is responsible for displaying the list of tasks,
// including the search filter, and providing options to clear tasks, 
// toggle task completion, and delete tasks. It uses the useTaskFilter 
// hook to manage the filtering logic based on user input.

function TaskList({ tasks = [], onClearTasks, onToggleTask, onDeleteTask }) {
  const { filterInput, setFilterInput, filteredTasks, hasFilter, resetFilter } = useTaskFilter(tasks);
//I built this and had AI help me with the implementation of the filtering logic, 
// which allows users to search for tasks by their title or description.
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
          placeholder="Search by name, description, or due date..."
          className="filter-input"
          value={filterInput}
          onChange={(event) => setFilterInput(event.target.value)}
          aria-label="Filter tasks"
        />
        {hasFilter ? (
          <button
            type="button"
            className="btn btn-filter-reset"
            onClick={resetFilter}
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
            {filteredTasks.map(({ task, index }) => {
                const parsedDueDate = parseTaskDueDate(task?.dueDate);
                const dueDateLabel = parsedDueDate
                  ? parsedDueDate.toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : null;

                return (
                <li className="task-item" key={task.id ?? `${task.name}-${index}`}>
                    <label className="task-check">
                      <input
                        type="checkbox"
                        checked={Boolean(task.completed)}
                        onChange={() => onToggleTask(task.id)}
                      />
                      <strong className={task.completed ? 'task-name done' : 'task-name'}>
                        {task.name}
                      </strong>
                    </label>
                    <span className={task.completed ? 'task-description done' : 'task-description'}>
                      {task.description}
                    </span>
                    {dueDateLabel ? (
                      <span className={task.completed ? 'task-due-date done' : 'task-due-date'}>
                        Due: {dueDateLabel}
                      </span>
                    ) : null}
                    <button className="btn btn-delete" type="button" onClick={() => onDeleteTask(task.id)}>
                      Delete
                    </button>
                </li>
            )})}
        </ul>
      )}
    </div>
  );
}

export default memo(TaskList);