import { useMemo } from 'react';

//handles the logic for calculating task statistics, 
// such as the total number of tasks and the number of completed tasks.

export function useTaskStats(tasks = []) {
  return useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.completed).length;

    return {
      totalTasks,
      completedTasks,
    };
  }, [tasks]);
}