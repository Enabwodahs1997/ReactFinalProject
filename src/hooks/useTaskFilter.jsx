import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';

// This custom hook manages the state and logic for filtering tasks 
// based on user input.

export function useTaskFilter(tasks = []) {
  const [filterInput, setFilterInput] = useState('');
  const [debouncedFilterInput, setDebouncedFilterInput] = useState('');

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedFilterInput(filterInput);
    }, 180);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [filterInput]);

  const deferredFilterInput = useDeferredValue(debouncedFilterInput);

  const filteredTasks = useMemo(() => {
    const query = deferredFilterInput.trim().toLowerCase();
    const taskEntries = tasks.map((task, index) => ({ task, index }));

    if (!query) {
      return taskEntries;
    }

    return taskEntries.filter(({ task }) => {
      const name = task?.name?.toLowerCase?.() ?? '';
      const description = task?.description?.toLowerCase?.() ?? '';
      return name.includes(query) || description.includes(query);
    });
  }, [tasks, deferredFilterInput]);

  const hasFilter = filterInput.trim().length > 0;
  const resetFilter = useCallback(() => {
    setFilterInput('');
  }, []);

  return {
    filterInput,
    setFilterInput,
    filteredTasks,
    hasFilter,
    resetFilter,
  };
}