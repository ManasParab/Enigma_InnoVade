# VitalCircle Backend Setup Guide

This guide will walk you through setting up the VitalCircle backend with Firebase and Google Gemini AI integration.

## 📋 Prerequisites

Before starting, ensure you have:
- Node.js (v16 or higher) installed
- A Firebase project
- A Google Gemini AI API key
- Access to Firebase Console

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Firebase Setup

#### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select existing project
3. Enable Firestore Database:
   - Go to "Firestore Database" in the console
   - Click "Create database"
   - Choose "Start in test mode" (for development)
   - Select a location

#### Step 2: Enable Authentication
1. Go to "Authentication" in Firebase Console
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" authentication

#### Step 3: Generate Service Account Key
1. Go to Project Settings (gear icon)
2. Go to "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file
5. Keep this file secure - you'll need the values for your .env file

#### Step 4: Set Firestore Security Rules (Development)
In Firestore console, go to "Rules" and use these rules for development:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Users can read/write their own vitals
      match /vitals/{vitalId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### 3. Google Gemini AI Setup

#### Get API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 4. Environment Configuration

#### Copy and Configure .env
```bash
cp .env.example .env
```

Now edit `.env` with your actual values:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Firebase Configuration (from your downloaded service account JSON)
FIREBASE_PROJECT_ID=your-actual-project-id
FIREBASE_PRIVATE_KEY_ID=your-actual-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-actual-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-actual-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com

# Google Gemini AI Configuration
GEMINI_API_KEY=your-actual-gemini-api-key

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

**Important Notes:**
- Replace ALL placeholder values with your actual credentials
- The `FIREBASE_PRIVATE_KEY` must include `\n` characters for line breaks
- Keep your `.env` file secure and never commit it to version control

### 5. Start the Server

#### Development Mode
```bash
npm run dev
```

#### Production Mode  
```bash
npm start
```

The server will start on `http://localhost:3001`

## 🧪 Testing the Setup

### Test Server Health
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "success": true,
  "message": "VitalCircle Backend API is running",
  "timestamp": "2024-01-20T10:00:00.000Z",
  "version": "1.0.0"
}
```

### Test AI Service
```bash
curl http://localhost:3001/api/ai-status
```

Expected response:
```json
{
  "success": true,
  "data": {
    "aiService": "Gemini AI",
    "status": "operational",
    "initialized": true,
    "timestamp": "2024-01-20T10:00:00.000Z"
  }
}
```

## 📚 API Endpoints

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "fullName": "John Doe",
  "healthConditions": ["Hypertension", "Type 2 Diabetes"]
}
```

#### Login (Verify Firebase Token)
```http
POST /api/auth/login
Content-Type: application/json

{
  "idToken": "firebase_id_token_from_frontend"
}
```

#### Get Profile (Protected)
```http
GET /api/auth/profile
Authorization: Bearer <firebase_id_token>
```

### AI/Gemini Endpoints

#### General AI Prompt (Protected)
```http
POST /api/gemini-prompt
Authorization: Bearer <firebase_id_token>
Content-Type: application/json

{
  "prompt": "How can I improve my blood pressure management?",
  "context": {
    "analysisType": "health",
    "includeVitals": true
  }
}
```

#### Health Analysis (Protected)
```http
POST /api/health-analysis
Authorization: Bearer <firebase_id_token>
Content-Type: application/json

{
  "analysisType": "wellness-score",
  "days": 30
}
```

## 🔐 Frontend Integration

### Frontend Authentication Flow

1. **User Registration/Login**: Use Firebase Auth in your frontend
2. **Get ID Token**: After successful auth, get the user's ID token
3. **Send Requests**: Include the token in Authorization headers

Example frontend code:
```javascript
// Get current user's ID token
const user = firebase.auth().currentUser;
const idToken = await user.getIdToken();

// Make API request
const response = await fetch('http://localhost:3001/api/auth/profile', {
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  }
});
```

### Frontend Registration
```javascript
// Register with backend
const registerUser = async (email, password, fullName, healthConditions) => {
  const response = await fetch('http://localhost:3001/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      password,
      fullName,
      healthConditions
    })
  });
  
  return response.json();
};
```

### Frontend Login Verification
```javascript
// After Firebase auth success, verify with backend
const loginUser = async (user) => {
  const idToken = await user.getIdToken();
  
  const response = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      idToken
    })
  });
  
  return response.json();
};
```

## 🚨 Troubleshooting

### Firebase Connection Issues
- Verify all Firebase credentials in `.env` are correct
- Check that Firestore is enabled in your Firebase project
- Ensure Authentication is enabled with Email/Password
- Verify your service account has proper permissions

### Gemini AI Issues
- Check that your API key is valid and active
- Verify you have quota/credits available
- Check if the content passes safety filters

### CORS Issues
- Update `ALLOWED_ORIGINS` in `.env` to include your frontend URL
- Ensure your frontend is making requests to the correct backend URL

### Common Error Messages

#### "Missing required environment variables"
- Check that all required variables in `.env` are set
- Verify there are no typos in variable names

#### "Firebase initialization failed"
- Double-check your Firebase credentials
- Ensure the private key includes proper line breaks (`\n`)

#### "Gemini AI initialization failed"
- Verify your Gemini API key is correct
- Check your internet connection
- Ensure the API key has proper permissions

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── firebase.js      # Firebase Admin SDK config
│   │   └── gemini.js        # Gemini AI config
│   ├── middleware/
│   │   └── auth.js          # Authentication middleware
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   └── gemini.js        # AI/Gemini routes
│   └── utils/
│       └── logger.js        # Winston logger
├── .env                     # Environment variables (configure this!)
├── .env.example            # Environment template
├── package.json            # Dependencies
└── server.js              # Main application
```

## 🔧 Development Tips

1. **Use Development Mode**: Run `npm run dev` for auto-restart on changes
2. **Check Logs**: Monitor console output for debugging information
3. **Test Endpoints**: Use tools like Postman or curl to test API endpoints
4. **Firebase Console**: Monitor authentication and database in Firebase Console
5. **Security**: Never commit `.env` file or expose credentials

## 📞 Support

If you encounter issues:

1. Check the console logs for detailed error messages
2. Verify all environment variables are correctly set
3. Test individual components (Firebase, Gemini) separately
4. Review the Firebase and Gemini AI documentation
5. Ensure your internet connection is stable

---

**✅ Once setup is complete, your backend will be ready to handle user authentication, AI-powered health insights, and seamless integration with your React frontend!**