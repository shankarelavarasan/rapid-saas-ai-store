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

### Deploy to Render

1. **One-Click Deploy**
   
   Click the "Deploy to Render" button above or manually:
   
   - Fork this repository
   - Connect your GitHub account to Render
   - Create a new Web Service
   - Connect your forked repository
   - Render will automatically detect the `render.yaml` configuration

2. **Environment Variables**
   
   Set the following environment variables in your Render dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `GEMINI_API_KEY`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `JWT_SECRET`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`

### Deploy with Docker

1. **Build the Docker image**
   ```bash
   docker build -t rapid-saas-ai-store .
   ```

2. **Run the container**
   ```bash
   docker run -p 3000:3000 --env-file .env rapid-saas-ai-store
   ```

### Deploy to Other Platforms

- **Heroku**: Use the included `Dockerfile`
- **Railway**: Connect your GitHub repository
- **DigitalOcean App Platform**: Use the `render.yaml` as reference
- **AWS/GCP/Azure**: Deploy using Docker or Node.js runtime

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
├── Dockerfile            # Docker configuration
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