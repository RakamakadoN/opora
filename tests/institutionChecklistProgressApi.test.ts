import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import test from "node:test";

process.env.NODE_ENV = "test";
delete process.env.DATABASE_URL;
delete process.env.SUPABASE_URL;
delete process.env.PUBLIC_SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
delete process.env.SUPABASE_ANON_KEY;

const { app } = await import("../server.ts");

test("institution checklist progress API saves checked documents per authenticated child", async () => {
  const { baseUrl, close } = await startTestApi();
  try {
    const cookie = await register(baseUrl, `parent-progress-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`);

    const saveResponse = await fetch(`${baseUrl}/api/institutions/kz-almaty-pmpk-medeu/checklist-progress`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie
      },
      body: JSON.stringify({
        childId: "child-1",
        checkedDocumentIds: ["birth_certificate", "parent_identity"]
      })
    });

    assert.equal(saveResponse.status, 200);
    assert.deepEqual((await saveResponse.json()).checkedDocumentIds, ["birth_certificate", "parent_identity"]);

    const childOne = await fetch(`${baseUrl}/api/institutions/kz-almaty-pmpk-medeu/checklist-progress?childId=child-1`, {
      headers: { Cookie: cookie }
    });
    const childTwo = await fetch(`${baseUrl}/api/institutions/kz-almaty-pmpk-medeu/checklist-progress?childId=child-2`, {
      headers: { Cookie: cookie }
    });

    assert.deepEqual((await childOne.json()).checkedDocumentIds, ["birth_certificate", "parent_identity"]);
    assert.deepEqual((await childTwo.json()).checkedDocumentIds, []);
  } finally {
    await close();
  }
});

test("institution checklist progress API requires auth so the client can use local fallback", async () => {
  const { baseUrl, close } = await startTestApi();
  try {
    const response = await fetch(`${baseUrl}/api/institutions/kz-almaty-pmpk-medeu/checklist-progress?childId=child-1`);
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error, "auth_required");
  } finally {
    await close();
  }
});

test("institution checklist progress API reports unavailable when Supabase REST cannot be reached", async () => {
  const { baseUrl, close } = await startTestApi();
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const previousConsoleError = console.error;
  try {
    const cookie = await register(baseUrl, `parent-progress-supabase-down-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`);
    process.env.SUPABASE_URL = "http://127.0.0.1:9";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
    console.error = () => {};

    const response = await fetch(`${baseUrl}/api/institutions/kz-almaty-pmpk-medeu/checklist-progress`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie
      },
      body: JSON.stringify({
        childId: "child-1",
        checkedDocumentIds: ["birth_certificate"]
      })
    });

    assert.equal(response.status, 503);
    assert.equal((await response.json()).error, "institution_checklist_progress_save_failed");
  } finally {
    if (previousUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
    console.error = previousConsoleError;
    await close();
  }
});

async function startTestApi() {
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.equal(typeof address, "object");
  assert.ok(address);
  const { port } = address as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: async () => {
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  };
}

async function register(baseUrl: string, email: string) {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password: "password-123",
      fullName: "Parent"
    })
  });
  assert.equal(response.status, 201);
  const cookie = response.headers.get("set-cookie");
  assert.ok(cookie);
  return cookie.split(";")[0];
}
