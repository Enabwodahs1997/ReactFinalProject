# Project Q&A For Class 4/2/26

- best prompts used
- biggest mistakes from AI
- how debugging happened
- what they now understand better about React and AI

- I think the best prompts I used were clear pointed small requests that I was able to check along the way instead of massive changes
  which would have been hard to follow and be sure they were done correctly.
- Not implementing things correctly which would break the app and then I would have to do basic things like making sure the imports were correct and things like that. Nothing huge really happened because I tried not to rely on AI until I realized I was supposed to utlize it more for this project.
- Just one step at a time. I had to reason through what I wanted the app to do and how I wanted it to be interactive and how I wanted it to be styled. I injected previous code from other projects and had AI a piece at a time help me adapt them when needed. When I would run into an error I couldn't understand I had AI explain the error and asked Gemini as well if the fixes that Claude recommended were accurate or if I needed to change it a different way to be more effecint.
- I understand how react can both simplify and complicate things. It simplifys it by making less steps to get from point A to point B. However it can cause confusion if you don't know what types of things you want implimented and cannot look into how to impliment those aspects properly. It is a large part knowing what you want before and during the building process so you can properly build those aspects.
- For the AI prompt log I just made notes stating what I had AI help with and how and what the benifits were of doing so. Also, I didn't realize we were supposed to be leaning more heavily on AI for this project so I mostly used it for complex things like the date and basic things for the Tailwind so I could be more time effecient and then for error checks and help like that so I don't have a fancy log or anything I just noted as I went like I do with most of my other projects.

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
