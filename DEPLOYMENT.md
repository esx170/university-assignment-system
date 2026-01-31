# Deployment Guide

This guide walks you through deploying the University Assignment System to production.

## Prerequisites

- Supabase account
- Vercel account
- GitHub repository

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a project name and database password
3. Wait for the project to be created

### 1.2 Configure Database

1. Go to the SQL Editor in your Supabase dashboard
2. Copy and paste the entire contents of `supabase/schema.sql`
3. Run the SQL script to create all tables, policies, and functions

### 1.3 Configure Storage

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `submissions`
3. Set the bucket to private (not public)
4. The RLS policies from the schema will handle access control

### 1.4 Get API Keys

1. Go to Settings > API in your Supabase dashboard
2. Copy the following values:
   - Project URL
   - Anon (public) key
   - Service role (secret) key

## Step 2: Vercel Deployment

### 2.1 Connect Repository

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect it's a Next.js project

### 2.2 Configure Environment Variables

In the Vercel deployment settings, add these environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Optional email configuration:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 2.3 Deploy

1. Click "Deploy"
2. Vercel will build and deploy your application
3. You'll get a production URL when deployment completes

## Step 3: Post-Deployment Setup

### 3.1 Create Admin User

1. Visit your deployed application
2. Sign up with your admin email
3. Go to Supabase dashboard > Authentication > Users
4. Find your user and update the `raw_user_meta_data` to include `"role": "admin"`
5. Or run this SQL in the SQL Editor:

```sql
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'your-admin-email@example.com';

UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';
```

### 3.2 Test Core Functionality

1. Sign in as admin
2. Create a test course
3. Create a test instructor account
4. Create a test student account
5. Enroll the student in the course
6. Create an assignment as instructor
7. Submit assignment as student
8. Grade assignment as instructor

## Step 4: Domain Configuration (Optional)

### 4.1 Custom Domain

1. In Vercel dashboard, go to your project settings
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

### 4.2 Update Supabase Settings

1. Go to Supabase dashboard > Authentication > Settings
2. Add your production domain to "Site URL"
3. Add your domain to "Redirect URLs"

## Step 5: Monitoring and Maintenance

### 5.1 Error Monitoring

- Monitor Vercel deployment logs
- Check Supabase logs for database errors
- Set up alerts for critical issues

### 5.2 Database Maintenance

- Regularly backup your database
- Monitor storage usage
- Review and optimize queries as needed

### 5.3 Security Checklist

- [ ] RLS policies are enabled on all tables
- [ ] Service role key is kept secure
- [ ] File upload limits are appropriate
- [ ] User roles are properly validated
- [ ] HTTPS is enforced

## Troubleshooting

### Common Issues

1. **Authentication not working**
   - Check Supabase URL and keys
   - Verify site URL in Supabase settings

2. **File uploads failing**
   - Check storage bucket exists and is named 'submissions'
   - Verify RLS policies on storage.objects

3. **Database errors**
   - Check if schema was applied correctly
   - Verify RLS policies are enabled

4. **Build failures**
   - Check environment variables are set
   - Verify all dependencies are in package.json

### Getting Help

- Check Vercel deployment logs
- Review Supabase logs
- Check browser console for client-side errors
- Review network requests in browser dev tools

## Production Optimization

### Performance

- Enable Vercel Analytics
- Monitor Core Web Vitals
- Optimize images and assets
- Use database indexes effectively

### Security

- Regular security updates
- Monitor for suspicious activity
- Implement rate limiting if needed
- Regular backup verification

### Scaling

- Monitor database performance
- Consider read replicas for high traffic
- Implement caching strategies
- Monitor file storage usage