import LegalLayout from "@/components/LegalLayout";

const sections = [
  {
    title: "Introduction",
    content: "At Delta, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.",
  },
  {
    title: "Information We Collect",
    content: (
      <div className="space-y-4">
        <p>We collect information that you provide directly to us, including:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>Account Information:</strong> Name, email address, and password when you create an account</li>
          <li><strong>Health Information:</strong> Weight, height, fitness goals, dietary preferences, and other health-related data you choose to share</li>
          <li><strong>Usage Data:</strong> Information about how you interact with our services, including conversation history</li>
          <li><strong>Device Information:</strong> Device type, operating system, and unique device identifiers</li>
        </ul>
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
          <li>Communicate with you about updates, features, and support</li>
          <li>Analyze usage patterns to improve our AI and recommendations</li>
          <li>Protect against fraudulent or unauthorized activity</li>
        </ul>
      </div>
    ),
  },
  {
    title: "Data Sharing and Disclosure",
    content: "We do not sell your personal information. We may share your information with third-party service providers who assist us in operating our services (e.g., cloud hosting, analytics). These providers are contractually obligated to protect your information. We may also disclose information if required by law or to protect our rights and safety.",
  },
  {
    title: "Data Security",
    content: "We implement industry-standard security measures to protect your data, including encryption in transit and at rest, secure authentication, and regular security audits. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.",
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
        </ul>
        <p>To exercise these rights, contact us at privacy@delta.health</p>
      </div>
    ),
  },
  {
    title: "Data Retention",
    content: "We retain your personal information for as long as your account is active or as needed to provide you services. You can request deletion of your account and associated data at any time. Some information may be retained for legal or legitimate business purposes.",
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
      lastUpdated="January 15, 2026"
      sections={sections}
    />
  );
}
