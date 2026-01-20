import LegalLayout from "@/components/LegalLayout";

const sections = [
  {
    title: "Agreement to Terms",
    content: "By accessing or using Delta's services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing our services. The materials contained in this application are protected by applicable copyright and trademark law.",
  },
  {
    title: "Description of Service",
    content: "Delta provides an AI-powered health intelligence platform that offers personalized health guidance, tracking, and insights. Our service is intended for informational purposes only and should not be considered medical advice. Always consult with qualified healthcare providers for medical decisions.",
  },
  {
    title: "User Accounts",
    content: (
      <div className="space-y-4">
        <p>When you create an account with us, you must provide accurate, complete, and current information. You are responsible for:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Maintaining the security of your account and password</li>
          <li>All activities that occur under your account</li>
          <li>Notifying us immediately of any unauthorized access</li>
          <li>Ensuring your account information remains accurate</li>
        </ul>
        <p>We reserve the right to terminate accounts that violate these terms.</p>
      </div>
    ),
  },
  {
    title: "Acceptable Use",
    content: (
      <div className="space-y-4">
        <p>You agree not to use the service to:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Violate any laws or regulations</li>
          <li>Infringe on intellectual property rights</li>
          <li>Transmit harmful code or malware</li>
          <li>Attempt to gain unauthorized access to our systems</li>
          <li>Harass, abuse, or harm others</li>
          <li>Collect user information without consent</li>
          <li>Use the service for any commercial purpose without permission</li>
        </ul>
      </div>
    ),
  },
  {
    title: "Health Disclaimer",
    content: "Delta is not a medical device and is not intended to diagnose, treat, cure, or prevent any disease or health condition. The information provided through our service is for general informational purposes only. You should not rely on this information as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.",
  },
  {
    title: "Subscription and Billing",
    content: (
      <div className="space-y-4">
        <p>Some features of Delta require a paid subscription. By subscribing, you agree to:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Pay all applicable fees at the prices in effect when charges are incurred</li>
          <li>Automatic renewal of subscriptions unless cancelled before the renewal date</li>
          <li>Provide accurate billing information</li>
        </ul>
        <p>Refunds are provided in accordance with our Refund Policy. You may cancel your subscription at any time through your account settings.</p>
      </div>
    ),
  },
  {
    title: "Intellectual Property",
    content: "The service and its original content, features, and functionality are owned by Delta Health, Inc. and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of our services without explicit permission.",
  },
  {
    title: "Limitation of Liability",
    content: "In no event shall Delta Health, Inc., its directors, employees, partners, agents, suppliers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.",
  },
  {
    title: "Indemnification",
    content: "You agree to defend, indemnify, and hold harmless Delta Health, Inc. and its licensees and licensors, and their employees, contractors, agents, officers, and directors, from and against any and all claims, damages, obligations, losses, liabilities, costs, or debt, and expenses arising from your use of the service or violation of these Terms.",
  },
  {
    title: "Termination",
    content: "We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the service will immediately cease. All provisions of the Terms which by their nature should survive termination shall survive termination.",
  },
  {
    title: "Governing Law",
    content: "These Terms shall be governed and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.",
  },
  {
    title: "Changes to Terms",
    content: "We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our service after those revisions become effective, you agree to be bound by the revised terms.",
  },
  {
    title: "Contact Us",
    content: "If you have any questions about these Terms, please contact us at legal@delta.health.",
  },
];

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      lastUpdated="January 15, 2026"
      sections={sections}
    />
  );
}
