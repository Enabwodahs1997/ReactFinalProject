import TaskSubmission from './components/TaskSubmission'
import './App.css'
import { TaskDueDates } from './components/TaskDueDates'
import { Route, Routes } from 'react-router-dom'
import NotFound from './components/PageError'

// The App component serves as the main entry point of the application, 
// rendering the TaskSubmission component which contains the core 
// functionality for managing tasks. It also includes a header with 
// a title and description to guide users on how to use the task manager.

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="app-shell">
            <main className="page-content">
              <header className="page-header">
                <h1>Task Manager</h1>
                <p>Plan your day, track progress, and clear completed work.</p>
              </header>
              <TaskSubmission />
              <TaskDueDates />
            </main>
          </div>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App