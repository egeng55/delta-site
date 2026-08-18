import { getSiteDeploymentMetadata } from "./deploymentMetadata";

describe("getSiteDeploymentMetadata", () => {
  it("prefers Vercel runtime revision metadata", () => {
    expect(
      getSiteDeploymentMetadata({
        VERCEL: "1",
        VERCEL_GIT_COMMIT_SHA: "abc123",
        VERCEL_GIT_COMMIT_REF: "main",
        VERCEL_ENV: "production",
        VERCEL_URL: "delta-site-example.vercel.app",
        DELTA_SITE_BUILD_REVISION: "older",
      }),
    ).toEqual({
      revision: {
        repository: "egeng55/delta-site",
        commit: "abc123",
        branch: "main",
        source: "vercel",
      },
      deployment: {
        platform: "vercel",
        environment: "production",
        url: "https://delta-site-example.vercel.app",
      },
    });
  });

  it("uses injected build metadata for a local build", () => {
    expect(
      getSiteDeploymentMetadata({
        DELTA_SITE_BUILD_REVISION: "local123",
        DELTA_SITE_BUILD_BRANCH: "feature",
        DELTA_SITE_BUILD_SOURCE: "git",
        NODE_ENV: "development",
      }),
    ).toEqual({
      revision: {
        repository: "egeng55/delta-site",
        commit: "local123",
        branch: "feature",
        source: "git",
      },
      deployment: {
        platform: "local",
        environment: "development",
        url: null,
      },
    });
  });
});
