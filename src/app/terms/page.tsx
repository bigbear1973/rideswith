import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | RidesWith',
  description: 'Terms of Service for RidesWith - the rules and guidelines for using our platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen py-12 lg:py-16">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">
          Last updated: January 2025
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Agreement to Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using RidesWith (&quot;the Service&quot;), you agree to be bound by
              these Terms of Service. If you disagree with any part of these terms, you
              may not access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Description of Service</h2>
            <p className="text-muted-foreground">
              RidesWith is a platform that connects cyclists with group rides in their area.
              Users can discover rides, create rides, join communities, and connect with
              other cyclists. The Service is provided &quot;as is&quot; and is intended to
              facilitate connections between cyclists.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">User Accounts</h2>
            <p className="text-muted-foreground mb-4">
              To use certain features of the Service, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide accurate and complete information when creating your account</li>
              <li>Maintain the security of your account credentials</li>
              <li>Promptly notify us of any unauthorized use of your account</li>
              <li>Accept responsibility for all activities that occur under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">User Conduct</h2>
            <p className="text-muted-foreground mb-4">
              When using the Service, you agree not to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Post false, misleading, or inaccurate information about rides</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Use the Service for any commercial purpose without our consent</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Upload or transmit viruses or malicious code</li>
              <li>Collect or harvest user data without permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Ride Participation</h2>
            <p className="text-muted-foreground mb-4">
              <strong>Important:</strong> RidesWith is a platform for discovering and
              organizing rides. We do not organize, lead, or supervise any rides listed
              on the platform.
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                You participate in any ride at your own risk. Cycling involves inherent
                risks including but not limited to accidents, injuries, and property damage.
              </li>
              <li>
                You are responsible for ensuring you have appropriate fitness levels,
                equipment, and insurance for any ride you join.
              </li>
              <li>
                You must obey all traffic laws and regulations while riding.
              </li>
              <li>
                Ride organizers are independent users and are not employees, agents,
                or representatives of RidesWith.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">User Content</h2>
            <p className="text-muted-foreground mb-4">
              You retain ownership of any content you post to the Service (including
              ride information, photos, and comments). By posting content, you grant us
              a non-exclusive, worldwide, royalty-free license to use, display, and
              distribute your content in connection with the Service.
            </p>
            <p className="text-muted-foreground">
              You are responsible for all content you post and represent that you have
              the right to post such content. We reserve the right to remove any content
              that violates these terms or that we find objectionable.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Intellectual Property</h2>
            <p className="text-muted-foreground">
              The Service and its original content (excluding user content), features,
              and functionality are owned by RidesWith and are protected by international
              copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Disclaimer of Warranties</h2>
            <p className="text-muted-foreground">
              THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT
              WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT
              THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE. WE DO NOT MAKE
              ANY WARRANTIES REGARDING THE ACCURACY OR RELIABILITY OF ANY INFORMATION
              OBTAINED THROUGH THE SERVICE.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
            <p className="text-muted-foreground">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, RIDESWITH SHALL NOT BE LIABLE FOR
              ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
              INCLUDING BUT NOT LIMITED TO PERSONAL INJURY, PROPERTY DAMAGE, OR LOSS
              OF DATA ARISING OUT OF YOUR USE OF THE SERVICE OR PARTICIPATION IN ANY
              RIDE DISCOVERED THROUGH THE SERVICE.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Indemnification</h2>
            <p className="text-muted-foreground">
              You agree to indemnify and hold harmless RidesWith and its officers,
              directors, employees, and agents from any claims, damages, losses, or
              expenses (including reasonable attorneys&apos; fees) arising out of your use
              of the Service, your violation of these Terms, or your violation of any
              rights of another.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Termination</h2>
            <p className="text-muted-foreground">
              We may terminate or suspend your account and access to the Service
              immediately, without prior notice or liability, for any reason, including
              if you breach these Terms. Upon termination, your right to use the Service
              will immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify or replace these Terms at any time. If a
              revision is material, we will provide at least 30 days&apos; notice prior to
              any new terms taking effect. Your continued use of the Service after any
              changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms shall be governed by and construed in accordance with the laws
              of Ireland, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about these Terms, please contact us at
              legal@rideswith.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
