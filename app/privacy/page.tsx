import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | State of Clarity",
  description: "Learn how State of Clarity collects, uses, and protects your personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-ivory-100">
      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-700 font-ui mb-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 rounded"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold font-heading text-ink-800 mb-8">Privacy Policy</h1>
        
        <p className="text-ink-500 font-ui mb-8">
          Last updated: January 2025
        </p>

        <div className="prose prose-custom max-w-none space-y-8 font-body">
          <section>
            <h2 className="text-2xl font-semibold font-heading text-ink-800 mb-4">What Data We Collect</h2>
            <p className="text-ink-800 mb-4">
              We collect information you provide directly to us when using State of Clarity:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-ink-800">
              <li><strong className="text-ink-800">Account information:</strong> Email address when you create an account</li>
              <li><strong className="text-ink-800">Profile information:</strong> Optional display name and preferences you choose to provide</li>
              <li><strong className="text-ink-800">Content:</strong> Questions you ask and policy briefs you create or save</li>
              <li><strong className="text-ink-800">Usage data:</strong> How you interact with our service (pages visited, features used)</li>
              <li><strong className="text-ink-800">Device information:</strong> Browser type, operating system, and IP address for security and analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-heading text-ink-800 mb-4">How We Use Your Data</h2>
            <p className="text-ink-800 mb-4">
              We use your information to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-ink-800">
              <li>Provide, maintain, and improve State of Clarity</li>
              <li>Process your questions and generate policy briefs</li>
              <li>Send you service-related notifications (account security, updates)</li>
              <li>Respond to your comments, questions, and support requests</li>
              <li>Monitor and analyze trends to improve user experience</li>
              <li>Detect, prevent, and address technical issues and security threats</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-heading text-ink-800 mb-4">Third Parties We Work With</h2>
            <p className="text-ink-800 mb-4">
              We use trusted third-party services to operate State of Clarity:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-ink-800">
              <li>
                <strong className="text-ink-800">Supabase:</strong> Provides our database and authentication infrastructure. 
                Your account data is stored securely on their servers.{" "}
                <a href="https://supabase.com/privacy" className="text-sage-600 hover:text-sage-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 rounded" target="_blank" rel="noopener noreferrer">
                  Supabase Privacy Policy
                </a>
              </li>
              <li>
                <strong className="text-ink-800">Stripe:</strong> Processes payments for premium subscriptions. 
                We never store your full payment card details.{" "}
                <a href="https://stripe.com/privacy" className="text-sage-600 hover:text-sage-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 rounded" target="_blank" rel="noopener noreferrer">
                  Stripe Privacy Policy
                </a>
              </li>
              <li>
                <strong className="text-ink-800">Vercel:</strong> Hosts our application and provides analytics.{" "}
                <a href="https://vercel.com/legal/privacy-policy" className="text-sage-600 hover:text-sage-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 rounded" target="_blank" rel="noopener noreferrer">
                  Vercel Privacy Policy
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-heading text-ink-800 mb-4">Your Rights</h2>
            <p className="text-ink-800 mb-4">
              You have the following rights regarding your personal data:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-ink-800">
              <li>
                <strong className="text-ink-800">Access:</strong> Request a copy of all personal data we hold about you
              </li>
              <li>
                <strong className="text-ink-800">Export:</strong> Download your data in a machine-readable format (JSON)
              </li>
              <li>
                <strong className="text-ink-800">Correction:</strong> Update or correct inaccurate information in your profile
              </li>
              <li>
                <strong className="text-ink-800">Deletion:</strong> Request deletion of your account and associated personal data
              </li>
              <li>
                <strong className="text-ink-800">Objection:</strong> Object to processing of your data for certain purposes
              </li>
            </ul>
            <p className="text-ink-800 mt-4">
              To exercise any of these rights, visit your account settings or contact us at the address below.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-heading text-ink-800 mb-4">Data Retention</h2>
            <p className="text-ink-800">
              We retain your personal data for as long as your account is active or as needed to provide you services.
              If you delete your account, we will remove your personal data within 30 days, except where we need to 
              retain certain information for legal obligations or legitimate business purposes. Anonymized content 
              (like policy briefs with personal identifiers removed) may be retained to improve our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-heading text-ink-800 mb-4">Cookies</h2>
            <p className="text-ink-800">
              We use cookies and similar technologies to keep you logged in, remember your preferences, and 
              understand how you use our service. You can control cookie preferences through our cookie consent 
              banner or your browser settings. Essential cookies required for the service to function cannot be disabled.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-heading text-ink-800 mb-4">Security</h2>
            <p className="text-ink-800">
              We implement appropriate technical and organizational measures to protect your personal data against 
              unauthorized access, alteration, disclosure, or destruction. This includes encryption in transit (HTTPS), 
              secure password hashing, and regular security reviews.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-heading text-ink-800 mb-4">Contact Us</h2>
            <p className="text-ink-800">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <p className="text-ink-800 mt-4">
              Email: <a href="mailto:privacy@stateofclarity.com" className="text-sage-600 hover:text-sage-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 rounded">privacy@stateofclarity.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-heading text-ink-800 mb-4">Changes to This Policy</h2>
            <p className="text-ink-800">
              We may update this Privacy Policy from time to time. We will notify you of any significant changes 
              by posting the new policy on this page and updating the &quot;Last updated&quot; date. We encourage you to 
              review this policy periodically.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
