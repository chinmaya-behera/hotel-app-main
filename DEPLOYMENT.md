# Grand Atelier deployment

Repository: https://github.com/chinmaya-behera/Grand-Atelier

Live project: atelier-hotel-preview (prj_6VCWLWH6pQNMic6yZfi5JL5qJfFM) in chinmayabehera946-8581s-projects. Production branch: main. Root Directory: public-preview. Node.js: 24.x. Install: npm ci. Build: npm run build.

Domains: https://devatelier.tech and https://www.devatelier.tech.

On 3 November 2026 the current local hotel-app-main folder and its Git history were published to Grand-Atelier. The existing Vercel project was connected to the new repo, preserving its database, email configuration, logins and domain bindings. The old repo is retained as local remote hotel-app-source; origin points to Grand-Atelier.

The old NEXT_NO_VERSION build failure was corrected by selecting public-preview as the build root. The new source passed 85 domain tests and a successful Vercel production build. The initial migrated release is dpl_E3k2Pvpr7Q3G2u75PWPypPGDEuzX.

Keep environment variables and demo passwords out of Git. The separate public-preview Vercel project was not reconnected by this migration; this repo drives the project serving devatelier.tech.
