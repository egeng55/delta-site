const projectRef = process.env.SUPABASE_PROJECT_REF;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const shouldApply = process.argv.includes("--apply");

if (!projectRef || !accessToken) {
  console.error(
    "SUPABASE_PROJECT_REF and SUPABASE_ACCESS_TOKEN are required to inspect hosted Auth configuration.",
  );
  process.exit(2);
}

const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;
const headers = {
  Authorization: `Bearer ${accessToken}`,
  "Content-Type": "application/json",
};

async function readConfig() {
  const response = await fetch(endpoint, { headers });
  if (!response.ok) {
    throw new Error(`Supabase Auth config lookup failed with ${response.status}`);
  }
  return response.json();
}

try {
  const current = await readConfig();

  if (current.disable_signup === true) {
    console.log("Hosted Supabase public signup is disabled.");
    process.exit(0);
  }

  if (!shouldApply) {
    console.error(
      "Hosted Supabase public signup is still enabled. Re-run with --apply to disable it.",
    );
    process.exit(1);
  }

  const update = await fetch(endpoint, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ disable_signup: true }),
  });

  if (!update.ok) {
    throw new Error(`Supabase Auth config update failed with ${update.status}`);
  }

  const verified = await readConfig();
  if (verified.disable_signup !== true) {
    throw new Error("Supabase accepted the update but public signup is not disabled");
  }

  console.log("Hosted Supabase public signup was disabled and verified.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Hosted Auth configuration failed");
  process.exit(1);
}
