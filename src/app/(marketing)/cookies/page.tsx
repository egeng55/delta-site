import LegalLayout from "@/components/LegalLayout";

const sections = [
  {
    title: "Current Use",
    content:
      "Delta uses essential cookies or equivalent browser storage for authentication, session continuity, security, and a small number of local preferences. The current site does not use advertising cookies or present a paid marketing-cookie program.",
  },
  {
    title: "Authentication and Local Storage",
    content:
      "The authentication provider may store session information in your browser so you remain signed in. Delta's public chat demo may store a random demo identifier in local storage. These values support requested functionality; they are not used to build advertising profiles.",
  },
  {
    title: "Services Not Currently Claimed",
    content:
      "Delta does not currently claim Google Analytics, Stripe, Intercom, cross-site advertising cookies, or a non-essential cookie preference center. This policy will be updated before any such technology is intentionally enabled.",
  },
  {
    title: "Your Browser Controls",
    content:
      "You can inspect, clear, or block cookies and local storage through browser settings. Clearing authentication storage signs you out and may reset local preferences. Blocking essential storage can prevent authenticated features from working.",
  },
  {
    title: "Changes and Contact",
    content:
      "This policy will be updated when browser-storage behavior changes. Questions can be submitted at /contact or sent to eric@egeng.co.",
  },
];

export default function CookiesPage() {
  return (
    <LegalLayout
      title="Cookie and Browser Storage Policy"
      lastUpdated="August 3, 2026"
      sections={sections}
    />
  );
}
