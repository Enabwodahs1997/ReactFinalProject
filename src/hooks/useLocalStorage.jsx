import { useState, useEffect } from "react"

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

	useEffect(() => {
		try {
			localStorage.setItem(key, JSON.stringify(value))
		} catch {
			// Ignore write failures (private mode/full storage) and keep app running.
		}
	}, [key, value])

	return [value, setValue]
}
