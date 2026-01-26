import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | RidesWith',
  description: 'Privacy Policy for RidesWith - how we collect, use, and protect your information.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-12 lg:py-16">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">
          Last updated: January 2025
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p className="text-muted-foreground mb-4">
              RidesWith (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, disclose, and safeguard
              your information when you use our website and services.
            </p>
            <p className="text-muted-foreground">
              Please read this privacy policy carefully. If you do not agree with the
              terms of this privacy policy, please do not access the site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
            <h3 className="text-lg font-medium mb-2">Personal Information</h3>
            <p className="text-muted-foreground mb-4">
              We may collect personal information that you voluntarily provide when you:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Create an account (email address, name)</li>
              <li>Create or join a ride (location data)</li>
              <li>Update your profile (profile photo, bio, social links)</li>
              <li>Communicate with us</li>
            </ul>

            <h3 className="text-lg font-medium mb-2">Automatically Collected Information</h3>
            <p className="text-muted-foreground">
              When you access our website, we may automatically collect certain information
              including your IP address, browser type, operating system, access times,
              and the pages you have viewed directly before and after accessing the site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process your account registration and manage your account</li>
              <li>Enable you to create and join rides</li>
              <li>Send you service-related communications (e.g., ride confirmations)</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Monitor and analyze usage patterns and trends</li>
              <li>Protect against unauthorized access and legal liability</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Information Sharing</h2>
            <p className="text-muted-foreground mb-4">
              We may share your information in the following situations:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                <strong>With other users:</strong> When you create or join a ride, other
                participants may see your name and profile information.
              </li>
              <li>
                <strong>With service providers:</strong> We may share your information with
                third-party vendors who perform services on our behalf (e.g., email delivery,
                hosting).
              </li>
              <li>
                <strong>For legal purposes:</strong> We may disclose your information if
                required by law or in response to valid requests by public authorities.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
            <p className="text-muted-foreground">
              We use administrative, technical, and physical security measures to protect
              your personal information. While we have taken reasonable steps to secure the
              personal information you provide to us, please be aware that no security
              measures are perfect or impenetrable, and we cannot guarantee the security
              of any information transmitted over the Internet.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
            <p className="text-muted-foreground mb-4">
              Depending on your location, you may have certain rights regarding your
              personal information, including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>The right to access your personal information</li>
              <li>The right to correct inaccurate information</li>
              <li>The right to delete your personal information</li>
              <li>The right to opt out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Cookies</h2>
            <p className="text-muted-foreground">
              We use cookies and similar tracking technologies to track activity on our
              website and store certain information. Cookies are files with a small amount
              of data that are stored on your device. You can instruct your browser to
              refuse all cookies or to indicate when a cookie is being sent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
            <p className="text-muted-foreground">
              Our website may contain links to third-party websites and services that are
              not owned or controlled by us. We are not responsible for the privacy practices
              of these third parties. We encourage you to review the privacy policies of
              any third-party sites you visit.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this privacy policy from time to time. We will notify you of
              any changes by posting the new privacy policy on this page and updating the
              &quot;Last updated&quot; date. You are advised to review this privacy policy
              periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-muted-foreground">
              If you have questions or comments about this privacy policy, please contact
              us at privacy@rideswith.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
