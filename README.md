# Guardient

A comprehensive security analysis tool for CCM (Customer Communications Management) templates. This application helps organizations identify and mitigate security risks in their document templates by analyzing variable data for sensitive information exposure.

**Access the Application at https://bhargavqwertyuiop.github.io/Template-Analyst/** 
## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Firebase project with Authentication and Firestore enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/bhargavqwertyuiop/Template-Analyst.git
   cd Template-Analyst
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   Fill in your Firebase configuration values in the `.env` file.

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication and Firestore Database
3. Add a web app to get your configuration
4. Copy the config values to your `.env` file

## What It Does

Guardient is designed to help security teams and developers:

- **Analyze Template Variables**: Automatically extract and analyze variables from complex template structures
- **Detect Sensitive Data**: Identify PII (Personally Identifiable Information), financial data, security credentials, and other sensitive information
- **Risk Assessment**: Categorize variables by risk level (High, Medium, Low, Safe) based on configurable dictionaries
- **Visual Dashboards**: Interactive charts and reports for prioritizing security fixes
- **Template Management**: Organize and track analysis results across different template types (Base Templates, Blocks, Snippets)
- **Historical Tracking**: Maintain analysis history with user authentication and data persistence

## Key Features

### 🔍 **Intelligent Analysis**
- Automatic extraction of variables from nested object paths
- Configurable sensitive data dictionaries
- Risk scoring based on data categories (Email, PII, Financial, Security, Contact)

### 📊 **Interactive Dashboards**
- Real-time statistics and charts
- Template-specific risk reports
- Variable-level analysis with filtering and search
- Export capabilities (CSV, PDF)

### 🔐 **Security & Compliance**
- User authentication and authorization
- Secure data storage with Firebase
- Configurable security dictionaries
- Audit trails and analysis history

### 🎯 **Template Types Support**
- Base Templates (Master templates)
- Blocks (Reusable components)
- Snippets (Small template fragments)
- Full template hierarchies

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore)
- **Charts**: Recharts
- **PDF Export**: jsPDF
- **Data Processing**: PapaParse for CSV handling

## Usage

### 1. Authentication
- Sign up or log in to access the application
- User sessions are managed securely with Firebase Auth

### 2. Upload Data
- Upload CSV files containing template analysis data
- The application processes Quadient Inspire analysis exports

### 3. Configure Dictionaries
- Customize sensitive data keywords through the Dictionary Manager
- Add organization-specific terms and patterns

### 4. Analyze Results
- View dashboard statistics and risk distributions
- Drill down into specific templates and variables
- Filter by risk level, category, or template type

### 5. Export Reports
- Generate PDF reports for compliance documentation
- Export filtered data as CSV for further analysis

## Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── Dashboard.tsx   # Main dashboard with charts
│   ├── FileUpload.tsx  # File upload interface
│   ├── TemplateAnalysis.tsx # Template analysis views
│   └── ...
├── context/            # React context providers
├── lib/               # Utility functions and types
├── firebase.ts        # Firebase configuration
└── App.tsx           # Main application component
```

## Deployment

### GitHub Pages
The application is configured for automatic deployment to GitHub Pages:

1. Set up GitHub repository secrets with Firebase configuration
2. Push to the `main` branch
3. GitHub Actions will build and deploy automatically

### Environment Variables for Production
Ensure these secrets are set in your GitHub repository:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting: `npm run lint`
5. Submit a pull request

## Security Considerations

- All sensitive data processing happens client-side
- Firebase security rules should be configured to restrict data access
- Environment variables contain only public Firebase configuration
- User authentication is required for all data operations

## License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details.

## Support

For questions or issues:
- Check the Firebase configuration
- Ensure Firestore security rules are properly set
- Verify CSV file format matches expected structure
- Review browser console for detailed error messages
