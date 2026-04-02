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
//timeout is used to delay the update of the debouncedFilterInput state, 
// allowing for a smoother user experience when typing in the filter input field. 
// The timeout is cleared if the filterInput changes before the timeout completes, 
// preventing unnecessary updates and improving performance.
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
    //obviously the useMemo hook is used to memoize the filteredTasks value,
    // ensuring that the filtering logic is only re-executed when the tasks or deferredFilterInput change, 
    // which can improve performance by avoiding unnecessary computations on every render.

    return taskEntries.filter(({ task }) => {
      const name = task?.name?.toLowerCase?.() ?? '';
      const description = task?.description?.toLowerCase?.() ?? '';
// The due date filtering logic is designed to be flexible, 
// allowing users to search for tasks based on various representations of the due date.
//I had AI help me implement this logic to ensure that it can handle different date formats 
// and still provide accurate filtering results based on the user's input.
      const dueDateValue = task?.dueDate ?? '';
      const dueDateText = typeof dueDateValue === 'string' ? dueDateValue.toLowerCase() : '';
      const dueDate = dueDateValue ? new Date(dueDateValue) : null;
      const dueDateIso = dueDate && !Number.isNaN(dueDate.getTime())
        ? dueDate.toISOString().slice(0, 10)
        : '';
      const dueDateLocal = dueDate && !Number.isNaN(dueDate.getTime())
        ? dueDate.toLocaleDateString().toLowerCase()
        : '';

      return (
        name.includes(query) ||
        description.includes(query) ||
        dueDateText.includes(query) ||
        dueDateIso.includes(query) ||
        dueDateLocal.includes(query)
      );
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