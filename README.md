# Market Rental Management System - Next.js

A comprehensive market rental management system built with Next.js, TypeScript, Tailwind CSS, and Firebase.

## 🚀 Features

### For Administrators
- **Dashboard**: Complete overview of market operations
- **Room Management**: Manage 420+ rental spaces
- **Tenant Management**: Complete tenant information system
- **Payment Collection**: Track and collect rental payments
- **Receipt Management**: Generate and print receipts
- **Reports & Analytics**: Comprehensive reporting system
- **User Management**: Manage system users
- **Settings**: System configuration
- **Notifications**: Real-time alerts and notifications

### For Employees
- **Employee Dashboard**: Personal performance tracking
- **Payment Collection**: Collect rental payments
- **Receipt Printing**: Generate receipts
- **Room Search**: Find room information
- **Work Schedule**: Daily task management
- **Notifications**: Work-related alerts

## 🛠 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Icons**: Lucide React
- **State Management**: React Context API

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd market-rental-nextjs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Firestore Database
   - Enable Authentication
   - Copy your Firebase config

4. **Environment Variables**
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in your Firebase configuration in `.env.local`

5. **Run the development server**
   ```bash
   npm run dev
   ```

## 🔥 Firebase Setup

### 1. Firestore Collections

The system uses the following Firestore collections:

- `rooms` - Room information
- `tenants` - Tenant details
- `payments` - Payment records
- `receipts` - Receipt data
- `users` - User accounts
- `notifications` - System notifications

### 2. Authentication

Set up Firebase Authentication with Email/Password provider.

### 3. Security Rules

Configure Firestore security rules to protect your data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admin and employees can access business data
    match /{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'employee'];
    }
  }
}
```

## 🎯 Usage

### Demo Accounts

The system includes demo accounts for testing (works with local demo data):

- **Admin**: `admin` / `password123`
- **Employee**: `employee1` / `password123`

### Firebase Authentication Setup

To enable Firebase authentication for demo accounts:

1. **Enable Email/Password Authentication**:
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable "Email/Password" provider

2. **Create Demo Users in Firebase**:
   - Go to Authentication → Users → Add user
   - Create user: `admin@dongkhamxang-market.firebaseapp.com` / `password123`
   - Create user: `employee1@dongkhamxang-market.firebaseapp.com` / `password123`

3. **Add User Data to Firestore**:
   - The system will automatically create user documents in Firestore upon first login

### Firebase Integration

The system is designed to work with Firebase but includes fallback demo data for development. To enable full Firebase integration:

1. Update `lib/firebase/config.ts` with your Firebase config
2. Uncomment Firebase operations in `lib/contexts/DataContext.tsx`
3. Uncomment Firebase authentication in `lib/contexts/AuthContext.tsx`

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── Auth/             # Authentication components
│   ├── Dashboard/        # Dashboard components
│   ├── Layout/           # Layout components
│   ├── Payments/         # Payment components
│   └── ...               # Other feature components
├── lib/                  # Utilities and configurations
│   ├── contexts/         # React contexts
│   ├── firebase/         # Firebase configuration
│   └── ...
├── types/                # TypeScript type definitions
└── ...
```

## 🔧 Development

### Adding New Features

1. Create components in the appropriate `components/` subdirectory
2. Add types to `types/index.ts`
3. Update Firebase services in `lib/firebase/`
4. Add routes if needed

### Firebase CRUD Operations

Use the provided Firebase services:

```typescript
import { roomsService } from '@/lib/firebase/firestore';

// Create
const newRoom = await roomsService.create(roomData);

// Read
const rooms = await roomsService.getAll();
const room = await roomsService.getById(id);

// Update
await roomsService.update(id, updateData);

// Delete
await roomsService.delete(id);
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support and questions, please create an issue in the repository.