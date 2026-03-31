import TaskSubmission from './components/TaskSubmission'
import './App.css'


function App() {
  return (
    <div className="app-shell">
      <main className="page-content">
        <header className="page-header">
          <h1>Task Manager</h1>
          <p>Plan your day, track progress, and clear completed work.</p>
        </header>
        <TaskSubmission />
      </main>
    </div>
  )
}

export default App