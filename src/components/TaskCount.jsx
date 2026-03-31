import { useTaskStats } from '../hooks/useTaskStats';

// This component is responsible for displaying the count of total tasks 
// and completed tasks.

export default function TaskListCount ({ tasks = [] }) {
    const { totalTasks, completedTasks } = useTaskStats(tasks);

    return (
        <div className="task-count">
            <p>Total Tasks: {totalTasks}</p>
            <p>Completed Tasks: {completedTasks}</p>
        </div>
    );
}