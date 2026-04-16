import { useCallback, useEffect, useState } from 'react';
import TaskList from './TaskList';
import TaskListCount from './TaskCount';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { createEntityId } from '../utils/id';
import { extractTasksFromWorkbookFile, readWorkbookPreviewFromFile } from '../utils/taskImport';

//logic for creating the interactivity of the task submission form,
//including handling form submission, toggling task completion, 
// deleting tasks, and clearing all tasks. 
// It also ensures that each task has a unique ID, 
// even if older tasks were created without one.

export default function TaskSubmission() {
  const [tasks, setTasks] = useLocalStorage('tasks', []);
  const [importMessage, setImportMessage] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isPreparingPreview, setIsPreparingPreview] = useState(false);
  const [importPreviewRows, setImportPreviewRows] = useState([]);
  const [selectedImportIds, setSelectedImportIds] = useState([]);
  const [importFileName, setImportFileName] = useState('');
  const [uploadedWorkbook, setUploadedWorkbook] = useState(null);
  const [selectedSheetName, setSelectedSheetName] = useState('');
  const [selectedColumns, setSelectedColumns] = useState({
    nameKey: '',
    descriptionKey: '',
    dueDateKey: '',
  });

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

  const handleExcelImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsImporting(true);
    setImportMessage('');

    try {
      const workbookPreview = await readWorkbookPreviewFromFile(file);
      const firstSheet = workbookPreview.sheets[0] ?? null;

      if (!firstSheet) {
        setUploadedWorkbook(null);
        setImportPreviewRows([]);
        setSelectedImportIds([]);
        setSelectedSheetName('');
        setSelectedColumns({ nameKey: '', descriptionKey: '', dueDateKey: '' });
        setImportFileName(file.name);
        setImportMessage('No worksheets were found in that file.');
        return;
      }

      setUploadedWorkbook({ file, ...workbookPreview });
      setSelectedSheetName(firstSheet.sheetName);
      setSelectedColumns({
        nameKey: firstSheet.detectedColumnMap.nameKey ?? '',
        descriptionKey: firstSheet.detectedColumnMap.descriptionKey ?? '',
        dueDateKey: firstSheet.detectedColumnMap.dueDateKey ?? '',
      });
      setImportPreviewRows([]);
      setSelectedImportIds([]);
      setImportFileName(file.name);
      setImportMessage('File loaded. Choose your sheet/columns, then click Preview Tasks.');
    } catch (error) {
      setUploadedWorkbook(null);
      setImportPreviewRows([]);
      setSelectedImportIds([]);
      setSelectedSheetName('');
      setSelectedColumns({ nameKey: '', descriptionKey: '', dueDateKey: '' });
      setImportFileName('');
      setImportMessage(error instanceof Error ? error.message : 'Unable to read that Excel file. Use .xlsx and check your column names.');
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const activeSheetPreview =
    uploadedWorkbook?.sheets.find((sheet) => sheet.sheetName === selectedSheetName) ?? uploadedWorkbook?.sheets[0] ?? null;

  const handleSheetChange = (event) => {
    const nextSheetName = event.target.value;
    setSelectedSheetName(nextSheetName);

    const nextSheet = uploadedWorkbook?.sheets.find((sheet) => sheet.sheetName === nextSheetName);
    setSelectedColumns({
      nameKey: nextSheet?.detectedColumnMap.nameKey ?? '',
      descriptionKey: nextSheet?.detectedColumnMap.descriptionKey ?? '',
      dueDateKey: nextSheet?.detectedColumnMap.dueDateKey ?? '',
    });
    setImportPreviewRows([]);
    setSelectedImportIds([]);
    setImportMessage('Updated sheet selection. Click Preview Tasks to refresh the row list.');
  };

  const handleColumnChange = (columnType, nextValue) => {
    setSelectedColumns((prevColumns) => ({
      ...prevColumns,
      [columnType]: nextValue,
    }));
    setImportPreviewRows([]);
    setSelectedImportIds([]);
  };

  const handlePreviewTasks = async () => {
    if (!uploadedWorkbook?.file) {
      setImportMessage('Upload an Excel file first.');
      return;
    }

    if (!selectedColumns.nameKey) {
      setImportMessage('Select the Task/Title column before previewing tasks.');
      return;
    }

    setIsPreparingPreview(true);
    setImportMessage('');

    try {
      const importedRows = await extractTasksFromWorkbookFile(uploadedWorkbook.file, {
        sheetName: selectedSheetName,
        columnMap: {
          nameKey: selectedColumns.nameKey || null,
          descriptionKey: selectedColumns.descriptionKey || null,
          dueDateKey: selectedColumns.dueDateKey || null,
        },
      });

      if (importedRows.length === 0) {
        setImportPreviewRows([]);
        setSelectedImportIds([]);
        setImportMessage('No tasks were found for the selected columns in this sheet.');
        return;
      }

      const previewRows = importedRows.map((row) => ({
        previewId: createEntityId(),
        ...row,
      }));

      const defaultSelectedRows = previewRows
        .filter((row) => !row.hasDueDateParseWarning)
        .map((row) => row.previewId);

      setImportPreviewRows(previewRows);
      setSelectedImportIds(defaultSelectedRows);
      setImportMessage(`Loaded ${previewRows.length} task(s) from ${selectedSheetName}. Pick what to import.`);
    } catch (error) {
      setImportPreviewRows([]);
      setSelectedImportIds([]);
      setImportMessage(error instanceof Error ? error.message : 'Could not build the task preview from your selected columns.');
    } finally {
      setIsPreparingPreview(false);
    }
  };

  const handleResetWorkbook = () => {
    setUploadedWorkbook(null);
    setSelectedSheetName('');
    setSelectedColumns({ nameKey: '', descriptionKey: '', dueDateKey: '' });
    setImportPreviewRows([]);
    setSelectedImportIds([]);
    setImportFileName('');
    setImportMessage('');
  };

  const handleToggleImportRow = (previewId) => {
    setSelectedImportIds((prevIds) =>
      prevIds.includes(previewId)
        ? prevIds.filter((id) => id !== previewId)
        : [...prevIds, previewId]
    );
  };

  const handleSelectAllImportRows = () => {
    setSelectedImportIds(importPreviewRows.map((row) => row.previewId));
  };

  const handleClearImportSelection = () => {
    setSelectedImportIds([]);
  };

  const handleCancelImportPreview = () => {
    setImportPreviewRows([]);
    setSelectedImportIds([]);
    setImportMessage('Task preview cleared. Update selections and preview again when ready.');
  };

  const handleImportSelectedRows = () => {
    if (selectedImportIds.length === 0) {
      setImportMessage('Select at least one row to import.');
      return;
    }

    const selectedIdSet = new Set(selectedImportIds);
    const selectedRows = importPreviewRows.filter((row) => selectedIdSet.has(row.previewId));

    const importedTasks = selectedRows.map((row) => ({
      id: createEntityId(),
      name: row.name,
      description: row.description,
      dueDate: row.dueDate,
      completed: false,
    }));

    setTasks((prevTasks) => [...prevTasks, ...importedTasks]);
    setImportMessage(`Imported ${importedTasks.length} selected task(s) from ${importFileName}.`);
    setImportPreviewRows([]);
    setSelectedImportIds([]);
    setImportFileName('');
  };

  const selectedImportCount = selectedImportIds.length;
  const dueDateWarningCount = importPreviewRows.filter((row) => row.hasDueDateParseWarning).length;

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

      <div className="task-import">
        <label className="task-import-label" htmlFor="excel-upload">Import tasks from Excel</label>
        <input
          id="excel-upload"
          className="task-input"
          type="file"
          accept=".xlsx"
          onChange={handleExcelImport}
          disabled={isImporting}
        />
        <p className="task-import-help">
          Upload first, then choose the exact sheet and columns from your file.
        </p>
        {importMessage ? <p className="task-import-message">{importMessage}</p> : null}

        {uploadedWorkbook && activeSheetPreview ? (
          <div className="task-column-picker">
            <div className="task-column-picker-row">
              <label htmlFor="sheet-select">Sheet</label>
              <select
                id="sheet-select"
                className="task-input"
                value={selectedSheetName}
                onChange={handleSheetChange}
              >
                {uploadedWorkbook.sheetNames.map((sheetName) => (
                  <option key={sheetName} value={sheetName}>{sheetName}</option>
                ))}
              </select>
            </div>

            <div className="task-column-picker-grid">
              <div className="task-column-picker-row">
                <label htmlFor="name-column-select">Task/Title Column</label>
                <select
                  id="name-column-select"
                  className="task-input"
                  value={selectedColumns.nameKey}
                  onChange={(event) => handleColumnChange('nameKey', event.target.value)}
                >
                  <option value="">Select column</option>
                  {activeSheetPreview.headers.map((header) => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>

              <div className="task-column-picker-row">
                <label htmlFor="description-column-select">Description Column</label>
                <select
                  id="description-column-select"
                  className="task-input"
                  value={selectedColumns.descriptionKey}
                  onChange={(event) => handleColumnChange('descriptionKey', event.target.value)}
                >
                  <option value="">None</option>
                  {activeSheetPreview.headers.map((header) => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>

              <div className="task-column-picker-row">
                <label htmlFor="due-date-column-select">Due Date Column</label>
                <select
                  id="due-date-column-select"
                  className="task-input"
                  value={selectedColumns.dueDateKey}
                  onChange={(event) => handleColumnChange('dueDateKey', event.target.value)}
                >
                  <option value="">None</option>
                  {activeSheetPreview.headers.map((header) => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="task-import-actions">
              <button
                className="btn btn-primary"
                type="button"
                onClick={handlePreviewTasks}
                disabled={isPreparingPreview || !selectedColumns.nameKey}
              >
                {isPreparingPreview ? 'Building Preview...' : 'Preview Tasks'}
              </button>
              <button className="btn btn-clear" type="button" onClick={handleResetWorkbook}>
                Use Different File
              </button>
            </div>

            <div className="task-sheet-preview">
              <p>
                Showing {activeSheetPreview.sampleRows.length} of {activeSheetPreview.rowCount} row(s) from {activeSheetPreview.sheetName}.
              </p>
              <div className="task-sheet-preview-table-wrap">
                <table className="task-sheet-preview-table">
                  <thead>
                    <tr>
                      {activeSheetPreview.headers.map((header) => (
                        <th key={header}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeSheetPreview.sampleRows.map((row, rowIndex) => (
                      <tr key={`${activeSheetPreview.sheetName}-sample-${rowIndex}`}>
                        {activeSheetPreview.headers.map((header) => (
                          <td key={`${rowIndex}-${header}`}>{String(row[header] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        {importPreviewRows.length > 0 ? (
          <div className="task-import-preview">
            <div className="task-import-preview-head">
              <p>
                {selectedImportCount} of {importPreviewRows.length} row(s) selected from {importFileName}.
              </p>
              {dueDateWarningCount > 0 ? (
                <p className="task-import-warning-summary">
                  {dueDateWarningCount} row(s) have due dates that could not be parsed and will import with no due date.
                </p>
              ) : null}
              <div className="task-import-actions">
                <button className="btn btn-clear" type="button" onClick={handleSelectAllImportRows}>
                  Select All
                </button>
                <button className="btn btn-clear" type="button" onClick={handleClearImportSelection}>
                  Clear Selection
                </button>
                <button className="btn btn-primary" type="button" onClick={handleImportSelectedRows}>
                  Import Selected
                </button>
                <button className="btn btn-clear" type="button" onClick={handleCancelImportPreview}>
                  Cancel
                </button>
              </div>
            </div>

            <ul className="task-import-list">
              {importPreviewRows.map((row) => (
                <li key={row.previewId} className="task-import-item">
                  <label className="task-import-row">
                    <input
                      type="checkbox"
                      checked={selectedImportIds.includes(row.previewId)}
                      onChange={() => handleToggleImportRow(row.previewId)}
                    />
                    <span>
                      <strong>{row.name}</strong>
                      <span className="task-import-row-meta">
                        {row.description || 'No description'} | Due: {row.dueDate || 'No due date'}
                      </span>
                      {row.hasDueDateParseWarning ? (
                        <span className="task-import-row-warning">
                          Could not parse original date value: {row.dueDateRaw}
                        </span>
                      ) : null}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

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