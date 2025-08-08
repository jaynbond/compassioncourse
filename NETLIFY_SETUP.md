# 🚀 Netlify + Firebase Setup Guide

## Quick Setup Steps

### 1. 🔥 **Set Up Firebase Project**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name it: **"Compassion Course"**
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. 🔧 **Configure Firebase Services**

#### **Enable Authentication:**
1. Go to **Authentication** → **Get started**
2. Click **Sign-in method** tab
3. Enable **Email/Password**
4. Click **Save**

#### **Set Up Firestore Database:**
1. Go to **Firestore Database** → **Create database**
2. Choose **Start in test mode** (we'll update rules later)
3. Select your preferred location
4. Click **Done**

### 3. 📱 **Get Firebase Config**

1. In Firebase Console, click **Project Settings** (gear icon)
2. Scroll down to **Your apps**
3. Click **Web** icon (`</>`)
4. Register your app: "Compassion Course Website"
5. **Copy the config object** - you'll need this!

### 4. 🔧 **Update Firebase Configuration**

Edit `public/js/firebase-config.js` and replace the config:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### 5. 🌐 **Deploy to Netlify**

#### **Option A: Git-based Deployment (Recommended)**

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Compassion Course with Firebase"
   git branch -M main
   git remote add origin https://github.com/yourusername/compassion-course.git
   git push -u origin main
   ```

2. **Connect to Netlify:**
   - Go to [Netlify](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Choose GitHub and select your repository
   - **Build settings:**
     - Build command: `npm run build`
     - Publish directory: `public`
   - Click "Deploy site"

#### **Option B: Direct Upload**

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login and Deploy:**
   ```bash
   netlify login
   netlify deploy --dir=public
   netlify deploy --prod --dir=public
   ```

### 6. 🔒 **Set Up Firestore Security Rules**

In Firebase Console → Firestore → Rules, replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to published content for everyone
    match /content/{document} {
      allow read: if resource.data.isPublished == true;
      allow write: if request.auth != null && 
                   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'super-admin'];
    }
    
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
                  get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'super-admin'];
    }
  }
}
```

### 7. 📊 **Initialize Sample Data**

Run this script to add sample content:

```bash
node scripts/init-firebase-data.js
```

### 8. 👤 **Create Admin User**

1. Go to Firebase Console → Authentication → Users
2. Click "Add user"
3. **Email:** `admin@compassioncourse.com`
4. **Password:** Choose a secure password
5. After creating, go to Firestore → users collection
6. Find the user document and add field:
   - **role:** `super-admin`

## 🎯 **URLs After Deployment**

- **Website:** `https://your-site-name.netlify.app`
- **Admin Panel:** `https://your-site-name.netlify.app/admin`
- **Login:** `https://your-site-name.netlify.app/login`

## ✨ **Features You Now Have**

### 🔥 **Real-Time Updates**
- Content changes appear instantly across all browsers
- No page refresh needed when admins update content

### 📱 **Admin Panel**
- Edit all website content
- User management
- Real-time preview of changes

### 🔒 **Secure Authentication**
- Firebase handles all security
- Role-based access (Users, Admins, Super Admins)

### 🚀 **Fast Hosting**
- Netlify's global CDN
- Automatic HTTPS
- Lightning-fast loading

## 🛠 **Development Workflow**

### **Local Development:**
```bash
npm run dev
```

### **Deploy Updates:**
```bash
git add .
git commit -m "Update content"
git push
```
*Netlify automatically redeploys!*

## 🎨 **Customizing Content**

1. **Login to Admin Panel:** `/admin`
2. **Go to Content Management**
3. **Edit any content item**
4. **Save** - changes appear instantly on the website!

## 🔧 **Troubleshooting**

### **Firebase Connection Issues:**
- Verify config in `firebase-config.js`
- Check Firebase project settings
- Ensure Firestore rules are published

### **Admin Access Issues:**
- Verify user role is `admin` or `super-admin` in Firestore
- Check Authentication is enabled in Firebase

### **Deployment Issues:**
- Check build logs in Netlify dashboard
- Verify `public` directory contains all files
- Ensure `netlify.toml` is properly configured

## 📞 **Support**

- **Firebase Console:** https://console.firebase.google.com/
- **Netlify Dashboard:** https://app.netlify.com/
- **Firestore Rules Reference:** https://firebase.google.com/docs/firestore/security/rules-query

---

**🎉 Your Compassion Course website is now live with real-time content management!**
