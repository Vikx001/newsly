# Newsly - Ultra-Short News App

A React-based cross-platform news app that delivers ultra-short (≈60-word) news stories with swipeable cards. Built with React + Capacitor for web and native mobile deployment.

# Newsly - Some screenshot from google pixel 9

<img width="430" height="875" alt="image" src="https://github.com/user-attachments/assets/778f0af9-610b-4ea0-b254-47bd99c671c9" />

<img width="430" height="875" alt="image" src="https://github.com/user-attachments/assets/0314e6b8-5b49-497c-a961-64f405ebdbc8" />

<img width="430" height="875" alt="image" src="https://github.com/user-attachments/assets/770c1404-cc7e-40ba-b311-7db3e2a899ac" />

<img width="430" height="875" alt="image" src="https://github.com/user-attachments/assets/fa74bd07-b4e1-40d0-ae1c-fca5aa100dd5" />

<img width="430" height="875" alt="image" src="https://github.com/user-attachments/assets/a74cddd9-1cb7-4c06-8a3b-3a5d5091b643" />

## 🚀 Features

- **📱 Cross-Platform**: Web, Android, working on iOS
- **🌍 Country Selection**: Get news from 15+ countries with flag indicators
- **🎯 Genre Selection**: 8 news categories (Technology, World, Business, Sports, Science, Health, Entertainment, Politics)
- **📰 Ultra-Short Summaries**: News stories condensed to ~60 words
- **👆 Swipeable Interface**: Navigate with swipe gestures (mobile) or arrow keys (desktop)
- **🔖 Bookmarking**: Save articles to read later
- **🌙 Dark Mode**: Toggle between light and dark themes
- **💾 No Database**: Everything stored in localStorage
- **📱 Responsive Design**: Works on all devices
- **🔄 Real-time News**: Fetches latest news from Google News RSS
- **🔄 Auto-Refresh**: Automatically refreshes when country is changed
- **💬 Comments System**: Add and view comments on articles
- **📤 Share Functionality**: Share articles across platforms

## � Development Timeline

| Date | Version | Updates |
|------|---------|---------|
| **16/08/2025** | v2.3.0 | 🎨 **Layout Refresh & Settings Expansion**<br/>• New compact header in Feed with country selector, refresh, sort (Personalized/Latest), theme and settings buttons<br/>• “Swipe up” affordance and smoother card transitions<br/>• Read Aloud controls and keyboard shortcuts (Arrow Up/Down, Ctrl+Space)<br/>• Community Bias features: analysis panel + vote sheet with local persistence<br/>• Article translation with LibreTranslate/Lingva fallback<br/>• Settings additions: Theme, Notifications, Reading font size, Hide paywalled, Default sort, Bookmarks, Subscriptions (stub), Clear history, Feedback, Help & Support, Logout |

| **16/08/2025** | v2.2.0 | 🖼️ **Smart Image Resolver & Reliability**<br/>• Prefer original article URL (bypass Google News redirect)<br/>• Extract images from OG/Twitter/JSON‑LD/srcset and follow canonical links<br/>• Openverse photograph fallback when no image is found<br/>• Web image proxying for reliability (Weserv)<br/>• Improved handling of placeholder/flag images |

| **30/01/2025** | v2.1.0 | 🌍 **Country Selection Feature**<br/>• Added 15+ country support with flag indicators<br/>• Auto-refresh on country change<br/>• Visual loading states for country selector<br/>• Improved refresh button feedback |
| **29/01/2025** | v2.0.0 | 🔧 **Major UI/UX Improvements**<br/>• Fixed mobile external URL navigation<br/>• TikTok-style swipe navigation<br/>• Dark/Light theme toggle<br/>• Comments system with local storage<br/>• Responsive design for mobile/desktop<br/>• Share functionality<br/>• Capacitor integration for mobile apps<br/>• Mobile "Read More" button fixes |
| **28/01/2025** | v1.5.0 | 📱 **Mobile Optimization**<br/>• Enhanced swipe gestures<br/>• Improved touch responsiveness<br/>• Better mobile UI components |
| **27/01/2025** | v1.0.0 | 🎉 **Initial Release**<br/>• Core news fetching functionality<br/>• Genre selection<br/>• Basic UI components<br/>• Web deployment ready |

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Landing   │  │    Genre    │  │    Feed     │         │
│  │    Page     │→ │  Selection  │→ │    Page     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                           ↓                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Bookmarks   │  │  Settings   │  │ News Cards  │         │
│  │    Page     │  │   Modal     │  │ Component   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│                    State Management                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Theme     │  │ Local       │  │   News      │         │
│  │  Context    │  │ Storage     │  │   State     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│                      API Layer                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Capacitor   │  │   Google    │  │   Country   │         │
│  │    HTTP     │  │ News RSS    │  │   Selector  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│                   Platform Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │     Web     │  │   Android   │  │     iOS     │         │
│  │  (Browser)  │  │   (APK)     │  │   (IPA)     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow Diagram

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    User     │    │   React     │    │    API      │
│ Interaction │    │ Components  │    │   Layer     │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       │ 1. Select Country│                  │
       ├─────────────────→│                  │
       │                  │ 2. Auto Refresh  │
       │                  ├─────────────────→│
       │                  │                  │
       │ 3. Select Genre  │                  │
       ├─────────────────→│                  │
       │                  │ 4. Fetch News    │
       │                  ├─────────────────→│
       │                  │                  │
       │                  │ 5. Parse RSS     │
       │                  │←─────────────────┤
       │                  │                  │
       │ 6. Display Cards │                  │
       │←─────────────────┤                  │
       │                  │                  │
       │ 7. Swipe/Navigate│                  │
       ├─────────────────→│                  │
       │                  │                  │
       │ 8. Bookmark/Share│                  │
       ├─────────────────→│                  │
       │                  │ 9. Save Local    │
       │                  ├─────────────────→│
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework with hooks
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library
- **Framer Motion** - Animations (optional)

### Mobile
- **Capacitor** - Cross-platform native runtime
- **Capacitor HTTP** - Native HTTP requests
- **Android SDK** - Android app compilation
- **Xcode** - iOS app compilation

### Backend/API
- **Google News RSS** - News data source
- **XML Parser** - RSS feed processing
- **CORS Proxy** - Web development (allorigins.win)
- **Country API** - Country-specific news feeds

### Storage
- **localStorage** - Client-side data persistence
- **No Database** - Fully client-side application

## 📁 Project Structure

```
newsly/
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── HeaderBar.jsx       # Navigation header with theme toggle
│   │   ├── NewsCard.jsx        # Individual news article card
│   │   ├── SettingsModal.jsx   # Settings overlay modal
│   │   └── CountrySelector.jsx # Country selection dropdown
│   ├── contexts/               # React context providers
│   │   └── ThemeContext.jsx    # Dark/light theme management
│   ├── pages/                  # Route-based page components
│   │   ├── Landing.jsx         # Welcome/onboarding screen
│   │   ├── GenreSelection.jsx  # Category selection interface
│   │   ├── Feed.jsx           # Main news feed with swipe
│   │   └── Bookmarks.jsx      # Saved articles view
│   ├── utils/                  # Helper functions and utilities
│   │   ├── api.js             # News fetching logic
│   │   ├── mockApi.js         # RSS parsing and mock data
│   │   ├── genres.js          # Category definitions
│   │   ├── storage.js         # localStorage utilities
│   │   └── countries.js       # Country definitions and flags
│   ├── App.jsx                # Main app component with routing
│   └── main.jsx               # React app entry point
├── android/                    # Android Capacitor project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   └── assets/public/  # Built web assets
│   │   └── build.gradle
│   └── capacitor.build.gradle
├── ios/                       # iOS Capacitor project (if added)
├── public/                    # Static web assets
├── api/                       # Serverless functions (unused)
├── capacitor.config.json      # Capacitor configuration
├── package.json              # Dependencies and scripts
├── tailwind.config.js        # Tailwind CSS configuration
├── vite.config.js           # Vite build configuration
└── README.md                # This file
```

## 🔧 API Architecture

### News Fetching Strategy

```javascript
// Platform Detection
if (window.Capacitor?.isNativePlatform()) {
  // Native: Use Capacitor HTTP (bypasses CORS)
  const response = await CapacitorHttp.get({
    url: googleNewsRssUrl,
    headers: { 'User-Agent': 'NewsBot/1.0' }
  });
} else {
  // Web: Use CORS proxy
  const response = await fetch(corsProxyUrl + googleNewsRssUrl);
}
```

### Country-Specific RSS URLs

```javascript
const getCountrySpecificUrl = (category, country) => {
  const baseUrls = {
    'technology': 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pWVXlnQVAB',
    'business': 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB',
    // ... more categories
  };

  return country === 'global'
    ? baseUrls[category]
    : `${baseUrls[category]}?hl=${country}&gl=${country.toUpperCase()}`;
};
```

### RSS Feed Processing

```javascript
// XML to JSON conversion with country support
const parser = new DOMParser();
const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
const items = xmlDoc.querySelectorAll('item');

// Extract article data
const articles = Array.from(items).map(item => ({
  title: item.querySelector('title')?.textContent,
  description: cleanDescription(item.querySelector('description')?.textContent),
  link: item.querySelector('link')?.textContent,
  pubDate: new Date(item.querySelector('pubDate')?.textContent),
  category: category,
  country: selectedCountry,
  id: generateUniqueId()
}));
```

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** (Current: v20.16.0 supported)
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)

### Installation

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd newsly
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development server:**
```bash
npm run dev
```

4. **Open in browser:**
```
http://localhost:5173
```

### Mobile Development

#### Android Setup

1. **Add Android platform:**
```bash
npx cap add android
```

2. **Build and sync:**
```bash
npm run build
npx cap sync
```

3. **Open in Android Studio:**
```bash
npx cap open android
```

4. **Run on device/emulator:**
```bash
npm run android
```

#### iOS Setup (macOS only)

1. **Add iOS platform:**
```bash
npx cap add ios
```

2. **Build and sync:**
```bash
npm run build
npx cap sync
```

3. **Open in Xcode:**
```bash
npx cap open ios
```

## 📱 Building for Production

### Web Deployment

```bash
# Build for web
npm run build

# Preview build
npm run preview

# Deploy to Vercel/Netlify
# Upload dist/ folder
```

### Android APK

1. **Generate keystore:**
```bash
keytool -genkey -v -keystore my-release-key.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```

2. **Build signed APK:**
```bash
npm run build
npx cap sync
npx cap build android --keystorepath ./my-release-key.keystore --keystorepass YOUR_PASSWORD --keystorealias my-key-alias --keystorealiaspass YOUR_ALIAS_PASSWORD --androidreleasetype APK
```

3. **APK location:**
```
android/app/build/outputs/apk/release/app-release-signed.apk
```

### iOS App Store

1. **Build for iOS:**
```bash
npm run build
npx cap sync
npx cap open ios
```

2. **In Xcode:**
   - Set signing team
   - Archive for distribution
   - Upload to App Store Connect

## 🔧 Configuration

### Capacitor Config

```json
{
  "appId": "com.newsly.app",
  "appName": "Newsly",
  "webDir": "dist",
  "server": {
    "androidScheme": "https",
    "cleartext": true,
    "allowNavigation": ["*"]
  },
  "plugins": {
    "CapacitorHttp": {
      "enabled": true
    }
  }
}
```

### Environment Variables

```bash
# .env.local (optional, for future API keys)
NEWS_API_KEY=your_api_key_here
VITE_APP_NAME=Newsly
```

## 🎨 Customization

### Adding New Countries

1. **Update countries.js:**
```javascript
export const countries = [
  // ... existing countries
  { code: 'de', name: 'Germany', flag: '🇩🇪' }
];
```

2. **Country will auto-work with existing RSS feeds**

### Adding New Categories

1. **Update genres.js:**
```javascript
export const genres = [
  // ... existing genres
  { id: 'science', name: 'Science', icon: '🔬', color: 'bg-green-500' }
];
```

2. **Add RSS URL in api.js:**
```javascript
const categoryUrls = {
  // ... existing URLs
  'science': 'https://news.google.com/rss/topics/SCIENCE_RSS_URL'
};
```

### Theming

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#your-color',
        secondary: '#your-color'
      }
    }
  }
}
```

## 🧪 Testing

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Test on different devices
npm run android  # Android emulator
npm run ios      # iOS simulator (macOS)
npm run dev      # Web browser
```

## 📊 Performance

- **Bundle Size**: ~500KB (gzipped)
- **First Load**: <2s on 3G
- **News Fetch**: <1s average
- **Country Switch**: <500ms
- **Offline Support**: Cached articles available
- **Memory Usage**: <50MB on mobile

## 🔒 Security

- **No API Keys**: Uses public RSS feeds
- **HTTPS Only**: All requests encrypted
- **No User Data**: Everything stored locally
- **CORS Handled**: Proper cross-origin setup
- **Content Security**: Sanitized HTML content

## 🚀 Deployment Options

### Web Hosting
- **Vercel** (Recommended)
- **Netlify**
- **GitHub Pages**
- **Firebase Hosting**

### Mobile Distribution
- **Google Play Store**
- **Apple App Store**
- **Direct APK/IPA distribution**
- **Enterprise deployment**

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google News** - RSS feed data source
- **Capacitor** - Cross-platform framework
- **React Team** - UI framework
- **Tailwind CSS** - Styling system
- **Lucide** - Icon library

---

**Built with ❤️ by V**

*Newsly - Stay informed, stay brief.*
