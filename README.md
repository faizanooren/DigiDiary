# DigiDiary - Your Digital Journey

> **DigiDiary: your personal digital journey for mindful reflection, mood tracking, and daily growth – all in one space.**

## 🚀 Overview

DigiDiary is a full-stack web application built with the MERN stack (MongoDB, Express.js, React, Node.js) following strict MVC architecture. It's designed to help users maintain a digital diary with mood tracking, insights, and personal growth features.

## ✨ Features

### 🔐 Authentication
- ✅ User registration with email & password
- ✅ Secure login system
- ✅ "Forgot Password" flow with email-based recovery
- ✅ JWT token-based authentication
- ✅ Password hashing with bcrypt

### 👤 User Profile Management
- ✅ Editable profile with comprehensive fields:
  - Mobile number
  - Date of Birth
  - Hobby (with suggestions dropdown)
  - Profession
  - Institution/Company name (based on profession)
- ✅ Profile picture upload
- ✅ Theme preference (Light/Dark mode)

### 📊 Dashboard
- ✅ Personalized welcome message
- ✅ Quick action cards for navigation
- ✅ Statistics overview (total entries, average mood, days with DigiDiary)
- ✅ Recent journal entries with preview
- ✅ Responsive design with futuristic UI

### 📝 Journal Entry System
- ✅ Create, read, update, and delete journal entries
- ✅ Rich text content with media attachments (images/videos)
- ✅ Mood rating system (1-10 scale with emojis)
- ✅ Optional encryption for private entries
- ✅ Tagging system for organization
- ✅ Search functionality across titles, content, and tags
- ✅ Date filtering and mood filtering

### 🎨 UI/UX Features
- ✅ Light blue and white color theme
- ✅ Dark mode support
- ✅ Animated star particles background
- ✅ Responsive design for all devices
- ✅ Modern card-based layout
- ✅ Smooth animations and transitions
- ✅ Loading states and error handling

## 🏗️ Architecture

### Backend (MVC Structure)
```
server/
├── controllers/     # Business logic
│   ├── authController.js
│   ├── userController.js
│   └── journalController.js
├── models/          # Data models
│   ├── User.js
│   └── Journal.js
├── routes/          # API routes
│   ├── auth.js
│   ├── user.js
│   └── journal.js
├── middlewares/     # Custom middleware
│   ├── auth.js
│   └── upload.js
├── utils/           # Utility functions
│   └── sendEmail.js
└── server.js        # Main server file
```

### Frontend (React)
```
client/
├── src/
│   ├── components/  # Reusable components
│   │   └── Layout/
│   ├── contexts/    # React contexts
│   │   ├── AuthContext.js
│   │   └── ThemeContext.js
│   ├── pages/       # Page components
│   │   ├── Auth/
│   │   ├── Dashboard/
│   │   └── Journal/
│   └── App.js       # Main app component
```

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **multer** - File uploads
- **nodemailer** - Email sending
- **express-validator** - Input validation
- **helmet** - Security middleware
- **cors** - Cross-origin resource sharing

### Frontend
- **React 18** - UI library
- **React Router** - Client-side routing
- **React Query** - Data fetching
- **React Hook Form** - Form management
- **Axios** - HTTP client
- **Lucide React** - Icons
- **React Hot Toast** - Notifications
- **Framer Motion** - Animations

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd digidiary
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Environment Configuration

#### Server Environment
Create a `.env` file in the `server` directory:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/digidiary
# Or use MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/digidiary

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Email Configuration (for forgot password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Cloudinary Configuration (for media uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:3000
```

### 4. Database Setup
Make sure MongoDB is running locally or update the `MONGODB_URI` to point to your MongoDB Atlas cluster.

### 5. Start the Application

#### Development Mode
```bash
# From the root directory
npm run dev
```

This will start both the server (port 5000) and client (port 3000) concurrently.

#### Production Mode
```bash
# Build the client
cd client
npm run build

# Start the server
cd ../server
npm start
```

## 🚀 Usage

1. **Register/Login**: Create a new account or sign in with existing credentials
2. **Complete Profile**: Fill in your personal information and preferences
3. **Create Journal Entries**: Start writing about your day with mood tracking
4. **Explore Features**: Use the dashboard to navigate between different sections
5. **Customize**: Switch between light and dark themes

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `PUT /api/auth/reset-password/:token` - Reset password
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `PUT /api/user/profile-picture` - Update profile picture
- `PUT /api/user/change-password` - Change password
- `DELETE /api/user/account` - Delete account
- `GET /api/user/stats` - Get user statistics

### Journal Management
- `POST /api/journal` - Create journal entry
- `GET /api/journal` - Get journal entries (with pagination, search, filters)
- `GET /api/journal/:id` - Get single journal entry
- `PUT /api/journal/:id` - Update journal entry
- `DELETE /api/journal/:id` - Delete journal entry
- `GET /api/journal/stats` - Get journal statistics

## 🔧 Configuration

### Email Setup (for forgot password)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password
3. Use the App Password in the `EMAIL_PASS` environment variable

### File Uploads
The application supports local file uploads by default. For production, consider using Cloudinary or AWS S3.

## 🎨 Customization

### Colors
The color scheme can be customized by modifying CSS variables in `client/src/index.css`:
```css
:root {
  --primary-blue: #87CEEB;
  --primary-blue-light: #B0E0E6;
  --primary-blue-dark: #4682B4;
  /* ... other colors */
}
```

### Themes
The application supports light and dark themes. Theme switching is handled by the `ThemeContext`.

## 🚀 Deployment

### Backend Deployment
1. Set up a MongoDB database (MongoDB Atlas recommended)
2. Deploy to platforms like Heroku, Railway, or DigitalOcean
3. Configure environment variables
4. Set up email service for password reset functionality

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy to platforms like Vercel, Netlify, or AWS S3
3. Configure environment variables for API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Icons by [Lucide](https://lucide.dev/)
- UI inspiration from modern design systems
- Community feedback and suggestions

## 📞 Support

For support, email support@digidiary.com or create an issue in the repository.

---

**Made with ❤️ for mindful reflection and personal growth** 