import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | State of Clarity",
  description: "Learn how State of Clarity collects, uses, and protects your personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg clarity-gradient flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">State of Clarity</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <p className="text-muted-foreground mb-8">
          Last updated: January 2025
        </p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">What Data We Collect</h2>
            <p className="text-muted-foreground mb-4">
              We collect information you provide directly to us when using State of Clarity:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Account information:</strong> Email address and password when you create an account</li>
              <li><strong>Profile information:</strong> Optional display name and preferences you choose to provide</li>
              <li><strong>Content:</strong> Questions you ask and policy briefs you create or save</li>
              <li><strong>Usage data:</strong> How you interact with our service (pages visited, features used)</li>
              <li><strong>Device information:</strong> Browser type, operating system, and IP address for security and analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Data</h2>
            <p className="text-muted-foreground mb-4">
              We use your information to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Provide, maintain, and improve State of Clarity</li>
              <li>Process your questions and generate policy briefs</li>
              <li>Send you service-related notifications (account security, updates)</li>
              <li>Respond to your comments, questions, and support requests</li>
              <li>Monitor and analyze trends to improve user experience</li>
              <li>Detect, prevent, and address technical issues and security threats</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Third Parties We Work With</h2>
            <p className="text-muted-foreground mb-4">
              We use trusted third-party services to operate State of Clarity:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <strong>Supabase:</strong> Provides our database and authentication infrastructure. 
                Your account data is stored securely on their servers.{" "}
                <a href="https://supabase.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                  Supabase Privacy Policy
                </a>
              </li>
              <li>
                <strong>Stripe:</strong> Processes payments for premium subscriptions. 
                We never store your full payment card details.{" "}
                <a href="https://stripe.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                  Stripe Privacy Policy
                </a>
              </li>
              <li>
                <strong>Vercel:</strong> Hosts our application and provides analytics.{" "}
                <a href="https://vercel.com/legal/privacy-policy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                  Vercel Privacy Policy
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
            <p className="text-muted-foreground mb-4">
              You have the following rights regarding your personal data:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <strong>Access:</strong> Request a copy of all personal data we hold about you
              </li>
              <li>
                <strong>Export:</strong> Download your data in a machine-readable format (JSON)
              </li>
              <li>
                <strong>Correction:</strong> Update or correct inaccurate information in your profile
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your account and associated personal data
              </li>
              <li>
                <strong>Objection:</strong> Object to processing of your data for certain purposes
              </li>
            </ul>
            <p className="text-muted-foreground mt-4">
              To exercise any of these rights, visit your account settings or contact us at the address below.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your personal data for as long as your account is active or as needed to provide you services.
              If you delete your account, we will remove your personal data within 30 days, except where we need to 
              retain certain information for legal obligations or legitimate business purposes. Anonymized content 
              (like policy briefs with personal identifiers removed) may be retained to improve our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Cookies</h2>
            <p className="text-muted-foreground">
              We use cookies and similar technologies to keep you logged in, remember your preferences, and 
              understand how you use our service. You can control cookie preferences through our cookie consent 
              banner or your browser settings. Essential cookies required for the service to function cannot be disabled.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Security</h2>
            <p className="text-muted-foreground">
              We implement appropriate technical and organizational measures to protect your personal data against 
              unauthorized access, alteration, disclosure, or destruction. This includes encryption in transit (HTTPS), 
              secure password hashing, and regular security reviews.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <p className="text-muted-foreground mt-4">
              Email: <a href="mailto:privacy@stateofclarity.com" className="text-primary hover:underline">privacy@stateofclarity.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any significant changes 
              by posting the new policy on this page and updating the "Last updated" date. We encourage you to 
              review this policy periodically.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2025 State of Clarity. Truth over tribe. Open-source evolution.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
