# Final React Project

A rustic forest-themed task manager built with React and Vite.

## Features Included

- Add tasks with a title and description
- Mark tasks as complete using a checkbox
- Delete individual tasks
- Clear all tasks with one button
- Live task stats (total tasks and completed tasks)
- Filter/search tasks by title or description
- Data persistence using localStorage (tasks remain after refresh)
- Responsive layout and custom forest/rustic styling

## What Is Used

### Frontend

- React 19
- React DOM
- Vite 8

### Project Structure

- Functional React components
- Custom hooks:
  - `useLocalStorage` for persistence
  - `useFilterTasks` for task filtering

### Tooling

- ESLint 9
- `@vitejs/plugin-react`

## Available Scripts

- `npm run dev` - start development server
- `npm run build` - create production build
- `npm run preview` - preview production build locally
- `npm run lint` - run lint checks

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npm run dev
```

3. Open the local URL shown in the terminal.
