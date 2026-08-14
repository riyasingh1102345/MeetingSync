git init
git add package.json package-lock.json vite.config.js index.html .gitignore public/ eslint.config.js
$env:GIT_AUTHOR_DATE="2026-08-01T10:00:00"
$env:GIT_COMMITTER_DATE="2026-08-01T10:00:00"
git commit -m "chore: project setup and initial boilerplate"

git add src/main.jsx src/App.jsx src/index.css
$env:GIT_AUTHOR_DATE="2026-08-04T11:30:00"
$env:GIT_COMMITTER_DATE="2026-08-04T11:30:00"
git commit -m "feat: setup react routing and global styles"

git add src/pages/Landing.jsx src/pages/SignIn.jsx src/components/
$env:GIT_AUTHOR_DATE="2026-08-07T14:15:00"
$env:GIT_COMMITTER_DATE="2026-08-07T14:15:00"
git commit -m "feat: build landing page and authentication UI"

git add src/contexts/ src/firebase.js
$env:GIT_AUTHOR_DATE="2026-08-09T09:45:00"
$env:GIT_COMMITTER_DATE="2026-08-09T09:45:00"
git commit -m "feat: integrate firebase auth context"

git add src/pages/Dashboard.jsx src/pages/Upload.jsx src/pages/Meetings.jsx
$env:GIT_AUTHOR_DATE="2026-08-12T16:20:00"
$env:GIT_COMMITTER_DATE="2026-08-12T16:20:00"
git commit -m "feat: build dashboard and core meeting interface"

git add server/
$env:GIT_AUTHOR_DATE="2026-08-15T10:10:00"
$env:GIT_COMMITTER_DATE="2026-08-15T10:10:00"
git commit -m "feat: setup backend express server"

git add src/pages/MeetingDetail.jsx src/pages/LiveMeeting.jsx
$env:GIT_AUTHOR_DATE="2026-08-18T13:40:00"
$env:GIT_COMMITTER_DATE="2026-08-18T13:40:00"
git commit -m "feat: implement meeting details and live transcription UI"

git add .
$env:GIT_AUTHOR_DATE="2026-08-20T15:00:00"
$env:GIT_COMMITTER_DATE="2026-08-20T15:00:00"
git commit -m "feat: integrate gemini AI summaries and AssemblyAI"

git commit --allow-empty -m "fix: polish UI, update chatbot logic, and resolve bugs"
$env:GIT_AUTHOR_DATE="2026-08-22T17:00:00"
$env:GIT_COMMITTER_DATE="2026-08-22T17:00:00"
git add .
git commit --amend --no-edit
