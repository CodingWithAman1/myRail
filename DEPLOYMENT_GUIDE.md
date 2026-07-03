# MyRail - Deployment Guide for Netlify + GitHub

## Files Ready for Deployment

✅ Your project is now ready to deploy on Netlify with GitHub integration!

## What Changed

1. **Created `netlify.toml`** - Configuration file for Netlify
2. **Created `netlify/functions/`** - Serverless functions directory
   - `train.js` - Handles train information requests
   - `train-live.js` - Handles live train status requests
3. **Updated `app.js`** - Now calls `/.netlify/functions/train`
4. **Updated `app2.js`** - Now calls `/.netlify/functions/train-live`
5. **Renamed `INDEX.HTML`** → `index.html` (case-sensitive fix)

## Deployment Steps

### Step 1: Set Up Git Repository
```bash
cd c:\Users\lenovo\OneDrive\Desktop\myRail
git init
git add .
git commit -m "Initial commit: MyRail app ready for Netlify"
git remote add origin https://github.com/<your-username>/myRail.git
git branch -M main
git push -u origin main
```

### Step 2: Connect to Netlify
1. Go to [netlify.com](https://netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Select **GitHub** and authorize Netlify
4. Choose your `myRail` repository
5. Build settings should auto-fill:
   - Build command: `npm install`
   - Publish directory: `.`
6. Click **Deploy**

### Step 3: Add Environment Variables
1. In Netlify dashboard, go to **Site settings**
2. Navigate to **Build & Deploy** → **Environment**
3. Click **Edit variables**
4. Add:
   - Key: `RAILRADAR_API_KEY`
   - Value: `your_railradar_api_key`
5. Deploy again (push to GitHub or redeploy manually)

## Getting Your RailRadar API Key

Visit [railradar.in](https://railradar.in) and sign up for an API key.

## Important Notes

- ⚠️ Never commit `.env` file with your API key
- Use `.env.example` as a template for environment variables
- The `server.js` file is no longer needed in production (serverless functions replace it)
- Keep `package.json` - Netlify uses it for dependencies
- All dependencies are already installed in `package.json`

## Testing Locally (Optional)

To test with Netlify Functions locally:
```bash
npm install -g netlify-cli
netlify dev
```

Then visit `http://localhost:8888`

## Troubleshooting

- **404 errors on API calls**: Check that environment variables are set in Netlify
- **CORS errors**: Netlify Functions handle this automatically
- **Function not found**: Ensure `netlify.toml` is in root directory

Happy deploying! 🚀
