import LegalLayout from "@/components/LegalLayout";

const sections = [
  {
    title: "Scope",
    content:
      "This policy describes the personal information processed by Delta's site, backend, authenticated tools, and user-authorized connectors. Delta is currently a limited personal-intelligence preview, not an advertising network or data broker.",
  },
  {
    title: "Information Delta Processes",
    content: (
      <div className="space-y-4">
        <ul className="ml-4 list-inside list-disc space-y-2">
          <li><strong>Account:</strong> email, profile name, account identifiers, and session metadata. Authentication credentials are handled by the authentication provider.</li>
          <li><strong>Access requests:</strong> name, email, an optional note, review state, and invitation history submitted for private-preview review.</li>
          <li><strong>User content:</strong> conversations, goals, preferences, and information you deliberately submit.</li>
          <li><strong>Derived information:</strong> summaries, trends, state, scenarios, and other outputs computed from authorized inputs.</li>
          <li><strong>Operations:</strong> limited request, error, security, and audit metadata needed to operate and protect Delta.</li>
          <li><strong>Connected services:</strong> data covered by the scopes you approve when linking a provider.</li>
        </ul>
      </div>
    ),
  },
  {
    title: "WHOOP Data",
    content: (
      <div className="space-y-4">
        <p>When you connect WHOOP, Delta may process:</p>
        <ul className="ml-4 list-inside list-disc space-y-2">
          <li>Connection status, approved scopes, token expiry, and a provider account identifier</li>
          <li>Recovery, HRV, resting heart rate, and supported recovery measurements</li>
          <li>Sleep timing, stages, need, performance, consistency, and disturbances</li>
          <li>Cycle timing, strain, heart-rate summaries, and energy expenditure</li>
          <li>Workout timing, type, strain, heart-rate summaries, zones, and supported distance or elevation fields</li>
        </ul>
        <p>
          Delta does not request WHOOP body-measurement scope for the current
          connector. WHOOP tokens stay server-side and are encrypted before
          storage. ChatGPT never receives those tokens or the internal WHOOP user
          identifier.
        </p>
      </div>
    ),
  },
  {
    title: "How Information Is Used",
    content: (
      <div className="space-y-4">
        <ul className="ml-4 list-inside list-disc space-y-2">
          <li>Authenticate you and operate the services you request</li>
          <li>Normalize connected data into compact owner-scoped records</li>
          <li>Answer an authorized ChatGPT tool request</li>
          <li>Produce requested summaries, trends, and experimental intelligence</li>
          <li>Protect, debug, and improve reliability without exposing credentials</li>
        </ul>
        <p>Delta does not sell personal information or use WHOOP data for advertising.</p>
      </div>
    ),
  },
  {
    title: "Raw and Normalized WHOOP Records",
    content:
      "WHOOP API responses are held in process only long enough to validate and normalize them. The current connector does not persist new raw provider response bodies, and a sync purges historical raw WHOOP rows for that owner. Delta stores only the normalized fields needed for the read tools and freshness evidence.",
  },
  {
    title: "ChatGPT Custom App",
    content:
      "If you connect Delta as a ChatGPT custom app, ChatGPT may request compact WHOOP summaries through Delta's read-only MCP tools. Requests are scoped to the authenticated Delta account. Tool responses omit OAuth credentials, account contact details, internal database identifiers, and raw provider payloads.",
  },
  {
    title: "Service Providers",
    content:
      "Delta relies on infrastructure and service providers for authentication and storage, application hosting, backend hosting, and AI or connected-service requests you initiate. Current providers include Supabase, Vercel, Render, OpenAI/ChatGPT, and WHOOP. Each provider processes information under its own terms and only for the relevant function.",
  },
  {
    title: "Retention and Deletion",
    content: (
      <div className="space-y-4">
        <p>
          Encrypted WHOOP credentials are retained while the connection is active.
          Disconnecting revokes provider access and deletes those credentials.
          Normalized WHOOP history is retained for personal history and model
          reasoning until you explicitly select history deletion or make an
          applicable deletion request.
        </p>
        <p>
          Provider cache and retention rules also apply. Delta is reviewing the
          current normalized-history retention against the{" "}
          <a
            href="https://developer.whoop.com/api-terms-of-use/"
            className="text-primary underline-offset-4 hover:underline"
          >
            WHOOP API Terms
          </a>
          . Retention may be shortened and expired records may be deleted where
          provider permissions require it. Do not use Delta as a permanent WHOOP
          archive.
        </p>
        <p>
          Other personal data is retained while needed to operate the requested
          feature, protect the service, or meet applicable obligations. Retention
          controls remain an active engineering area; unsupported deletion claims
          are not treated as completed controls.
        </p>
        <p>
          Private-preview access requests are retained while needed to review and
          administer access, protect the service, or meet applicable obligations.
          Delta has not published a fixed automated retention period for these
          records. Correction or deletion requests are reviewed through the contact
          path and are not guaranteed to be instantaneous or fully automated.
        </p>
      </div>
    ),
  },
  {
    title: "Your Controls",
    content: (
      <div className="space-y-4">
        <ul className="ml-4 list-inside list-disc space-y-2">
          <li>Refresh, reauthorize, or disconnect WHOOP from the WHOOP integration page</li>
          <li>Choose separately whether disconnecting also deletes normalized WHOOP history</li>
          <li>Disconnect the Delta app from ChatGPT</li>
          <li>Request access, export, correction, or deletion through the contact page</li>
        </ul>
        <p>
          Account-wide automated export and deletion controls are not yet represented
          as complete. Contact eric@egeng.co for a manual request.
        </p>
      </div>
    ),
  },
  {
    title: "Security",
    content:
      "Delta uses authenticated owner scoping, encrypted provider credentials, transport encryption, narrow tool responses, and tests for cross-user isolation. No online system is perfectly secure. Do not send secrets through conversation fields or support forms.",
  },
  {
    title: "Health Information",
    content:
      "Health and wellness data is sensitive. Delta is not a medical provider or medical device, and its outputs are not diagnosis or treatment. Use qualified professionals for medical decisions.",
  },
  {
    title: "Children",
    content:
      "Delta is not intended for children under 13 and does not knowingly seek their personal information.",
  },
  {
    title: "Changes and Contact",
    content:
      "This policy will be updated when Delta's data flows materially change. Questions and rights requests can be submitted at /contact or sent to eric@egeng.co.",
  },
];

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      lastUpdated="August 3, 2026"
      sections={sections}
    />
  );
}
