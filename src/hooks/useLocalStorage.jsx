import { useState, useEffect, useCallback } from "react"

const LOCAL_STORAGE_SYNC_EVENT = "local-storage-sync"

export function useLocalStorage(key, initialValue) {
	const [value, setValue] = useState(() => {
		try {
			const savedValue = localStorage.getItem(key)

			if (savedValue !== null) {
				return JSON.parse(savedValue)
			}
		} catch {
			return initialValue
		}

		return initialValue
	})

	const setStoredValue = useCallback((nextValueOrUpdater) => {
		setValue((previousValue) =>
			typeof nextValueOrUpdater === "function"
				? nextValueOrUpdater(previousValue)
				: nextValueOrUpdater
		)
	}, [])

	useEffect(() => {
		try {
			localStorage.setItem(key, JSON.stringify(value))
			window.dispatchEvent(
				new CustomEvent(LOCAL_STORAGE_SYNC_EVENT, { detail: { key, value } })
			)
		} catch {
			// Ignore write failures (private mode/full storage) and keep app running.
		}
	}, [key, value])

	useEffect(() => {
		const syncValue = (event) => {
			if (event.type === "storage") {
				if (event.key !== key) {
					return
				}

				try {
					setValue(event.newValue !== null ? JSON.parse(event.newValue) : initialValue)
				} catch {
					setValue(initialValue)
				}

				return
			}

			if (event.type !== LOCAL_STORAGE_SYNC_EVENT || event.detail?.key !== key) {
				return
			}

			setValue(event.detail.value)
		}

		window.addEventListener("storage", syncValue)
		window.addEventListener(LOCAL_STORAGE_SYNC_EVENT, syncValue)

		return () => {
			window.removeEventListener("storage", syncValue)
			window.removeEventListener(LOCAL_STORAGE_SYNC_EVENT, syncValue)
		}
	}, [key, initialValue])

	return [value, setStoredValue]
}
