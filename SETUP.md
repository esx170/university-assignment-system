# 🚀 University Assignment System - Setup Guide

## ✅ Environment Variables Checklist

### **Required Variables (Must Have)**
- [x] `DATABASE_URL` - Neon PostgreSQL connection string
- [x] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- [x] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

### **Optional Variables (Recommended)**
- [ ] `NEXTAUTH_SECRET` - For NextAuth (if using)
- [ ] `SMTP_*` - For email notifications
- [ ] `APP_URL` - Production URL
- [ ] `JWT_SECRET` - For custom auth
- [ ] `ENCRYPTION_KEY` - For data encryption

## 🔧 Setup Steps

### **1. Database Setup (Neon)**
1. Go to [neon.tech](https://neon.tech)
2. Create account and new project
3. Copy connection string to `DATABASE_URL`
4. Run: `npm run db:push` to create tables

### **2. Authentication & Storage (Supabase)**
1. Go to [supabase.com](https://supabase.com)
2. Create project (keep existing one)
3. Go to Settings → API
4. Copy URL and keys to environment variables
5. Disable email confirmation in Auth settings

### **3. Local Development**
```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Start development server
npm run dev
```

### **4. Vercel Deployment**
1. Add environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
2. Deploy from GitHub
3. Test authentication and file upload

## 🔍 Current Configuration Status

### **✅ Configured**
- Neon Database URL
- Supabase URL (fixed format)
- Supabase Anon Key
- Supabase Service Role Key
- NextAuth Secret (generated)

### **⚠️ Needs Configuration**
- Email SMTP settings (optional)
- Production APP_URL
- Custom JWT secrets (optional)

## 🚨 Security Notes

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Rotate keys regularly** - Especially service role keys
3. **Use different keys** for development/production
4. **Keep service role key secret** - Never expose in client code

## 🧪 Testing Checklist

### **Authentication**
- [ ] Sign up works
- [ ] Sign in works
- [ ] Profile creation in database
- [ ] Role-based access control

### **File Upload**
- [ ] File upload to Supabase Storage
- [ ] File download/access
- [ ] File size limits
- [ ] File type restrictions

### **Database**
- [ ] Prisma client works
- [ ] CRUD operations
- [ ] Relations work
- [ ] Migrations apply

## 🔧 Troubleshooting

### **Common Issues**
1. **"supabaseKey is required"** → Check environment variables
2. **Database connection failed** → Check DATABASE_URL format
3. **Auth not working** → Check Supabase URL format (needs https://)
4. **File upload fails** → Check storage bucket exists

### **Debug Commands**
```bash
# Check environment variables
npm run dev

# Check database connection
npm run db:studio

# Generate fresh types
npm run db:generate

# Reset database
npm run db:push --force-reset
```

## 📞 Support

If you encounter issues:
1. Check this setup guide
2. Verify environment variables
3. Check browser console for errors
4. Check Vercel deployment logs
5. Check Supabase logs

---

**Last Updated:** February 2026
**Version:** 1.0.0