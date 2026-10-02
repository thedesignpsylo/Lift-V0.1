# Go Lift

A no-build workout app (PWA) with two profiles: **Woman** and **Man**.

## Deploy
1. Push this folder to a private GitHub repo.
2. On vercel.com: Add New → Project → import the repo → Deploy (no settings needed).
3. Open the link on each phone → Share → Add to Home Screen (iPhone) or ⋮ → Install app (Android).

## Where progress is saved
Everything (sessions, sets, weights, measurements, start date) is saved automatically on the phone,
inside the installed app. Each profile has its own save. Nothing goes to a server.

- Keep the same URL. A new Vercel domain = a fresh, empty app.
- Progress > Backup > Download backup every week or two. Restore brings it back on a new phone.
- Deleting the home-screen app or clearing browser data erases progress, so back up first.

## Profiles
- `data/woman.js`, `data/man.js` hold each plan. `data/exercises.js` holds the exercise library,
  photos, how-to steps and keep-in-mind cues.
- Levels count in weeks from the start date (first session, editable in Plan), so friends can start any day.
- `?p=woman` or `?p=man` opens a profile directly.
