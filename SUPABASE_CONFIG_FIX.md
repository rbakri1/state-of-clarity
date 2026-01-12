# Fix Supabase Auth Emails Redirecting to Localhost

## The Problem
Supabase auth emails are taking you to localhost instead of stateofclarity.org because the Supabase dashboard configuration needs to be updated.

## Solution: Update Supabase Dashboard Configuration

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard/project/xjxhvdesaqjrvbtdbswr
2. Log in if needed

### Step 2: Navigate to Authentication Settings
1. Click on **Authentication** in the left sidebar
2. Click on **URL Configuration**

### Step 3: Update These Settings

#### Site URL
```
https://stateofclarity.org
```
**What this does:** This is the default URL Supabase will redirect to after authentication.

#### Redirect URLs (Add ALL of these)
```
https://stateofclarity.org/**
https://stateofclarity.org/auth/callback
https://stateofclarity.org/auth/signin
https://stateofclarity.org/auth/signup
```

**What this does:** These are the allowed redirect URLs after authentication. The `**` wildcard allows all paths under your domain.

#### IMPORTANT: Also check Email Templates
1. Go to **Authentication** → **Email Templates**
2. Check these templates:
   - **Confirm signup**
   - **Magic Link**
   - **Change Email Address**
   - **Reset Password**

3. In each template, look for `{{ .SiteURL }}` or `{{ .ConfirmationURL }}`
4. Make sure there are no hardcoded localhost URLs in the templates

### Step 4: Save Changes
Click **Save** at the bottom of the page.

---

## Additional Fix: Vercel Environment Variable

You also need to add the production URL to Vercel:

### Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Find your "State of Clarity" project
3. Go to **Settings** → **Environment Variables**
4. Add this variable:
   - **Name:** `NEXT_PUBLIC_BASE_URL`
   - **Value:** `https://stateofclarity.org`
   - **Environments:** Select all (Production, Preview, Development)
5. Click **Save**
6. **Redeploy** your application for the change to take effect

---

## Testing After Changes

1. **Clear your browser cache** or use incognito mode
2. Go to: https://stateofclarity.org/auth/signup
3. Sign up with a new email address
4. Check the confirmation email
5. Click the link in the email
6. **It should now redirect to stateofclarity.org instead of localhost!**

---

## Why This Happened

1. **Supabase default:** When you first create a Supabase project and test locally, it defaults to localhost
2. **Email templates:** Supabase uses the "Site URL" setting to generate links in emails
3. **Code fallback:** Our payment checkout route had a fallback to localhost if `NEXT_PUBLIC_BASE_URL` wasn't set

All of these have now been addressed:
- ✅ Supabase dashboard needs manual configuration (follow steps above)
- ✅ NEXT_PUBLIC_BASE_URL added to local .env.local
- ⚠️ NEXT_PUBLIC_BASE_URL needs to be added to Vercel (follow steps above)

---

## Quick Checklist

- [ ] Updated Supabase Site URL to `https://stateofclarity.org`
- [ ] Added redirect URLs to Supabase (with `/**` wildcard)
- [ ] Checked email templates for hardcoded localhost URLs
- [ ] Added `NEXT_PUBLIC_BASE_URL` to Vercel environment variables
- [ ] Redeployed Vercel application
- [ ] Tested sign-up flow with new email
- [ ] Confirmed email link redirects to production URL

---

## Still Having Issues?

If emails still redirect to localhost after these changes:
1. Clear your browser cache completely
2. Use incognito/private browsing mode
3. Wait 5 minutes for Supabase configuration to propagate
4. Try with a brand new email address (not one that was used during testing)
