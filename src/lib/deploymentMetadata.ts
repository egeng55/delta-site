export type RevisionSource = "vercel" | "git" | "unknown";

export interface SiteDeploymentMetadata {
  revision: {
    repository: "egeng55/delta-site";
    commit: string;
    branch: string;
    source: RevisionSource;
  };
  deployment: {
    platform: "vercel" | "local" | "unknown";
    environment: string;
    url: string | null;
  };
}

type Environment = Record<string, string | undefined>;

function nonEmpty(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function httpsUrl(hostname: string | null): string | null {
  if (!hostname) return null;
  return hostname.startsWith("http://") || hostname.startsWith("https://")
    ? hostname
    : `https://${hostname}`;
}

export function getSiteDeploymentMetadata(
  environment: Environment = process.env,
): SiteDeploymentMetadata {
  const vercelRevision = nonEmpty(environment.VERCEL_GIT_COMMIT_SHA);
  const buildRevision = nonEmpty(environment.DELTA_SITE_BUILD_REVISION);
  const revisionSource = nonEmpty(environment.DELTA_SITE_BUILD_SOURCE);
  const isVercel = environment.VERCEL === "1" || Boolean(vercelRevision);

  return {
    revision: {
      repository: "egeng55/delta-site",
      commit: vercelRevision ?? buildRevision ?? "unknown",
      branch:
        nonEmpty(environment.VERCEL_GIT_COMMIT_REF) ??
        nonEmpty(environment.DELTA_SITE_BUILD_BRANCH) ??
        "unknown",
      source: isVercel
        ? "vercel"
        : revisionSource === "git"
          ? "git"
          : "unknown",
    },
    deployment: {
      platform: isVercel ? "vercel" : buildRevision ? "local" : "unknown",
      environment:
        nonEmpty(environment.VERCEL_ENV) ??
        nonEmpty(environment.NODE_ENV) ??
        "unknown",
      url: httpsUrl(
        nonEmpty(environment.VERCEL_URL) ??
          nonEmpty(environment.VERCEL_PROJECT_PRODUCTION_URL),
      ),
    },
  };
}
