# Quiz App

React + Vite quiz app with local submission history.

## Run locally

```bash
npm install
npm run dev
```

## Build locally

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

This repo is configured to deploy automatically using GitHub Actions from `quiz-app`.

1. Push `main` to GitHub.
2. In GitHub, open `Settings -> Pages`.
3. Under `Build and deployment`, select `Source: GitHub Actions`.
4. Any push to `main` will deploy the latest build.

Expected site URL:

`https://dev-singh-kanyal.github.io/mock/`

## Where result table data is stored

Result/submission data is stored in browser local storage on the device where the quiz is used. It is not shared across different devices/browsers unless you add a backend (for example Firebase or Supabase).
