
# Vercel Deployment Instructions

## Quick Setup

1. **Upload these files to your Vercel project**
2. **Set Environment Variables in Vercel Dashboard:**
   - `DATABASE_URL` - Your database connection string (required)
   - `SESSION_SECRET` - Random 32+ character string (required)
   - `DISCORD_WEBHOOK_URL` - Discord webhook URL (optional)
   - `IPGEOLOCATION_API_KEY` - IP geolocation API key (optional)
   - `NODE_ENV=production`

3. **Deploy** - Vercel will automatically build and deploy

## Database Setup

You need an external database for production. Recommended:

### Neon PostgreSQL (Free tier available)
1. Go to https://neon.tech
2. Create account and new project
3. Copy connection string to `DATABASE_URL`

### Supabase PostgreSQL (Free tier available)
1. Go to https://supabase.com
2. Create new project
3. Go to Settings > Database
4. Copy PostgreSQL connection string to `DATABASE_URL`

## Features Included

- IP tracking and logging
- Discord webhook integration
- Image-based tracking
- YouTube proxy tracking
- User authentication
- Admin panel
- Roblox link tracking

## File Structure

- `/api/index.js` - Vercel serverless function entry point
- `/public/` - Built React application
- `/server/` - Backend logic and storage
- `/shared/` - Shared schemas and types
- `vercel.json` - Vercel configuration

## Support

Default admin account:
- Username: `.GOVdev`
- Password: `Av121988-`
- Access codes: `Av121988` or `demo123`

Change these credentials immediately after deployment!
