import LegalLayout from "@/components/LegalLayout";

const sections = [
  {
    title: "Introduction",
    content: "At Delta, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, retain, and safeguard information when you use Delta applications, services, and user-authorized integrations. Please read this privacy policy carefully. If you do not agree with it, do not access the service or connect an external account.",
  },
  {
    title: "Information We Collect",
    content: (
      <div className="space-y-4">
        <p>We collect information that you provide directly to us, including:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>Account Information:</strong> Name, email address, and password when you create an account</li>
          <li><strong>Health Information:</strong> Fitness goals, dietary preferences, sleep patterns, energy levels, stress ratings, and other wellness data you share through chat</li>
          <li><strong>Usage Data:</strong> Information about how you interact with our services, including conversation history</li>
          <li><strong>Device Information:</strong> Device type, operating system, and unique device identifiers</li>
          <li><strong>Goal Information:</strong> Personal wellness goals you set within the app</li>
        </ul>
        <p className="mt-4 font-medium">Information We Derive:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>Daily Logs:</strong> Sleep hours, energy ratings, stress levels automatically parsed from chat</li>
          <li><strong>Trend Data:</strong> Direction and momentum of wellness metrics over time</li>
          <li><strong>Pattern Analysis:</strong> Correlations between activities and outcomes</li>
          <li><strong>Goal Progress:</strong> Tracking toward your stated objectives</li>
        </ul>
        <p className="mt-2 text-sm text-gray-400">Delta may store self-reported information, derived metrics, and data from a connected service when you expressly authorize that connection. Connected-service data is limited to the scopes you approve.</p>
      </div>
    ),
  },
  {
    title: "WHOOP Integration Data",
    content: (
      <div className="space-y-4">
        <p>If you choose to connect WHOOP, Delta may receive:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>Connection information:</strong> A WHOOP account identifier, granted scopes, token expiry, and connection status</li>
          <li><strong>Recovery:</strong> Recovery score, heart rate variability, resting heart rate, calibration status, and supported device measurements</li>
          <li><strong>Sleep:</strong> Timing, stages, sleep need, respiratory rate, performance, consistency, efficiency, naps, and disturbances</li>
          <li><strong>Cycles:</strong> Timing, strain, energy expenditure, and heart-rate summaries</li>
          <li><strong>Workouts:</strong> Timing and type, strain, heart-rate summaries, energy, distance or elevation when available, and heart-rate-zone durations</li>
        </ul>
        <p>Delta does not request WHOOP body-measurement scope for the initial connector. WHOOP OAuth credentials remain server-only and are never returned to ChatGPT or exposed in user-facing responses.</p>
      </div>
    ),
  },
  {
    title: "How We Use Your Information",
    content: (
      <div className="space-y-4">
        <p>We use the information we collect to:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Provide, maintain, and improve our services</li>
          <li>Personalize your experience and provide tailored health guidance</li>
          <li>Calculate trend analysis and derivative metrics showing your progress</li>
          <li>Generate personalized AI workout recommendations</li>
          <li>Create exportable PDF, CSV, or JSON reports of your insights</li>
          <li>Detect patterns and correlations in your wellness data</li>
          <li>Communicate with you about updates, features, and support</li>
          <li>Analyze usage patterns to improve our AI and recommendations</li>
          <li>Protect against fraudulent or unauthorized activity</li>
          <li>Synchronize and normalize data from services you explicitly connect</li>
          <li>Return compact WHOOP summaries to a ChatGPT custom app only when you connect both services and request that data</li>
        </ul>
      </div>
    ),
  },
  {
    title: "Data Processing",
    content: (
      <div className="space-y-4">
        <p><strong>Derivative Calculations:</strong> We process your data to calculate first-order trends (improving, declining, stable), stability metrics, recovery patterns, and composite wellness momentum. These calculations produce qualitative insights, not medical assessments.</p>
        <p><strong>AI-Powered Features:</strong> Workout recommendations are generated using AI based on your goals and history. Weekly assessments summarize your progress. All AI outputs include appropriate wellness disclaimers.</p>
        <p><strong>WHOOP Connector:</strong> WHOOP data is normalized into compact recovery, sleep, cycle, and workout records. Raw provider responses, if temporarily retained for reliability or schema debugging, are kept only as permitted by WHOOP&apos;s terms and cache controls. ChatGPT receives only fields required for a user-requested tool call, never WHOOP tokens, profile contact information, or raw provider payloads.</p>
      </div>
    ),
  },
  {
    title: "Data Export",
    content: (
      <div className="space-y-4">
        <p>You can export your data at any time in three formats:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>PDF:</strong> Human-readable summary with trend indicators and insights</li>
          <li><strong>CSV:</strong> Derived metrics only (ratings, binary indicators)</li>
          <li><strong>JSON:</strong> Structured data for technical use</li>
        </ul>
        <p className="text-sm text-gray-400">Exports may include connected-service data when you request it and provider terms permit it. OAuth credentials are never included.</p>
      </div>
    ),
  },
  {
    title: "Data Sharing and Disclosure",
    content: "We do not sell your personal information or use WHOOP data for advertising. We may share information with service providers that operate Delta, with AI providers when needed to fulfill a request you initiate, and with ChatGPT when you explicitly connect Delta as a custom app and invoke a WHOOP data tool. We may also disclose information when legally required. We do not expose one user's WHOOP data to another user.",
  },
  {
    title: "Data Security",
    content: "We implement security measures to protect your data, including encryption in transit and at rest and secure authentication. Connected-provider credentials are encrypted and restricted to server-side integration code. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.",
  },
  {
    title: "Your Rights and Choices",
    content: (
      <div className="space-y-4">
        <p>You have the right to:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Access, update, or delete your personal information</li>
          <li>Export your data in a portable format</li>
          <li>Opt out of marketing communications</li>
          <li>Request restriction of processing</li>
          <li>Withdraw consent at any time</li>
          <li>Disconnect WHOOP and stop future synchronization</li>
          <li>Disconnect the Delta custom app from ChatGPT</li>
        </ul>
        <p>To exercise these rights, contact us at privacy@delta.health</p>
      </div>
    ),
  },
  {
    title: "Data Retention",
    content: "We retain personal information only while needed to provide the service and as permitted by connected-provider terms. Disconnecting WHOOP stops future synchronization and revokes provider access when the connector is enabled. Provider data is deleted when required by provider terms, account deletion, or an applicable deletion request. Some information may be retained when legally required.",
  },
  {
    title: "Children's Privacy",
    content: "Our services are not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13. If we learn we have collected such information, we will delete it promptly.",
  },
  {
    title: "Changes to This Policy",
    content: "We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the 'Last Updated' date. Your continued use of the service after changes constitutes acceptance of the updated policy.",
  },
  {
    title: "Contact Us",
    content: "If you have questions about this Privacy Policy or our data practices, please contact us at privacy@delta.health or write to us at: Delta Health, Inc., Ann Arbor, Michigan.",
  },
];

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      lastUpdated="July 29, 2026"
      sections={sections}
    />
  );
}
