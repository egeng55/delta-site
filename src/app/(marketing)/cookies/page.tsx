import LegalLayout from "@/components/LegalLayout";

const sections = [
  {
    title: "What Are Cookies",
    content: "Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently, provide a better user experience, and give website owners information about how users interact with their site.",
  },
  {
    title: "How We Use Cookies",
    content: (
      <div className="space-y-4">
        <p>Delta uses cookies and similar technologies for several purposes:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>Essential Cookies:</strong> Required for the website to function properly. These enable core functionality such as security, account access, and preferences.</li>
          <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website by collecting and reporting information anonymously.</li>
          <li><strong>Functional Cookies:</strong> Enable enhanced functionality and personalization, such as remembering your preferences.</li>
          <li><strong>Marketing Cookies:</strong> Used to track visitors across websites to display relevant advertisements.</li>
        </ul>
      </div>
    ),
  },
  {
    title: "Types of Cookies We Use",
    content: (
      <div className="space-y-4">
        <p><strong>First-Party Cookies:</strong> Set by Delta directly when you visit our website.</p>
        <p><strong>Third-Party Cookies:</strong> Set by our partners and service providers for analytics, advertising, and other purposes. These include:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Google Analytics - for website analytics</li>
          <li>Stripe - for payment processing</li>
          <li>Intercom - for customer support</li>
        </ul>
      </div>
    ),
  },
  {
    title: "Cookie Duration",
    content: (
      <div className="space-y-4">
        <p><strong>Session Cookies:</strong> Temporary cookies that are deleted when you close your browser. These are used to maintain your session while you navigate our site.</p>
        <p><strong>Persistent Cookies:</strong> Remain on your device for a set period or until you delete them. These remember your preferences and settings for future visits.</p>
      </div>
    ),
  },
  {
    title: "Managing Cookies",
    content: (
      <div className="space-y-4">
        <p>You can control and manage cookies in several ways:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>Browser Settings:</strong> Most browsers allow you to view, manage, delete, and block cookies. Note that blocking all cookies may impact functionality.</li>
          <li><strong>Cookie Preferences:</strong> Use our cookie preference center (available via the cookie banner) to customize which non-essential cookies you accept.</li>
          <li><strong>Opt-Out Links:</strong> Many third-party advertisers offer opt-out mechanisms through the Digital Advertising Alliance or similar organizations.</li>
        </ul>
      </div>
    ),
  },
  {
    title: "Do Not Track",
    content: "Some browsers include a 'Do Not Track' (DNT) feature that signals to websites that you do not want to be tracked. Currently, there is no industry standard for how companies should respond to DNT signals. We do not currently respond to DNT signals, but we honor the cookie preferences you set through our cookie preference center.",
  },
  {
    title: "Updates to This Policy",
    content: "We may update this Cookie Policy from time to time to reflect changes in technology, regulation, or our business practices. Any changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically.",
  },
  {
    title: "Contact Us",
    content: "If you have questions about our use of cookies or this Cookie Policy, please contact us at privacy@delta.health.",
  },
];

export default function CookiesPage() {
  return (
    <LegalLayout
      title="Cookie Policy"
      lastUpdated="January 15, 2026"
      sections={sections}
    />
  );
}
