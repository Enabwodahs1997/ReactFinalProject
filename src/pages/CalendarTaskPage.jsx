import { useMemo, useState } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { parseTaskDueDate } from '../utils/dateTime'

const DEFAULT_TASK_COLOR = '#5f7e4f'
const COLOR_COMPLETED = '#2f9e44'
const COLOR_OVERDUE = '#d9480f'
const COLOR_TODAY = '#f08c00'
const COLOR_UPCOMING = '#1c7ed6'

function toDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function CalendarTaskPage() {
  const [tasks] = useLocalStorage('tasks', [])
  const [taskColors, setTaskColors] = useLocalStorage('taskCalendarColors', {})
  const [useAutoColors, setUseAutoColors] = useLocalStorage('taskCalendarAutoColors', false)
  const [selectedDate, setSelectedDate] = useState(new Date())

  const todayStart = useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }, [])

  const tasksByDate = useMemo(() => {
    const grouped = new Map()

    tasks.forEach((task) => {
      const dueDate = parseTaskDueDate(task?.dueDate)
      if (!dueDate) {
        return
      }

      const key = toDateKey(dueDate)
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }

      grouped.get(key).push(task)
    })

    return grouped
  }, [tasks])

  const selectedDateKey = toDateKey(selectedDate)
  const selectedDateTasks = tasksByDate.get(selectedDateKey) ?? []

  const handleDateChange = (nextValue) => {
    const nextDate = Array.isArray(nextValue) ? nextValue[0] : nextValue
    if (nextDate instanceof Date && !Number.isNaN(nextDate.getTime())) {
      setSelectedDate(nextDate)
    }
  }

  const handleTaskColorChange = (taskId, color) => {
    setTaskColors((prev) => ({
      ...prev,
      [taskId]: color,
    }))
  }

  const getAutoTaskColor = (task) => {
    if (task?.completed) {
      return COLOR_COMPLETED
    }

    const dueDate = parseTaskDueDate(task?.dueDate)
    if (!dueDate) {
      return DEFAULT_TASK_COLOR
    }

    if (dueDate < todayStart) {
      return COLOR_OVERDUE
    }

    if (toDateKey(dueDate) === toDateKey(todayStart)) {
      return COLOR_TODAY
    }

    return COLOR_UPCOMING
  }

  const getTaskColor = (task) => {
    if (useAutoColors) {
      return getAutoTaskColor(task)
    }

    return taskColors[task.id] ?? DEFAULT_TASK_COLOR
  }

  const renderTileContent = ({ date, view }) => {
    if (view !== 'month') {
      return null
    }

    const dayTasks = tasksByDate.get(toDateKey(date))
    if (!dayTasks || dayTasks.length === 0) {
      return null
    }

    return (
      <div className="calendar-task-dots" aria-hidden="true">
        {dayTasks.slice(0, 3).map((task) => (
          <span
            key={task.id}
            className="calendar-task-dot"
            style={{ backgroundColor: getTaskColor(task) }}
          ></span>
        ))}
        {dayTasks.length > 3 ? <span className="calendar-task-count">+{dayTasks.length - 3}</span> : null}
      </div>
    )
  }

  return (
    <section className="page-panel calendar-page">
      <h1>Task Calendar</h1>
      <p>Track task due dates and color-code them for quick scanning on the calendar.</p>

      <Calendar className="calendar-shell" onChange={handleDateChange} value={selectedDate} tileContent={renderTileContent} />

      <section className="task-due-dates calendar-task-panel">
        <div className="calendar-legend-head">
          <h2>Color Mode</h2>
          <label className="calendar-auto-toggle">
            <input
              type="checkbox"
              checked={useAutoColors}
              onChange={(event) => setUseAutoColors(event.target.checked)}
            />
            Use automatic status colors
          </label>
        </div>

        <div className="calendar-legend">
          <span>
            <i className="calendar-legend-swatch" style={{ backgroundColor: COLOR_COMPLETED }}></i>
            Completed
          </span>
          <span>
            <i className="calendar-legend-swatch" style={{ backgroundColor: COLOR_OVERDUE }}></i>
            Overdue
          </span>
          <span>
            <i className="calendar-legend-swatch" style={{ backgroundColor: COLOR_TODAY }}></i>
            Due today
          </span>
          <span>
            <i className="calendar-legend-swatch" style={{ backgroundColor: COLOR_UPCOMING }}></i>
            Upcoming
          </span>
          <span>
            <i className="calendar-legend-swatch" style={{ backgroundColor: DEFAULT_TASK_COLOR }}></i>
            Manual/default
          </span>
        </div>
      </section>

      <section className="task-due-dates calendar-task-panel">
        <h2>Tasks Due {selectedDate.toLocaleDateString()}</h2>
        {selectedDateTasks.length === 0 ? (
          <p>No tasks due on this date.</p>
        ) : (
          <ul className="calendar-task-list">
            {selectedDateTasks.map((task) => (
              <li key={task.id} className="calendar-task-row">
                <div className="calendar-task-main">
                  <strong>{task.name ?? 'Untitled task'}</strong>
                  <p className="calendar-task-desc">{task.description ?? 'No description'}</p>
                </div>
                <label className="calendar-color-label">
                  Color
                  <input
                    type="color"
                    value={taskColors[task.id] ?? DEFAULT_TASK_COLOR}
                    onChange={(event) => handleTaskColorChange(task.id, event.target.value)}
                    aria-label={`Color for task ${task.name ?? 'Untitled task'}`}
                    disabled={useAutoColors}
                  />
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}