import EditablePage from '../components/EditablePage'

export default function NotesPage() {
	return (
		<EditablePage
			storageKey="note-entries"
			title="Notes"
			description="Keep loose ideas, reminders, and small details here so they do not crowd the task list."
			emptyMessage="No notes saved yet. Add one above."
			placeholderTitle="Note title"
			placeholderBody="Write a reminder, idea, or reference detail..."
			submitLabel="Save Note"
			variant="notes"
		/>
	)
}
