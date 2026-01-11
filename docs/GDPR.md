# GDPR Compliance Documentation

This document outlines how State of Clarity handles personal data in compliance with GDPR (General Data Protection Regulation) and similar privacy regulations.

## Personal Data We Collect

### User Account Data
- **Email address**: Used for authentication and account communications
- **Full name**: Optional, displayed on profile
- **Username**: Optional, used for profile URL and display
- **Avatar**: Optional profile picture uploaded by user
- **Bio**: Optional profile description (max 280 characters)
- **Location**: Optional location for personalization

### User Preferences
- **Preferred reading level**: simple/standard/advanced
- **Topic interests**: Array of category preferences
- **Notification preferences**: Email digest and feature announcement settings

### Activity Data
- **Briefs created**: Questions submitted and generated brief content
- **Saved briefs**: Briefs bookmarked by the user
- **Reading history**: Which briefs were viewed, time spent, scroll depth
- **Feedback**: Votes, suggestions, and error reports submitted

### Technical Data
- **IP address**: Logged by Supabase for security
- **Authentication tokens**: Managed by Supabase Auth
- **Session data**: Stored in cookies for authentication

## How We Use This Data

1. **Authentication**: Email used for magic link and OAuth sign-in
2. **Personalization**: Preferences used to customize content display
3. **Analytics**: Reading history used to improve recommendations (future)
4. **Quality control**: Feedback used to improve brief quality

## Data Retention Policy

- **Account data**: Retained until account deletion
- **Briefs created**: Retained indefinitely (anonymized on account deletion)
- **Reading history**: Retained for 2 years from last activity
- **Feedback**: Retained indefinitely (anonymized on account deletion)

## Third-Party Data Processors

### Supabase (Database & Authentication)
- Stores all user data and handles authentication
- Privacy Policy: https://supabase.com/privacy
- Location: EU/US (configurable)

### Vercel (Hosting)
- Hosts the application
- Privacy Policy: https://vercel.com/legal/privacy-policy
- Location: Global edge network

### Stripe (Payments - Future)
- Will handle payment processing when subscription features are added
- Privacy Policy: https://stripe.com/privacy

### Tavily (Research API)
- Used to research topics for brief generation
- No personal user data is sent to Tavily

## User Rights

### Right to Access (Data Export)
Users can export all their data by:
1. Going to Settings → Data & Privacy
2. Clicking "Export my data"
3. Downloading the JSON file containing all personal data

**API Endpoint**: `GET /api/profile/export`

The export includes:
- Profile information
- All briefs created
- Saved briefs list
- Reading history
- Feedback submitted
- Brief generation jobs

### Right to Rectification
Users can update their profile information:
1. Go to Profile → Edit Profile
2. Update any fields
3. Save changes

### Right to Erasure (Account Deletion)
Users can delete their account:
1. Go to Settings → Data & Privacy
2. Click "Delete my account"
3. Type "DELETE" to confirm

**API Endpoint**: `POST /api/profile/delete`

Request body:
```json
{
  "confirmation": "DELETE"
}
```

**What happens on deletion**:
- Auth record is deleted from Supabase Auth via Admin API
- Profile record is CASCADE deleted (linked to auth.users)
- Saved briefs list is CASCADE deleted
- Reading history is CASCADE deleted  
- **Briefs are ANONYMIZED** (user_id set to null via ON DELETE SET NULL, content retained)
- **Feedback is ANONYMIZED** (user_id set to null via ON DELETE SET NULL, content retained)
- **Brief jobs are ANONYMIZED** (user_id set to null via ON DELETE SET NULL)

### Right to Data Portability
The export feature provides data in JSON format, which is machine-readable and can be imported into other systems.

### Right to Object
Users can opt out of:
- Email digest notifications (Settings → Notifications)
- Feature announcements (Settings → Notifications)

## Handling Data Requests

### Export Request
1. User clicks "Export my data" in settings
2. System compiles all user data from database tables
3. Returns JSON file for download
4. No manual intervention required

### Deletion Request
1. User navigates to delete account page
2. User confirms by typing "DELETE" in the confirmation field
3. Frontend calls `POST /api/profile/delete` with `{"confirmation": "DELETE"}`
4. Backend validates confirmation and calls Supabase Admin API to delete user
5. Database cascades delete profile, saved_briefs, and reading_history
6. Database anonymizes briefs, feedback, and brief_jobs (sets user_id to null)
7. API returns success response
8. Frontend signs out user and redirects to homepage

### Manual Requests
If a user contacts support for data access/deletion:
1. Verify identity via email confirmation
2. Use Supabase dashboard or API to fulfill request
3. Document the request and completion
4. Respond within 30 days (GDPR requirement)

## Cookie Policy

See our [Privacy Policy](/privacy) for details on cookies used.

Essential cookies:
- Authentication session cookies (Supabase)
- Cookie consent preference (localStorage)

Optional cookies (require consent):
- Analytics (if implemented in future)

## Age Verification

Users must confirm they are 13+ years old during signup to comply with COPPA (US) and GDPR-K (EU children's data protection).

## Contact

For data protection inquiries:
- Email: privacy@stateofclarity.com
- Response time: Within 30 days

## Updates

This document was last updated: January 2026

Changes to this document will be reflected in our Privacy Policy and users will be notified of material changes.
