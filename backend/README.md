# VitalCircle Backend API

A comprehensive Node.js backend for the VitalCircle health management application, featuring Firebase Firestore integration, Google Gemini AI analysis, and robust health data management.

## 🚀 Features

- **User Authentication** - Firebase Auth integration with secure token verification
- **Health Data Management** - Complete vitals logging and history tracking
- **AI-Powered Insights** - Google Gemini API integration for personalized health analysis
- **Real-time Dashboard** - Comprehensive health data aggregation and visualization
- **Hybrid AI Analysis** - Combines template-based analysis with AI intelligence
- **Robust Security** - Rate limiting, CORS protection, input validation
- **Comprehensive Logging** - Winston-based logging with error tracking

## 📋 Prerequisites

- Node.js 16.x or higher
- npm or yarn package manager
- Firebase project with Firestore enabled
- Google Gemini AI API key

## 🛠️ Installation & Setup

### 1. Clone and Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy the environment template:
```bash
cp .env.example .env
```

Configure your `.env` file with the following:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Firebase Configuration (from Firebase Console > Project Settings > Service Accounts)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_private_key_here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your_project_id.iam.gserviceaccount.com

# Google Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 3. Firebase Setup

1. **Create Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Firestore Database

2. **Generate Service Account:**
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Download the JSON file
   - Use the values to populate your `.env` file

3. **Configure Authentication:**
   - Enable Email/Password authentication in Firebase Console
   - Set up security rules for Firestore

### 4. Google Gemini API Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Generate an API key
3. Add it to your `.env` file as `GEMINI_API_KEY`

### 5. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3001`

## 📚 API Documentation

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

#### Get User Profile (Authenticated)
```http
GET /api/auth/profile
Authorization: Bearer <firebase_token>
```

### Vitals Endpoints

#### Log Vitals (Authenticated)
```http
POST /api/vitals
Authorization: Bearer <firebase_token>
Content-Type: application/json

{
  "date": "2024-01-20T10:00:00Z",
  "bloodPressureSystolic": 120,
  "bloodPressureDiastolic": 80,
  "heartRate": 72,
  "weight": 150.5,
  "temperature": 98.6,
  "mood": "good",
  "notes": "Feeling great today!"
}
```

#### Get Vitals History (Authenticated)
```http
GET /api/vitals?days=30&limit=100
Authorization: Bearer <firebase_token>
```

### Dashboard Endpoints

#### Get Complete Dashboard (Authenticated)
```http
GET /api/dashboard?days=30
Authorization: Bearer <firebase_token>
```

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "fullName": "John Doe",
      "healthConditions": ["Hypertension"]
    },
    "vitals": {
      "latest": { /* latest vital signs */ },
      "history": [ /* recent entries */ ],
      "total": 25,
      "period": "30 days"
    },
    "charts": {
      "bloodPressure": [ /* chart data */ ],
      "heartRate": [ /* chart data */ ],
      "weight": [ /* chart data */ ]
    },
    "ai": {
      "stabilityScore": {
        "score": 85,
        "summary": "Your vitals show stable patterns...",
        "riskForecast": "Low risk in the next 48 hours..."
      },
      "nudges": {
        "diet": "Consider adding more potassium-rich foods...",
        "personalCare": "Your stress levels seem elevated...",
        "social": "Connecting with friends can help..."
      }
    },
    "statistics": { /* vital statistics */ }
  }
}
```

## 🤖 AI Integration

The backend uses a **hybrid AI model** that combines:

1. **Template-based Analysis** - Direct comparison with medical datasets
2. **Google Gemini AI** - Advanced pattern recognition and personalization

### Health Datasets

The system includes three comprehensive datasets:
- **Hypertension** (`src/data/hypertension.json`)
- **Diabetes** (`src/data/diabetes.json`)  
- **Heart Risk** (`src/data/heartrisk.json`)

Each dataset contains patterns for:
- **Stable** - Healthy management patterns
- **At-Risk** - Warning indicators
- **Critical** - Immediate attention needed

### AI Features

1. **Stability Score Calculation**
   - Analyzes last 30 days of vitals
   - Compares against relevant datasets
   - Provides 0-100 wellness score

2. **Personalized Nudges**
   - Diet recommendations based on latest readings
   - Personal care suggestions
   - Social wellness advice

## 🗄️ Database Structure

### Firestore Collections

```
users/
  {userId}/
    - id: string
    - email: string  
    - fullName: string
    - healthConditions: array
    - createdAt: timestamp
    - updatedAt: timestamp
    
    vitals/
      {vitalId}/
        - userId: string
        - date: timestamp
        - bloodPressureSystolic: number
        - bloodPressureDiastolic: number
        - heartRate: number
        - weight: number
        - temperature: number
        - mood: string
        - notes: string
        - timestamp: timestamp
        - createdAt: timestamp
```

## 🔒 Security Features

- **Rate Limiting** - 100 requests per 15 minutes per IP
- **CORS Protection** - Configurable allowed origins
- **Input Validation** - Joi schema validation for all inputs
- **Authentication** - Firebase token verification
- **Request Logging** - Comprehensive request/error logging
- **Data Sanitization** - Automatic data cleaning and validation

## 📊 Monitoring & Logging

Logs are stored in the `logs/` directory:
- `combined.log` - All application logs
- `error.log` - Error logs only

Log levels:
- `error` - System errors and exceptions
- `warn` - Warning messages
- `info` - General application flow
- `debug` - Detailed debugging information

## 🚀 Deployment

### Environment Setup
```bash
# Set production environment
NODE_ENV=production

# Update allowed origins for your domain
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 🧪 Testing

```bash
# Run tests
npm test

# Test with different environments
NODE_ENV=test npm test
```

## 📈 API Response Format

All API responses follow this consistent format:

```json
{
  "success": true|false,
  "message": "Human readable message",
  "data": { /* Response data */ },
  "errors": [ /* Validation errors if any */ ]
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **Firebase Connection Issues**
   - Verify your Firebase credentials in `.env`
   - Check Firestore security rules
   - Ensure proper service account permissions

2. **Gemini API Issues**
   - Verify API key is correct
   - Check API quota limits
   - Ensure proper error handling for fallback responses

3. **CORS Errors**
   - Update `ALLOWED_ORIGINS` in `.env`
   - Check frontend URL configuration

### Health Check

Test if the server is running:
```bash
curl http://localhost:3001/health
```

### Debug Mode

Enable detailed logging:
```bash
NODE_ENV=development npm run dev
```

## 📞 Support

For support and questions:
- Check the logs in the `logs/` directory
- Review the error responses for detailed error codes
- Verify environment configuration
- Test with the provided health endpoint

---

**Built with ❤️ for better health management**