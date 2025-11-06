# 🚀 Deploy to Production

## ✅ Changes Committed Successfully!

**Commit:** `cfad2f2` - "Fix: Resolve 404 errors for profile images and avatar references"

**34 files changed** with all 404 error fixes applied.

---

## 📦 Step 1: Push to GitHub

Run this command in your terminal:

```bash
git push origin main
```

This will trigger an **automatic Vercel deployment**.

---

## 🔧 Step 2: Update Supabase Production Database

**CRITICAL:** You must run the SQL scripts in your **production Supabase** instance!

### Go to Supabase Dashboard:
https://app.supabase.com → Select your project → SQL Editor

### Run these scripts in order:

#### 1. Profiles Table (REQUIRED)
Copy and paste from: `supabase_profiles_schema.sql`
```sql
-- This creates:
-- ✅ profiles table with all fields
-- ✅ Auto-creation on user signup
-- ✅ RLS security policies
-- ✅ Proper indexes
```

#### 2. Storage Setup (If not done yet)
Copy and paste from: `supabase_storage_setup.sql`
```sql
-- This creates:
-- ✅ avatars storage bucket
-- ✅ Upload/download policies
```

#### 3. Migrate Existing Users (If you have existing users)
```sql
-- Run this to create profiles for existing users
INSERT INTO public.profiles (id, nickname, email, avatar_url)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', '사용자'),
  email,
  raw_user_meta_data->>'avatar_url'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
```

---

## ✨ Step 3: Verify Production Deployment

### Once Vercel deploys:

1. **Visit your production URL**
2. **Open Browser Console (F12)**
   - [ ] No `default-avatar.png` errors
   - [ ] No `/rest/v1/users` errors
   - [ ] No profile upload errors

3. **Test Profile Upload**
   - [ ] Login to your app
   - [ ] Go to profile page
   - [ ] Try uploading an avatar
   - [ ] Should work perfectly!

---

## 📊 What Was Fixed

### All 404 Errors Resolved:
- ✅ Dynamic avatars using UI Avatars API
- ✅ Fixed database table references (profiles instead of users)
- ✅ Fixed field names (avatar_url instead of profile_image)
- ✅ Updated 11+ components with proper fallbacks

### Build Optimizations:
- ✅ Build cache cleared
- ✅ All imports updated
- ✅ No more missing file errors

---

## 🔍 Monitoring After Deploy

### Check Vercel Deployment Logs:
https://vercel.com → Your Project → Deployments

Look for:
- ✅ Build successful
- ✅ No TypeScript errors
- ✅ No build warnings about missing files

### Check Supabase Logs:
https://app.supabase.com → Your Project → Logs

Look for:
- ✅ No "table not found" errors
- ✅ Profile queries working
- ✅ Storage uploads succeeding

---

## 🆘 If Production Has Issues

### Issue: Still seeing 404 errors
**Solution:** Clear browser cache, hard refresh (`Ctrl+Shift+R`)

### Issue: Profile upload fails
**Solution:** Check Supabase SQL scripts were run successfully:
```sql
-- Verify profiles table exists
SELECT * FROM public.profiles LIMIT 1;

-- Verify avatars bucket exists
SELECT * FROM storage.buckets WHERE id = 'avatars';
```

### Issue: "profiles table not found"
**Solution:** Run `supabase_profiles_schema.sql` in Supabase Dashboard

### Issue: Build fails on Vercel
**Solution:** Check build logs for specific error. Usually solved by:
- Ensuring all environment variables are set
- Checking TypeScript errors in logs

---

## 📝 Quick Checklist

- [ ] **Git Push:** `git push origin main`
- [ ] **Supabase SQL:** Run `supabase_profiles_schema.sql`
- [ ] **Verify Deployment:** Check Vercel logs
- [ ] **Test Production:** Open app, check console for errors
- [ ] **Test Upload:** Try uploading profile image

---

## 🎉 Success Criteria

Your production is ready when:

✅ No console errors  
✅ Avatars display (dynamic or uploaded)  
✅ Profile image upload works  
✅ All pages load without 404s  
✅ Users can see their profiles  

---

## Next Steps

1. **Push to GitHub:** `git push origin main`
2. **Watch Vercel deploy:** Usually takes 1-3 minutes
3. **Run Supabase SQL:** While deploy is happening
4. **Test production:** Once deploy completes

---

**All code is ready. Just push and update the database!** 🚀



