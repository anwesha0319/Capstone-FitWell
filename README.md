# FitWell - AI-Powered Fitness & Health Tracking App

A comprehensive React Native mobile application with Django backend that helps users track their fitness journey, monitor health metrics, and receive AI-powered personalized recommendations.

## Features

### 📊 Health Tracking
- **Activity Monitoring**: Track daily steps, calories burned, distance, and active minutes
- **Body Metrics**: Monitor weight, height, BMI with progress charts
- **Vital Signs**: Track heart rate, SpO2, blood pressure, and temperature
- **Sleep Analysis**: Monitor sleep duration, quality, and patterns
- **Nutrition Tracking**: Log meals, track macros, and monitor hydration
- **Lifestyle Insights**: Track smoking, alcohol consumption, and dietary preferences

### 🤖 AI-Powered Features
- **Personalized Meal Plans**: AI-generated meal plans based on your profile and goals
- **Workout Recommendations**: Custom workout plans tailored to your fitness level
- **Marathon Training**: Specialized training plans for marathon preparation
- **Smart Insights**: AI-driven health recommendations and progress analysis

### 🎨 Modern UI/UX
- **Glassmorphism Design**: Beautiful frosted glass effects with real blur
- **Dark/Light Mode**: Seamless theme switching with optimized colors
- **Smooth Animations**: Fluid transitions and interactive elements
- **Responsive Layout**: Optimized for all screen sizes

### 🔗 Integrations
- **Google Health Connect**: Sync health data from various fitness apps
- **Real-time Food Images**: Powered by Unsplash API for meal visualization
- **Cloud Sync**: Automatic data synchronization across devices

## 🛠️ Tech Stack

### Frontend
- **React Native** - Cross-platform mobile development
- **React Navigation** - Navigation and routing
- **React Native Linear Gradient** - Gradient backgrounds
- **@react-native-community/blur** - Real blur effects for glassmorphism
- **React Native Vector Icons** - Icon library
- **React Native Chart Kit** - Data visualization
- **Axios** - HTTP client for API calls
- **AsyncStorage** - Local data persistence

### Backend
- **Django** - Python web framework
- **Django REST Framework** - RESTful API development
- **PostgreSQL** - Database
- **JWT Authentication** - Secure user authentication
- **OpenAI API** - AI-powered recommendations
- **Machine Learning Models** - Custom ML models for predictions

## 📱 Screenshots

### Home & Analytics
- Dashboard with daily health summary
- Interactive charts and progress tracking
- Real-time health metrics display

### AI Features
- Personalized meal plans with food images
- Custom workout routines
- Marathon training schedules

### Profile & Settings
- User profile management
- Health goals and preferences
- Theme customization

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Python (v3.8 or higher)
- React Native development environment
- Android Studio / Xcode
- PostgreSQL database

### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables**
Create a `.env` file in the backend directory:
```env
SECRET_KEY=your_django_secret_key
DEBUG=True
DATABASE_URL=postgresql://user:password@localhost:5432/fitwell
OPENAI_API_KEY=your_openai_api_key
```

5. **Run migrations**
```bash
python manage.py migrate
```

6. **Create superuser**
```bash
python manage.py createsuperuser
```

7. **Start development server**
```bash
python manage.py runserver
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontendBare
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure API endpoint**
Update the API base URL in `src/api/client.js`:
```javascript
const API_BASE_URL = 'http://YOUR_IP_ADDRESS:8000/api';
```

4. **Install iOS dependencies (Mac only)**
```bash
cd ios
pod install
cd ..
```

5. **Start Metro bundler**
```bash
npm start
```

6. **Run on Android**
```bash
npm run android
```

7. **Run on iOS (Mac only)**
```bash
npm run ios
```

## 🔑 API Configuration

### Unsplash API (Optional - for food images)
1. Get API key from [Unsplash Developers](https://unsplash.com/developers)
2. Update `src/services/unsplashService.js`:
```javascript
const UNSPLASH_ACCESS_KEY = 'your_unsplash_access_key';
```

### OpenAI API (Required for AI features)
1. Get API key from [OpenAI Platform](https://platform.openai.com/)
2. Add to backend `.env` file

## 📂 Project Structure

```
FitWell/
├── backend/                    # Django backend
│   ├── accounts/              # User authentication
│   ├── health_data/           # Health metrics models
│   ├── ml_models/             # AI/ML features
│   └── fitness_backend/       # Main Django settings
│
├── frontendBare/              # React Native frontend
│   ├── src/
│   │   ├── api/              # API client
│   │   ├── components/       # Reusable components
│   │   ├── context/          # Theme & state management
│   │   ├── navigation/       # Navigation setup
│   │   ├── screens/          # App screens
│   │   ├── services/         # External services
│   │   └── utils/            # Helper functions
│   ├── android/              # Android native code
│   └── ios/                  # iOS native code
│
└── README.md                  # This file
```

## 🎨 Design System

### Glassmorphism Theme
- **Light Mode**: Soft purple gradients with frosted glass cards
- **Dark Mode**: Deep purple tones with translucent elements
- **Glass Effects**: Real blur using @react-native-community/blur
- **Shadows**: Soft purple shadows for depth
- **Icons**: Mode-aware colors for perfect visibility

### Color Palette
- **Primary**: Purple (#8B5CF6)
- **Accent**: Light Purple (#A78BFA)
- **Success**: Mint Green (#10B981)
- **Warning**: Soft Yellow (#FDE68A)
- **Error**: Soft Pink (#EC4899)

## 🔐 Authentication

The app uses JWT (JSON Web Tokens) for secure authentication:
- Token-based authentication
- Automatic token refresh
- Secure storage using AsyncStorage
- Protected API endpoints

## 📊 Health Data Sync

### Google Health Connect Integration
1. Install Health Connect app on Android device
2. Grant permissions in app settings
3. Data syncs automatically in background
4. Supports: Steps, Heart Rate, Sleep, Calories, etc.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is part of a Capstone project and is for educational purposes.

## 👥 Team

- **Developer**: Anwesha
- **Project Type**: Capstone Fitness Application
- **Year**: 2026

## 🐛 Known Issues

- Health Connect requires Android 12+ for full functionality
- iOS Health Kit integration pending
- Some ML features require active internet connection

## 🔮 Future Enhancements

- [ ] iOS HealthKit integration
- [ ] Social features (friend challenges, leaderboards)
- [ ] Wearable device integration (Fitbit, Apple Watch)
- [ ] Offline mode with local ML models
- [ ] Voice-guided workouts
- [ ] Meal photo recognition
- [ ] Integration with more fitness apps

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact: [Your Email]

## 🙏 Acknowledgments

- OpenAI for AI-powered recommendations
- Unsplash for food imagery
- React Native community for excellent libraries
- Django REST Framework for robust API development

---

**Made with ❤️ for a healthier lifestyle**

🌟 Star this repo if you find it helpful!
