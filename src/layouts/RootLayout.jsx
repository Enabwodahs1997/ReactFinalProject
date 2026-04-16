import { NavLink, Outlet } from 'react-router-dom'
import Footer from '../components/Footer'
import { TaskDueDates } from '../components/TaskDueDates'

export default function RootLayout() {
	return (
		<div className="app-shell">
			<div className="app-main-shell">
				<aside className="app-sidebar" aria-label="Upcoming tasks sidebar">
					<TaskDueDates />
				</aside>
				<main className="page-content">
					<header className="page-header">
						<h1>Task Manager</h1>
						<p>Plan your day, track progress, and clear completed work.</p>
						<nav className="page-nav" aria-label="Primary">
							<NavLink to="/" end className={({ isActive }) => `page-nav-link${isActive ? ' active' : ''}`}>
								Tasks
							</NavLink>
							<NavLink to="/calendar" className={({ isActive }) => `page-nav-link${isActive ? ' active' : ''}`}>
								Calendar
							</NavLink>
							<NavLink to="/journal" className={({ isActive }) => `page-nav-link${isActive ? ' active' : ''}`}>
								Journal
							</NavLink>
							<NavLink to="/notes" className={({ isActive }) => `page-nav-link${isActive ? ' active' : ''}`}>
								Notes
							</NavLink>
							<NavLink to="/about" className={({ isActive }) => `page-nav-link${isActive ? ' active' : ''}`}>
								About
							</NavLink>
						</nav>
					</header>
					<Outlet />
					<Footer />
				</main>
			</div>
		</div>
	)
}
