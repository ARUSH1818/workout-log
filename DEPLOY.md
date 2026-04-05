# Deploy IronLog To GitHub Pages

Your repository:

- `https://github.com/ARUSH1818/workout-log`

## Files to upload

Upload these from this folder to your GitHub repo root:

- `index.html`
- `styles.css`
- `app.js`
- `README.md`
- `.github/workflows/deploy-pages.yml`

## Then do this on GitHub

1. Open your repo.
2. Upload the files above if they are not there yet.
3. Open `Settings` -> `Pages`.
4. Under `Build and deployment`, choose `Source: GitHub Actions`.
5. Wait for the `Deploy GitHub Pages` workflow to finish.

## Your secure site URL

After deployment, your app should be available at:

- `https://arush1818.github.io/workout-log/`

## Important note

This app currently stores data in browser `localStorage`, so phone and laptop data will still be separate even after deployment. If you want syncing across devices, the next step is adding a backend/database.
