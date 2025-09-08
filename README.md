
# IP Tracker & Social Engineering Tool

A comprehensive web application for tracking IP addresses and social engineering testing.

## Features

- IP address logging and geolocation
- Discord webhook integration
- Image-based tracking
- YouTube proxy tracking
- Roblox link tracking
- User authentication and management

## Deployment on Vercel

### Prerequisites

1. GitHub account
2. Vercel account
3. Database (Neon, Supabase, or PlanetScale recommended)

### Setup Instructions

1. **Fork this repository to your GitHub account**

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect the configuration

3. **Set Environment Variables in Vercel:**
   ```
   DATABASE_URL=your_database_connection_string
   DISCORD_WEBHOOK_URL=your_discord_webhook_url (optional)
   SESSION_SECRET=your_secure_random_string
   NODE_ENV=production
   ```

4. **Deploy:**
   - Push to main/master branch
   - Vercel will automatically deploy
   - Or trigger manual deployment in Vercel dashboard

### GitHub Secrets (for GitHub Actions)

Add these secrets to your GitHub repository:
- `VERCEL_TOKEN`: Your Vercel API token
- `ORG_ID`: Your Vercel organization ID  
- `PROJECT_ID`: Your Vercel project ID

### Database Setup

You'll need an external database since Vercel functions are stateless:

1. **Neon (Recommended):**
   - Sign up at [neon.tech](https://neon.tech)
   - Create a new project
   - Copy the connection string to `DATABASE_URL`

2. **Supabase:**
   - Sign up at [supabase.com](https://supabase.com)
   - Create a new project
   - Get the PostgreSQL connection string

3. **PlanetScale:**
   - Sign up at [planetscale.com](https://planetscale.com)
   - Create a MySQL database
   - Update database schema accordingly

### File Storage

For persistent file storage on Vercel, consider:
- **Cloudinary** for images
- **AWS S3** for general file storage
- **Vercel Blob** for simple file storage

## Local Development

```bash
npm install
npm run dev
```

## Build for Production

```bash
npm run build
npm start
```
