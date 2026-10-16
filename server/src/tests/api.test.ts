import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Express } from "express";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../app.js";
import { connectDatabase, disconnectDatabase } from "../config/db.js";

let mongod: MongoMemoryServer;
let app: Express;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await connectDatabase(mongod.getUri("nivesh_test"));
  app = createApp();
}, 120000);

afterAll(async () => {
  await disconnectDatabase();
  await mongod?.stop();
});

const validUser = {
  name: "Test Investor",
  email: `investor_${Date.now()}@example.com`,
  password: "StrongPass1",
};

describe("health & public endpoints", () => {
  it("exposes a non-sensitive health check", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBeDefined();
    expect(JSON.stringify(res.body)).not.toMatch(/secret|password|mongodb:\/\//i);
  });

  it("reports market status and demo provider", async () => {
    const res = await request(app).get("/api/v1/market/status");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.provider).toBe("demo");
    expect(["OPEN", "CLOSED", "PRE_OPEN"]).toContain(res.body.data.state);
  });

  it("serves search results", async () => {
    const res = await request(app).get("/api/v1/market/search").query({ q: "reliance" });
    expect(res.status).toBe(200);
    expect(res.body.data.results[0].symbol).toBe("RELIANCE");
  });
});

describe("auth", () => {
  let agent: ReturnType<typeof request.agent>;

  it("registers a user and sets auth cookies", async () => {
    agent = request.agent(app);
    const res = await agent.post("/api/v1/auth/register").send(validUser);
    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe(validUser.email);
    const cookies = res.headers["set-cookie"] as unknown as string[];
    expect(cookies.join(";")).toMatch(/nv_access/);
    expect(cookies.join(";")).toMatch(/nv_refresh/);
    expect(cookies.join(";")).toMatch(/HttpOnly/i);
  });

  it("rejects duplicate registration with 409", async () => {
    const res = await request(app).post("/api/v1/auth/register").send(validUser);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("rejects weak passwords with 400 and field details", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ name: "Weak", email: "weak@example.com", password: "short" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_REQUEST");
  });

  it("returns the current user for an authenticated request", async () => {
    const res = await agent.get("/api/v1/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(validUser.email);
  });

  it("rejects unauthenticated access to a private endpoint", async () => {
    const res = await request(app).get("/api/v1/watchlists");
    expect(res.status).toBe(401);
  });

  it("rejects an invalid bearer token", async () => {
    const res = await request(app).get("/api/v1/users/me").set("authorization", "Bearer not-a-jwt");
    expect(res.status).toBe(401);
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({ email: validUser.email, password: validUser.password });
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(validUser.email);
  });

  it("rejects wrong credentials", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({ email: validUser.email, password: "WrongPass1" });
    expect(res.status).toBe(401);
  });
});

describe("watchlist ownership isolation", () => {
  it("prevents one user from reading another user's watchlist", async () => {
    const alice = request.agent(app);
    const bob = request.agent(app);
    await alice.post("/api/v1/auth/register").send({ name: "Alice", email: `alice_${Date.now()}@e.com`, password: "StrongPass1" });
    await bob.post("/api/v1/auth/register").send({ name: "Bob", email: `bob_${Date.now()}@e.com`, password: "StrongPass1" });

    const created = await alice.post("/api/v1/watchlists").send({ name: "Alice's Picks" });
    expect(created.status).toBe(201);
    const aliceListId = created.body.data.watchlist.id;

    const bobRead = await bob.get(`/api/v1/watchlists/${aliceListId}`);
    expect(bobRead.status).toBe(404);

    const bobDelete = await bob.delete(`/api/v1/watchlists/${aliceListId}`);
    expect(bobDelete.status).toBe(404);

    const bobOwnRead = await alice.get(`/api/v1/watchlists/${aliceListId}`);
    expect(bobOwnRead.status).toBe(200);
  });

  it("adds and removes instruments with duplicate prevention", async () => {
    const agent = request.agent(app);
    await agent.post("/api/v1/auth/register").send({ name: "Carol", email: `carol_${Date.now()}@e.com`, password: "StrongPass1" });
    const created = await agent.post("/api/v1/watchlists").send({ name: "Tech" });
    const id = created.body.data.watchlist.id;

    const add = await agent.post(`/api/v1/watchlists/${id}/items`).send({ symbol: "TCS" });
    expect(add.status).toBe(201);
    expect(add.body.data.watchlist.items[0].symbol).toBe("TCS");

    const dup = await agent.post(`/api/v1/watchlists/${id}/items`).send({ symbol: "TCS" });
    expect(dup.status).toBe(409);

    const bad = await agent.post(`/api/v1/watchlists/${id}/items`).send({ symbol: "NOTREAL" });
    expect(bad.status).toBe(400);

    const remove = await agent.delete(`/api/v1/watchlists/${id}/items/TCS`);
    expect(remove.status).toBe(200);
    expect(remove.body.data.watchlist.items).toHaveLength(0);
  });
});

describe("portfolio validation", () => {
  it("rejects non-positive quantities", async () => {
    const agent = request.agent(app);
    await agent.post("/api/v1/auth/register").send({ name: "Dave", email: `dave_${Date.now()}@e.com`, password: "StrongPass1" });
    const portfolios = await agent.get("/api/v1/portfolios");
    const id = portfolios.body.data.portfolios[0].id;
    const res = await agent.post(`/api/v1/portfolios/${id}/transactions`).send({
      symbol: "RELIANCE",
      side: "buy",
      quantity: -5,
      price: 100,
      tradedAt: new Date().toISOString(),
    });
    expect(res.status).toBe(400);
  });

  it("rejects selling more than held", async () => {
    const agent = request.agent(app);
    await agent.post("/api/v1/auth/register").send({ name: "Erin", email: `erin_${Date.now()}@e.com`, password: "StrongPass1" });
    const portfolios = await agent.get("/api/v1/portfolios");
    const id = portfolios.body.data.portfolios[0].id;
    const res = await agent.post(`/api/v1/portfolios/${id}/transactions`).send({
      symbol: "RELIANCE",
      side: "sell",
      quantity: 5,
      price: 100,
      tradedAt: new Date().toISOString(),
    });
    expect(res.status).toBe(400);
  });
});

describe("screener & suggestions", () => {
  it("runs a preset screen and reports totals", async () => {
    const res = await request(app).get("/api/v1/screener").query({ preset: "momentum", pageSize: 5 });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("total");
    expect(Array.isArray(res.body.data.results)).toBe(true);
  });

  it("rejects an unknown preset", async () => {
    const res = await request(app).get("/api/v1/screener").query({ preset: "does-not-exist" });
    expect(res.status).toBe(400);
  });

  it("returns ranked, explained suggestions", async () => {
    const res = await request(app).get("/api/v1/suggestions").query({ limit: 5 });
    expect(res.status).toBe(200);
    const { suggestions, weights, disclaimer } = res.body.data;
    expect(suggestions.length).toBeLessThanOrEqual(5);
    expect(weights.momentum).toBeGreaterThan(0);
    expect(disclaimer).toMatch(/educational research only/i);
    if (suggestions[0]) {
      expect(suggestions[0]).toHaveProperty("components");
      expect(suggestions[0]).toHaveProperty("reasons");
      expect(suggestions[0]).toHaveProperty("invalidation");
    }
  });
});

describe("paper trading", () => {
  it("rejects an order with insufficient cash and otherwise fills it", async () => {
    const agent = request.agent(app);
    await agent.post("/api/v1/auth/register").send({ name: "Frank", email: `frank_${Date.now()}@e.com`, password: "StrongPass1" });

    const huge = await agent.post("/api/v1/paper/orders").send({ symbol: "RELIANCE", side: "buy", quantity: 1_000_000 });
    expect(huge.status).toBe(400);

    const ok = await agent.post("/api/v1/paper/orders").send({ symbol: "RELIANCE", side: "buy", quantity: 1 });
    expect(ok.status).toBe(201);

    const sellTooMuch = await agent.post("/api/v1/paper/orders").send({ symbol: "RELIANCE", side: "sell", quantity: 5 });
    expect(sellTooMuch.status).toBe(400);

    const summary = await agent.get("/api/v1/paper/account");
    expect(summary.status).toBe(200);
    expect(summary.body.data.totals.equity).toBeGreaterThan(0);
  });
});
