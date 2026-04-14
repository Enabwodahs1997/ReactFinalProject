import { useCallback, useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { createEntityId } from '../utils/id'

export default function EditablePage({ storageKey, title, description, emptyMessage, placeholderTitle, placeholderBody, submitLabel, variant = 'default' }) {
	const [entries, setEntries] = useLocalStorage(storageKey, [])
	const [draft, setDraft] = useState({ title: '', body: '' })
	const [editingEntryId, setEditingEntryId] = useState(null)
	const [editDraft, setEditDraft] = useState({ title: '', body: '' })

	const handleSubmit = useCallback((event) => {
		event.preventDefault()

		const nextTitle = draft.title.trim()
		const nextBody = draft.body.trim()

		if (!nextTitle && !nextBody) {
			return
		}

		setEntries((currentEntries) => [
			{
				id: createEntityId(),
				title: nextTitle || 'Untitled entry',
				body: nextBody,
				createdAt: new Date().toISOString(),
			},
			...currentEntries,
		])
		setDraft({ title: '', body: '' })
	}, [draft.body, draft.title, setEntries])

	const handleClear = useCallback(() => {
		setEntries([])
		setEditingEntryId(null)
		setEditDraft({ title: '', body: '' })
	}, [setEntries])

	const handleStartEdit = useCallback((entry) => {
		setEditingEntryId(entry.id)
		setEditDraft({
			title: entry.title ?? '',
			body: entry.body ?? '',
		})
	}, [])

	const handleCancelEdit = useCallback(() => {
		setEditingEntryId(null)
		setEditDraft({ title: '', body: '' })
	}, [])

	const handleSaveEdit = useCallback((event, entryId) => {
		event.preventDefault()

		const nextTitle = editDraft.title.trim()
		const nextBody = editDraft.body.trim()

		setEntries((currentEntries) =>
			currentEntries.map((entry) =>
				entry.id === entryId
					? {
						...entry,
						title: nextTitle || 'Untitled entry',
						body: nextBody,
					}
					: entry
			)
		)
		setEditingEntryId(null)
		setEditDraft({ title: '', body: '' })
	}, [editDraft.body, editDraft.title, setEntries])

	const handleDeleteEntry = useCallback((entryId) => {
		setEntries((currentEntries) => currentEntries.filter((entry) => entry.id !== entryId))

		setEditingEntryId((currentEditingId) => (currentEditingId === entryId ? null : currentEditingId))
		setEditDraft((currentDraft) =>
			editingEntryId === entryId ? { title: '', body: '' } : currentDraft
		)
	}, [editingEntryId, setEntries])

	return (
		<section className={`page-panel page-editor page-editor-${variant}`}>
			<div className="page-panel-header">
				<div>
					<h2>{title}</h2>
					<p>{description}</p>
				</div>
				<button className="btn btn-clear" type="button" onClick={handleClear} disabled={entries.length === 0}>
					Clear All
				</button>
			</div>

			<form className="page-editor-form" onSubmit={handleSubmit}>
				<input
					className="editor-input"
					type="text"
					placeholder={placeholderTitle}
					value={draft.title}
					onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, title: event.target.value }))}
					aria-label={`${title} title`}
				/>
				<textarea
					className="editor-textarea"
					placeholder={placeholderBody}
					value={draft.body}
					onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, body: event.target.value }))}
					aria-label={`${title} body`}
					rows="5"
				/>
				<button className="btn btn-primary editor-submit" type="submit">
					{submitLabel}
				</button>
			</form>

			<div className="page-entry-list">
				{entries.length === 0 ? (
					<p className="empty-state">{emptyMessage}</p>
				) : (
					entries.map((entry) => (
						<article className="entry-card" key={entry.id}>
							{editingEntryId === entry.id ? (
								<form className="entry-edit-form" onSubmit={(event) => handleSaveEdit(event, entry.id)}>
									<div className="entry-card-top">
										<input
											className="editor-input entry-edit-title"
											type="text"
											value={editDraft.title}
											onChange={(event) => setEditDraft((currentDraft) => ({ ...currentDraft, title: event.target.value }))}
											aria-label={`${title} entry title`}
										/>
										<time dateTime={entry.createdAt}>
											{new Date(entry.createdAt).toLocaleDateString()}
										</time>
									</div>
									<textarea
										className="editor-textarea entry-edit-body"
										value={editDraft.body}
										onChange={(event) => setEditDraft((currentDraft) => ({ ...currentDraft, body: event.target.value }))}
										aria-label={`${title} entry body`}
										rows="4"
									/>
									<div className="entry-actions">
										<button className="btn btn-primary" type="submit">Save</button>
										<button className="btn btn-clear" type="button" onClick={handleCancelEdit}>Cancel</button>
										<button className="btn btn-delete-entry" type="button" onClick={() => handleDeleteEntry(entry.id)}>
											Delete
										</button>
									</div>
								</form>
							) : (
								<>
									<div className="entry-card-top">
										<h3>{entry.title}</h3>
										<time dateTime={entry.createdAt}>
											{new Date(entry.createdAt).toLocaleDateString()}
										</time>
									</div>
									<p>{entry.body || 'No additional details added.'}</p>
									<div className="entry-actions">
										<button className="btn btn-clear" type="button" onClick={() => handleStartEdit(entry)}>
											Edit
										</button>
										<button className="btn btn-delete-entry" type="button" onClick={() => handleDeleteEntry(entry.id)}>
											Delete
										</button>
									</div>
								</>
							)}
						</article>
					))
				)}
			</div>
		</section>
	)
}