import "@testing-library/jest-dom";

// Unit tests never opt into the developer's live local workspace.
delete process.env.DELTA_HQ_LOCAL_WORKSPACE;
delete process.env.DELTA_HQ_SITE_ORIGIN;
