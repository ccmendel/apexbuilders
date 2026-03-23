# Apex Tech Academy

A simple signup system with admin dashboard for managing users and courses. Built with Next.js, Supabase, and Resend.

## Features

- **Landing Page**: Attractive Gen-Z focused design with animated gradients
- **User Signup**: Collects name, email, phone, country, and password
- **User Dashboard**: View available video courses (unlisted YouTube videos)
- **Admin Dashboard**: 
  - View all user signups (name, email, phone, country)
  - Mark users as "Added to WhatsApp" to track who's been added to the group
  - Add/manage courses with YouTube video links
  - Filter users by WhatsApp status

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth + Database)
- **Email**: Resend
- **Hosting**: Vercel

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Get your project URL and anon key from **Settings > API**

### 3. Set Up Resend (Optional - for welcome emails)

1. Create an account at [resend.com](https://resend.com)
2. Get your API key from the dashboard

### 4. Configure Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
RESEND_API_KEY=your_resend_api_key
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Admin Login

- **Email**: profmendel@gmail.com
- **Password**: Apex@admin50

Access admin at: `/admin/login`

## Deployment to Vercel

1. Push code to GitHub
2. Import to Vercel
3. Add environment variables in Vercel settings
4. Deploy!

## Project Structure

```
├── app/
│   ├── page.tsx              # Landing page
│   ├── login/page.tsx        # User login
│   ├── signup/page.tsx       # User signup
│   ├── dashboard/page.tsx    # User dashboard
│   ├── admin/
│   │   ├── login/page.tsx    # Admin login
│   │   └── dashboard/page.tsx # Admin dashboard
│   └── api/
│       └── send-welcome-email/route.ts
├── lib/
│   └── supabase/
│       ├── client.ts         # Browser client
│       ├── server.ts         # Server client
│       └── middleware.ts     # Session handling
├── supabase/
│   └── schema.sql            # Database schema
└── middleware.ts             # Auth middleware
```

## License

MIT
