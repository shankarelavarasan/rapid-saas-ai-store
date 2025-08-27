---

### 🚀 Live Project & Demo

**This project has been professionally deployed on Netlify for optimal performance and stability.**

**Please view the live, fully functional version here:**

## 👉 [`https://rapidsaasaistore.netlify.app/`](https://rapidsaasaistore.netlify.app/) 👈

---

# 🚀 Rapid SaaS AI Store

> A Global Distribution Platform for SaaS & AI Web Apps - Convert any SaaS to mobile app instantly

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/yourusername/rapid-saas-ai-store)

## 🌟 Features

- **🔄 Instant SaaS-to-App Conversion**: Transform any web-based SaaS into a native mobile app
- **🤖 AI-Powered Analysis**: Intelligent website analysis and app optimization
- **🎨 Automated Asset Generation**: AI-generated icons, splash screens, and visual assets
- **📱 Cross-Platform Support**: Generate apps for iOS and Android
- **🏪 Built-in App Store**: Discover, browse, and distribute converted apps
- **💰 Revenue Sharing**: Monetization system for developers and platform
- **🔐 Secure Authentication**: JWT-based user management
- **📊 Analytics Dashboard**: Track conversions, downloads, and revenue
- **☁️ Cloud Integration**: Supabase database and Cloudinary file storage

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **Supabase** for database and authentication
- **OpenAI & Gemini** for AI-powered analysis
- **Cloudinary** for file storage and image processing
- **Stripe** for payment processing
- **Sharp** for image manipulation

### Frontend
- **Vanilla JavaScript** with modern ES6+
- **Responsive CSS** with mobile-first design
- **Progressive Web App** capabilities

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account
- OpenAI API key
- Cloudinary account
- Stripe account (for payments)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/rapid-saas-ai-store.git
   cd rapid-saas-ai-store
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables in `.env`:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # Supabase Configuration
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # AI Services
   OPENAI_API_KEY=your_openai_api_key
   GEMINI_API_KEY=your_gemini_api_key
   
   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Authentication
   JWT_SECRET=your_jwt_secret
   
   # Payment Processing
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🌐 Deployment

### Quick Deploy Options

**🚀 Render (Recommended)**
- Build Command: `npm ci && npm run build`
- Start Command: `npm run start:prod`
- Health Check: `/health`
- Auto-deploy: ON

**🚄 Railway**
- Start Command: `npm run start:prod`
- Port: Auto-detected
- Auto-deploy on git push

**✈️ Fly.io**
```bash
fly launch  # Set internal port: 3000
fly deploy
```

**📋 Environment Variables (All Platforms)**
Set these in your platform's dashboard:
- `NODE_ENV=production`
- `PORT=` (platform-specific)
- `DATABASE_URL=postgresql://...`
- `OPENAI_API_KEY=sk-...`
- `ANTHROPIC_API_KEY=sk-ant-...`
- `GEMINI_API_KEY=...`
- `SUPABASE_URL=...`
- `SUPABASE_ANON_KEY=...`
- `CLOUDINARY_CLOUD_NAME=...`
- `JWT_SECRET=...`
- `STRIPE_SECRET_KEY=...`

📖 **[Complete Deployment Guide](./DEPLOYMENT_GUIDE.md)** - VPS, PM2, systemd, Nginx, and more!

### Deploy to Other Platforms

#### Heroku
1. Install Heroku CLI
2. Login and create app:
   ```bash
   heroku login
   heroku create your-app-name
   ```
3. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set PORT=
   heroku config:set SUPABASE_URL=your_value
   # ... add all other environment variables
   ```
4. Deploy:
   ```bash
   git push heroku main
   ```

#### Railway
1. Connect your GitHub repository
2. Set environment variables in Railway dashboard
3. Railway will auto-deploy on git push

#### DigitalOcean App Platform
1. Use the `render.yaml` as reference for app spec
2. Connect GitHub repository
3. Configure environment variables
4. Deploy with Node.js runtime

#### AWS/GCP/Azure
- Deploy using Node.js runtime (18+)
- Set up environment variables
- Configure health check endpoint: `/health`
- Use `npm start` as start command

## 📁 Project Structure

```
rapid-saas-ai-store/
├── public/                 # Static frontend files
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript files
│   └── index.html         # Main HTML file
├── routes/                # API routes
│   ├── ai.js             # AI-powered endpoints
│   ├── analytics.js      # Analytics endpoints
│   ├── apps.js           # App management
│   └── users.js          # User management
├── services/              # Business logic
│   ├── aiAnalyzer.js     # AI analysis service
│   ├── analytics.js      # Analytics service
│   ├── appGenerator.js   # App generation service
│   ├── database.js       # Database service
│   ├── fileUpload.js     # File upload service
│   ├── iconGenerator.js  # Icon generation service
│   └── paymentService.js # Payment processing
├── middleware/            # Express middleware
│   └── auth.js           # Authentication middleware
├── server.js             # Main server file
├── package.json          # Dependencies and scripts
├── render.yaml           # Render deployment config
└── README.md             # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile

### AI Services
- `POST /api/ai/analyze-website` - Analyze website for app conversion
- `POST /api/ai/generate-assets` - Generate app assets
- `POST /api/ai/categorize` - Categorize app

### App Management
- `GET /api/apps` - List all apps
- `POST /api/apps/generate` - Generate new app
- `GET /api/apps/:id` - Get specific app
- `PUT /api/apps/:id` - Update app

### Analytics
- `GET /api/analytics` - Get analytics data
- `POST /api/analytics/event` - Record analytics event

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@rapidtech.com
- 💬 Discord: [Join our community](https://discord.gg/rapidtech)
- 📖 Documentation: [docs.rapidtech.com](https://docs.rapidtech.com)

## 🙏 Acknowledgments

- OpenAI for GPT API
- Google for Gemini API
- Supabase for backend infrastructure
- Cloudinary for image processing
- Stripe for payment processing

---

**Made with ❤️ by Rapid Tech**