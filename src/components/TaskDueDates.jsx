import React, { useMemo } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

export const TaskDueDates = () => {
    const [tasks] = useLocalStorage("tasks", []);
    const upcomingTasks = useMemo(() => {
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const nextSevenDays = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);
//couldn't tell you the date stuff I had AI help me because time and date are a nightmare.
        return tasks
            .filter((task) => {
                if (!task?.dueDate) {
                    return false;
                }

                const dueDate = new Date(task.dueDate);
                if (Number.isNaN(dueDate.getTime())) {
                    return false;
                }

                return dueDate >= startOfToday && dueDate <= nextSevenDays;
            })
            .sort((leftTask, rightTask) => new Date(leftTask.dueDate) - new Date(rightTask.dueDate));
    }, [tasks]);
//I built this return component to help guide AI with what I wanted the TaskDueDates component to do, 
// which is to display a list of tasks that are due within the next 7 days. 
// It filters the tasks based on their due dates and sorts them in ascending order. 
// If there are no upcoming tasks, it displays a message indicating that there are no 
// tasks due in the next 7 days.
    return (
        <div className="task-due-dates">
            <h2>Upcoming Tasks</h2>
            {upcomingTasks.length === 0 ? (
                <p>No tasks due in the next 7 days.</p>
            ) : (
                <ul>
                    {upcomingTasks.map((task) => (
                        <li key={task.id}>
                            <strong>{task.name ?? task.title ?? "Untitled task"}</strong> - Due:{" "}
                            {new Date(task.dueDate).toLocaleDateString()}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};