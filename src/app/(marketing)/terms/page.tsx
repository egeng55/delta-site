import LegalLayout from "@/components/LegalLayout";

const sections = [
  {
    title: "Agreement and Current Status",
    content:
      "Delta is a limited personal-intelligence preview operated for private use and evaluation. By using it, you agree to these terms. Delta is not currently offered as a paid subscription, enterprise product, or generally available commercial service.",
  },
  {
    title: "What Delta Does",
    content: (
      <div className="space-y-4">
        <p>Current Delta surfaces may provide:</p>
        <ul className="ml-4 list-inside list-disc space-y-2">
          <li>Authenticated personal data and conversation tools</li>
          <li>Read-only integrations that you explicitly authorize</li>
          <li>Normalized WHOOP recovery, sleep, cycle, workout, and HRV data</li>
          <li>A ChatGPT custom app that can request owner-scoped WHOOP summaries</li>
          <li>Experimental wellness analysis, scenario evaluation, and supervised agent tooling</li>
        </ul>
        <p>
          Some repository code and preview screens represent experiments or future
          directions. They are not promises that every feature is available,
          continuously running, or suitable for production use.
        </p>
      </div>
    ),
  },
  {
    title: "Account and Authorized Connections",
    content: (
      <div className="space-y-4">
        <p>
          You are responsible for your account security and for the external
          accounts you choose to connect. Delta scopes connector data to the Delta
          account that authorized it.
        </p>
        <p>
          Public account creation is closed. An access request does not create an
          account or guarantee approval; approved requests require a separate
          owner-issued invitation.
        </p>
        <p>
          The initial WHOOP connector is read-only. Disconnecting it revokes Delta&apos;s
          provider access and deletes stored OAuth credentials. Deleting normalized
          WHOOP history is a separate explicit choice.
        </p>
      </div>
    ),
  },
  {
    title: "AI and Tool Limitations",
    content: (
      <div className="space-y-4">
        <p>
          AI-generated responses, summaries, classifications, and recommendations
          can be incomplete or wrong. Verify important information independently.
        </p>
        <ul className="ml-4 list-inside list-disc space-y-2">
          <li>Do not rely on Delta for emergencies or time-critical decisions.</li>
          <li>Review any consequential tool action before approving it.</li>
          <li>Do not assume an experimental agent completed work without evidence.</li>
          <li>Do not treat generated output as professional medical, legal, or financial advice.</li>
        </ul>
      </div>
    ),
  },
  {
    title: "Health and Wellness Disclaimer",
    content: (
      <div className="space-y-4">
        <p className="font-semibold text-red-400">
          Delta is not a medical device and does not diagnose, treat, cure, or
          prevent any disease or condition.
        </p>
        <p>
          WHOOP data, trend calculations, readiness language, and workout guidance
          are informational wellness signals. Consult a qualified professional for
          medical concerns and use emergency services when appropriate.
        </p>
      </div>
    ),
  },
  {
    title: "Data Controls",
    content:
      "You can manage and disconnect WHOOP from the WHOOP integration page. You may request an account data export or deletion through the contact page. Automated account-wide export and deletion controls are still being completed; Delta does not represent an incomplete control as available.",
  },
  {
    title: "No Paid Plans",
    content:
      "Delta does not currently sell subscriptions, trials, team plans, or payment services. Legacy plan labels or entitlement metadata in experimental code do not constitute an offer to sell. Commercial terms will be published separately before any paid service is offered.",
  },
  {
    title: "Acceptable Use",
    content:
      "Do not use Delta to violate law, access another person's data, interfere with systems, introduce malicious code, or bypass authentication and approval boundaries. Access may be suspended to protect the system or its data.",
  },
  {
    title: "Ownership",
    content:
      "You retain rights in the personal data you provide. Delta's source code, interface, documentation, and original system materials remain the property of their respective owner or licensor. Third-party services and data remain subject to their own terms.",
  },
  {
    title: "Availability and Liability",
    content:
      "Delta is provided as-is and as-available for personal evaluation, without a service-level guarantee. To the extent permitted by applicable law, the operator is not liable for indirect or consequential loss arising from unavailable services, inaccurate AI output, or decisions made from experimental guidance.",
  },
  {
    title: "Changes",
    content:
      "These terms may change as Delta's capabilities and access model change. The updated date on this page identifies the current version. Material commercial terms will not be introduced silently.",
  },
  {
    title: "Contact",
    content: "Questions or requests can be submitted at /contact or sent to eric@egeng.co.",
  },
];

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Use"
      lastUpdated="August 3, 2026"
      sections={sections}
    />
  );
}
