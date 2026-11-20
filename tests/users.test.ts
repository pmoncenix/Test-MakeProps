import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import request from "supertest";
import { createApp } from "../src/app.js";
import { openDatabase } from "../src/infrastructure/sqlite/database.js";
import { SqliteUserRepository } from "../src/infrastructure/sqlite/SqliteUserRepository.js";
import { UserService } from "../src/users/userService.js";

const database = openDatabase(":memory:");
const app = createApp(new UserService(new SqliteUserRepository(database)));

before(() => {
  database.prepare("INSERT INTO users (id, name, email) VALUES (?, ?, ?)")
    .run(1, "Alex Martin", "alex@example.com");
});

after(() => database.close());

describe("GET /user/get", () => {
  it("renvoie l’utilisateur demandé", async () => {
    const response = await request(app).get("/user/get").query({ id: 1 });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      id: 1,
      name: "Alex Martin",
      email: "alex@example.com",
    });
  });

  it("renvoie 400 si l’identifiant est absent ou invalide", async () => {
    const missingId = await request(app).get("/user/get");
    const invalidId = await request(app).get("/user/get").query({ id: "abc" });

    assert.equal(missingId.status, 400);
    assert.equal(missingId.body.error.code, "INVALID_USER_ID");
    assert.equal(invalidId.status, 400);
    assert.equal(invalidId.body.error.code, "INVALID_USER_ID");
  });

  it("renvoie 404 si l’utilisateur n’existe pas", async () => {
    const response = await request(app).get("/user/get").query({ id: 999 });

    assert.equal(response.status, 404);
    assert.equal(response.body.error.code, "USER_NOT_FOUND");
  });
});
