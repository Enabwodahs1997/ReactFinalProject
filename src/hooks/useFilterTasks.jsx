import { useMemo } from 'react';

export function useFilterTasks(tasks = [], filterInput = '') {
    return useMemo(() => {
        const query = filterInput.trim().toLowerCase();
        const taskEntries = tasks.map((task, index) => ({ task, index }));

        if (!query) {
            return taskEntries;
        }

        return taskEntries.filter(({ task }) => {
            const name = task?.name?.toLowerCase?.() ?? '';
            const description = task?.description?.toLowerCase?.() ?? '';
            return name.includes(query) || description.includes(query);
        });
    }, [tasks, filterInput]);
}
