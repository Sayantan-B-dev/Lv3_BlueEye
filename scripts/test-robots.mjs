import test from "node:test";
import assert from "node:assert/strict";
import {
  ALLOWED_BOTS,
  BLOCKED_BOTS,
  PRIVATE_PATHS,
  buildRobotsRules,
} from "../lib/seo/robotsPolicy.ts";

test("Google, Bing, and preview fetchers are not blocked", () => {
  const blocked = new Set(BLOCKED_BOTS.map((bot) => bot.toLowerCase()));
  for (const bot of ALLOWED_BOTS) {
    assert.equal(blocked.has(bot.toLowerCase()), false, `${bot} must stay allowed`);
  }
});

test("AI and SEO scrapers are blocked", () => {
  for (const bot of ["GPTBot", "ClaudeBot", "CCBot", "AhrefsBot", "SemrushBot", "MJ12bot"]) {
    assert.ok(BLOCKED_BOTS.includes(bot), `${bot} must be blocked`);
  }
});

test("private paths stay disallowed", () => {
  for (const path of ["/admin/", "/api/", "/login", "/profile", "/my-ticket/"]) {
    assert.ok(PRIVATE_PATHS.includes(path), `${path} must stay private`);
  }
});

test("wildcard rules allow public pages and do not allow the image optimizer", () => {
  const rules = buildRobotsRules();
  const wildcard = rules.find((rule) => rule.userAgent === "*");
  assert.ok(wildcard);
  assert.equal(wildcard.allow, "/");
  assert.equal(JSON.stringify(wildcard).includes("/_next/image"), false);
});

test("blocked bots disallow the whole site", () => {
  const rules = buildRobotsRules();
  for (const bot of BLOCKED_BOTS) {
    const rule = rules.find((item) => item.userAgent === bot);
    assert.ok(rule, `${bot} rule missing`);
    assert.equal(rule.disallow, "/");
  }
});
