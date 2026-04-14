import { Route, Routes } from 'react-router-dom'
import RootLayout from '../layouts/RootLayout'
import HomePage from '../pages/HomePage'
import CalendarTaskPage from '../pages/CalendarTaskPage'
import JournalPage from '../pages/JournalPage'
import NotesPage from '../pages/NotesPage'
import AboutPage from '../pages/AboutPage'
import NotFound from '../components/PageError'

export default function AppRoutes() {
	return (
		<Routes>
			<Route path="/" element={<RootLayout />}>
				<Route index element={<HomePage />} />
				<Route path="calendar" element={<CalendarTaskPage />} />
				<Route path="calandar" element={<CalendarTaskPage />} />
				<Route path="calender" element={<CalendarTaskPage />} />
				<Route path="journal" element={<JournalPage />} />
				<Route path="notes" element={<NotesPage />} />
				<Route path="about" element={<AboutPage />} />
				<Route path="*" element={<NotFound />} />
			</Route>
		</Routes>
	)
}
