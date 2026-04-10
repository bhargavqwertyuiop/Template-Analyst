# Template Analyst

A React + Vite application for analyzing CCM templates and detecting security risks.

## Setup

### Prerequisites
- Node.js (v18 or higher)
- npm

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Template-Analyst
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Fill in your Firebase configuration values:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your Firebase project values from the Firebase Console.

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

### Firebase Configuration

The application uses Firebase for authentication and data storage. You need to:

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication and Firestore
3. Get your configuration values from Project Settings > General > Your apps
4. Add the values to your `.env` file

### GitHub Deployment

The application is configured to deploy to GitHub Pages. Make sure to set up the following secrets in your GitHub repository:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

These should match the values in your Firebase project configuration.

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run TypeScript linting
- `npm run clean` - Clean build directory