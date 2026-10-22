import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const routes = [
  "app/api/users/favorites/route.ts",
  "app/api/users/profile/route.ts",
  "app/api/users/inquiries/route.ts",
  "app/api/users/applications/route.ts",
  "app/api/users/applications/[id]/route.ts",
  "app/api/users/tickets/route.ts",
  "app/api/reviews/mine/route.ts",
];

const dataAccess = [
  "await connectToDatabase(",
  "await getCache",
  "await verifyOwnership(",
  "await userTicketsFor(",
  "await request.json(",
  "await User.find",
  "await Review.find",
  "await Inquiry.find",
  "await ArtistApplicant.find",
  "await userTicketsFor(",
];

for (const route of routes) {
  test(`${route} checks auth before data access`, () => {
    const source = readFileSync(route, "utf8");
    const handlers = source.split(/(?=export async function )/).filter((part) => part.startsWith("export async function "));
    assert.ok(handlers.length > 0, "no exported handlers found");

    for (const handler of handlers) {
      const authIndex = handler.indexOf("getServerSession(");
      assert.ok(authIndex >= 0, `${route} handler is missing getServerSession`);

      const accesses = dataAccess
        .map((pattern) => handler.indexOf(pattern))
        .filter((index) => index >= 0);
      if (accesses.length === 0) continue;

      const firstDataAccess = Math.min(...accesses);
      assert.ok(
        authIndex < firstDataAccess,
        `${route} accesses data before checking auth`
      );
    }
  });
}
