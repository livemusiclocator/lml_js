# Deploying Live Music Locator to Firebase

This guide will help you deploy your Live Music Locator application to Firebase Hosting.

## Prerequisites

1. You need a Firebase account (you can create one at [firebase.google.com](https://firebase.google.com))
2. You need to create a Firebase project in the Firebase Console

## Steps to Deploy

### 1. Install Firebase CLI (if not already done)

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

### 3. Initialize Firebase in your project directory (first time only)

```bash
cd /Users/mark/code/github/livemusiclocator/lml_js
firebase init hosting
```

When prompted:
- Select your Firebase project
- Use `dist` as your public directory (this is where Vite will build your app)
- Configure as a single-page app (rewrite all URLs to /index.html): Yes
- Set up automatic builds and deploys with GitHub: No (unless you want this feature)

### 4. Update your .firebaserc file

Edit the `.firebaserc` file to include your Firebase project ID:

```json
{
  "projects": {
    "default": "YOUR_FIREBASE_PROJECT_ID"
  }
}
```

Replace `YOUR_FIREBASE_PROJECT_ID` with your actual Firebase project ID from the Firebase console.

### 5. Build your application

```bash
npm run build
```

This will create a `dist` directory with your compiled application.

### 6. Deploy to Firebase

```bash
firebase deploy
```

### 7. View your deployed application

After successful deployment, Firebase will provide a URL where your application is hosted, typically:
`https://YOUR_PROJECT_ID.web.app`

## Subsequent Deployments

For future updates, you only need to:

1. Build your application: `npm run build`
2. Deploy to Firebase: `firebase deploy`

## Environment Variables

Make sure your Firebase project has the necessary environment variables set up. For this app, you need:

- `VITE_GOOGLE_MAPS_API_KEY`: Your Google Maps API key

You can set these in the Firebase console under Project Settings > Service accounts > Environment variables.

## Troubleshooting

- If you encounter CORS issues with the API, you may need to configure CORS settings on your API or use a proxy.
- Make sure your Google Maps API key has the necessary permissions and restrictions.
- If you see a blank page, check the browser console for errors.