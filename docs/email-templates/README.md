# Supabase Email Templates

Individual HTML email templates for Supabase Authentication.

## Files

| # | File | Supabase Template | Subject Line |
|---|------|-------------------|--------------|
| 1 | `01-confirm-signup.html` | Confirm sign up | Confirm your State of Clarity account |
| 2 | `02-magic-link.html` | Magic link | Your sign-in link for State of Clarity |
| 3 | `03-invite-user.html` | Invite user | You're invited to State of Clarity |
| 4 | `04-change-email.html` | Change email address | Confirm your new email address |
| 5 | `05-reset-password.html` | Reset password | Reset your State of Clarity password |
| 6 | `06-reauthentication.html` | Reauthentication | Confirm your identity - State of Clarity |

## Supabase Configuration

### Sender Settings

| Setting | Value |
|---------|-------|
| **Sender name** | State of Clarity |
| **Sender email** | hello@stateofclarity.com |

### How to Apply

1. Go to **Supabase Dashboard** > **Authentication** > **Email Templates**
2. Click on the template type (e.g., "Confirm sign up")
3. Update the **Subject** field with the subject line from the table above
4. Copy the entire contents of the corresponding HTML file
5. Paste into the **Body** field (Source/HTML mode)
6. Click **Save**

### Logo

The templates reference `https://stateofclarity.org/email-logo.svg` - make sure this is deployed to the public folder.

## Testing

Use Supabase's "Send test email" feature or create test accounts to verify emails render correctly in:
- Gmail (web & mobile)
- Outlook (web & desktop)
- Apple Mail
- Yahoo Mail
