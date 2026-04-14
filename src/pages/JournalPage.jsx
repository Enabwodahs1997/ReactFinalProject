import EditablePage from '../components/EditablePage'

export default function JournalPage() {
	return (
		<EditablePage
			storageKey="journal-entries"
			title="Journal"
			description="Capture what you finished, what slowed you down, and what to adjust tomorrow."
			emptyMessage="No journal entries yet. Add a quick reflection above."
			placeholderTitle="Entry title"
			placeholderBody="Write a short reflection about your day..."
			submitLabel="Save Entry"
			variant="journal"
		/>
	)
}
