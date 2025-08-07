<div align="center">
  <img src="apps/web/public/logo.png" alt="OpenCut Logo" width="120" />

  # OpenCut

  ### 🎬 A free, open-source video editor for web, desktop, and mobile

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
  [![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)

  [🚀 Live Demo](https://opencut.app) • [📖 Documentation](./docs) • [🐛 Report Bug](https://github.com/OpenCut-app/OpenCut/issues) • [💡 Request Feature](https://github.com/OpenCut-app/OpenCut/issues)
</div>

---

## 📖 Documentation

- [📚 Complete Documentation](./docs) - All project documentation
- [🚀 Quick Start Guide](./docs/development/setup.md) - Get started in minutes
- [🎬 Feature Overview](./docs/features/overview.md) - All available features
- [🏗️ Technical Architecture](./docs/technical/architecture.md) - System design
- [📋 Development Planning](./docs/planning/roadmap.md) - Project roadmap

## ✨ Why OpenCut?

- **🔒 Privacy First**: Your videos never leave your device - 100% client-side processing
- **💰 Completely Free**: No subscriptions, watermarks, or feature paywalls
- **🎯 User-Friendly**: Intuitive interface inspired by popular editors like CapCut
- **🌐 Cross-Platform**: Works seamlessly on web, desktop, and mobile devices
- **⚡ High Performance**: Built with modern web technologies for smooth editing experience

## 🎥 Key Features

### Core Editing
- 🎞️ **Timeline-based editing** with multi-track support
- ⚡ **Real-time preview** with smooth playback
- ✂️ **Precision cutting** and trimming tools
- 🔄 **Drag & drop** interface for easy editing

### Media Support
- 📹 **Multiple formats**: MP4, AVI, MOV, WebM, and more
- 🎵 **Audio editing**: Background music, sound effects, voiceovers
- 🖼️ **Image support**: JPG, PNG, GIF integration
- 📱 **Mobile optimized** for touch devices

### Advanced Features
- 🎨 **Visual effects** and transitions
- 📝 **Text overlays** and subtitles
- 🎭 **Filters** and color correction
- 📊 **Export options** in various resolutions

### Privacy & Performance
- 🔐 **No data collection** - everything stays local
- 🚫 **No watermarks** or subscription requirements
- 📈 **Analytics** by [Databuddy](https://www.databuddy.cc?utm_source=opencut) (100% anonymized)
- 📰 **Blog** powered by [Marble CMS](https://marblecms.com?utm_source=opencut)

## 📁 Project Structure

```
OpenCut/
├── apps/
│   └── web/                 # Main Next.js application
│       ├── src/
│       │   ├── components/  # React components
│       │   ├── hooks/       # Custom hooks
│       │   ├── lib/         # Utilities & APIs
│       │   ├── stores/      # State management
│       │   └── types/       # TypeScript types
│       └── public/          # Static assets
├── packages/
│   ├── auth/               # Authentication package
│   └── db/                 # Database package
├── docs/                   # 📚 Documentation
│   ├── development/        # Development guides
│   ├── features/          # Feature documentation
│   ├── technical/         # Technical specs
│   └── planning/          # Project planning
└── scripts/               # Build & utility scripts
```

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed on your system:

- [Node.js](https://nodejs.org/en/) (v18 or later)
- [Bun](https://bun.sh/docs/installation)
  (for `npm` alternative)
- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)

> **Note:** Docker is optional, but it's essential for running the local database and Redis services. If you're planning to run the frontend or want to contribute to frontend features, you can skip the Docker setup. If you have followed the steps below in [Setup](#setup), you're all set to go!

### Setup

1. Fork the repository
2. Clone your fork locally
3. Navigate to the web app directory: `cd apps/web`
4. Copy `.env.example` to `.env.local`:

   ```bash
   # Unix/Linux/Mac
   cp .env.example .env.local

   # Windows Command Prompt
   copy .env.example .env.local

   # Windows PowerShell
   Copy-Item .env.example .env.local
   ```

5. Install dependencies: `bun install`
6. Start the development server: `bun dev`

## Development Setup

### Local Development

1. Start the database and Redis services:

   ```bash
   # From project root
   docker-compose up -d
   ```

2. Navigate to the web app directory:

   ```bash
   cd apps/web
   ```

3. Copy `.env.example` to `.env.local`:

   ```bash
   # Unix/Linux/Mac
   cp .env.example .env.local

   # Windows Command Prompt
   copy .env.example .env.local

   # Windows PowerShell
   Copy-Item .env.example .env.local
   ```

4. Configure required environment variables in `.env.local`:

   **Required Variables:**

   ```bash
   # Database (matches docker-compose.yaml)
   DATABASE_URL="postgresql://opencut:opencutthegoat@localhost:5432/opencut"

   # Generate a secure secret for Better Auth
   BETTER_AUTH_SECRET="your-generated-secret-here"
   BETTER_AUTH_URL="http://localhost:3000"

   # Redis (matches docker-compose.yaml)
   UPSTASH_REDIS_REST_URL="http://localhost:8079"
   UPSTASH_REDIS_REST_TOKEN="example_token"

   # Marble Blog
   MARBLE_WORKSPACE_KEY=cm6ytuq9x0000i803v0isidst # example organization key
   NEXT_PUBLIC_MARBLE_API_URL=https://api.marblecms.com

   # Development
   NODE_ENV="development"
   ```

   **Generate BETTER_AUTH_SECRET:**

   ```bash
   # Unix/Linux/Mac
   openssl rand -base64 32

   # Windows PowerShell (simple method)
   [System.Web.Security.Membership]::GeneratePassword(32, 0)

   # Cross-platform (using Node.js)
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

   # Or use an online generator: https://generate-secret.vercel.app/32
   ```

5. Run database migrations: `bun run db:migrate` from (inside apps/web)
6. Start the development server: `bun run dev` from (inside apps/web)

The application will be available at [http://localhost:3000](http://localhost:3000).

## Contributing

We welcome contributions! While we're actively developing and refactoring certain areas, there are plenty of opportunities to contribute effectively.

**🎯 Focus areas:** Timeline functionality, project management, performance, bug fixes, and UI improvements outside the preview panel.

**⚠️ Avoid for now:** Preview panel enhancements (fonts, stickers, effects) and export functionality - we're refactoring these with a new binary rendering approach.

See our [Contributing Guide](.github/CONTRIBUTING.md) for detailed setup instructions, development guidelines, and complete focus area guidance.

**Quick start for contributors:**

- Fork the repo and clone locally
- Follow the setup instructions in CONTRIBUTING.md
- Create a feature branch and submit a PR

## Sponsors

Thanks to [Vercel](https://vercel.com?utm_source=github-opencut&utm_campaign=oss) for their support of open-source software.

<a href="https://vercel.com/oss">
  <img alt="Vercel OSS Program" src="https://vercel.com/oss/program-badge.svg" />
</a>

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FOpenCut-app%2FOpenCut&project-name=opencut&repository-name=opencut)

## License

[MIT LICENSE](LICENSE)

---

![Star History Chart](https://api.star-history.com/svg?repos=opencut-app/opencut&type=Date)
