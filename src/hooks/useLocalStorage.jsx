import { useState, useEffect, useCallback, useRef, useId } from "react"

const LOCAL_STORAGE_SYNC_EVENT = "local-storage-sync"
//used this from a previous project, it is a custom hook that allows you 
// to use localStorage in a React component.
//I had AI make sure it handles edge cases, such as when localStorage is not available 
// (e.g., in private browsing mode) and ensures that the application continues to 
// function without crashing.
//I also had AI implement a synchronization mechanism using custom events to ensure that 
// changes to localStorage in one instance of the application are reflected across all instances, 
// which is particularly useful when multiple tabs or windows are open.

export function useLocalStorage(key, initialValue) {
	const instanceId = useId()
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
	const valueRef = useRef(value)

	useEffect(() => {
		valueRef.current = value
	}, [value])

	const setStoredValue = useCallback((nextValueOrUpdater) => {
		const nextValue =
			typeof nextValueOrUpdater === "function"
				? nextValueOrUpdater(valueRef.current)
				: nextValueOrUpdater

		valueRef.current = nextValue
		setValue(nextValue)

		try {
			localStorage.setItem(key, JSON.stringify(nextValue))
			window.dispatchEvent(
				new CustomEvent(LOCAL_STORAGE_SYNC_EVENT, {
					detail: { key, value: nextValue, source: instanceId },
				})
			)
		} catch {
			// Ignore write failures (private mode/full storage) and keep app running.
		}
	}, [key, instanceId])

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

			if (event.detail.source === instanceId) {
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
	}, [key, initialValue, instanceId])

	return [value, setStoredValue]
}
