# MyPeep - Book Collection Manager

A React application for managing your book collection with features like sorting, categorizing, and random book selection.

## Features

- User authentication
- Book collection management
- Sorting and filtering options
- Random book picker
- Custom categories and collections
- Tagging system
- Responsive design

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mypeep.git
cd mypeep
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your Firebase configuration:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

4. Start the development server:
```bash
npm run dev
```

## Deployment

This project is configured to deploy to GitHub Pages using GitHub Actions. The deployment will automatically trigger when you push to the main branch.

To deploy manually:
1. Go to the Actions tab in your GitHub repository
2. Select the "Deploy to GitHub Pages" workflow
3. Click "Run workflow"

## Technologies Used

- React
- TypeScript
- Vite
- Firebase
- GitHub Actions
- GitHub Pages
