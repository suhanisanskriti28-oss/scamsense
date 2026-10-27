import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../app.js";

describe("POST /api/auth/register", () => {
  it("mounts the registration endpoint and rejects invalid input", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid registration data");
  });
});
