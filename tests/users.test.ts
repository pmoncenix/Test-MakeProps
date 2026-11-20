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
  database.prepare("INSERT INTO users (id, name, email) VALUES (?, ?, ?)")
    .run(2, "Camille Durand", "camille@example.com");
  database.prepare("INSERT INTO users (id, name, email) VALUES (?, ?, ?)")
    .run(3, "Morgan Petit", "morgan@example.com");
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

describe("PUT /user/update", () => {
  it("modifie et renvoie l’utilisateur", async () => {
    const response = await request(app)
      .put("/user/update")
      .query({ id: 2 })
      .send({ name: "Camille Martin", email: "camille.martin@example.com" });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      id: 2,
      name: "Camille Martin",
      email: "camille.martin@example.com",
    });
  });

  it("renvoie 400 si l’identifiant ou les champs sont invalides", async () => {
    const missingId = await request(app)
      .put("/user/update")
      .send({ name: "Camille", email: "camille@example.com" });
    const invalidBody = await request(app)
      .put("/user/update")
      .query({ id: 2 })
      .send({ name: " ", email: "pas-une-adresse" });

    assert.equal(missingId.status, 400);
    assert.equal(missingId.body.error.code, "INVALID_USER_ID");
    assert.equal(invalidBody.status, 400);
    assert.equal(invalidBody.body.error.code, "INVALID_USER_INPUT");
  });

  it("renvoie 400 si le JSON est mal formé", async () => {
    const response = await request(app)
      .put("/user/update?id=2")
      .set("Content-Type", "application/json")
      .send('{"name":');

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, "INVALID_JSON_BODY");
  });

  it("renvoie 404 si l’utilisateur n’existe pas", async () => {
    const response = await request(app)
      .put("/user/update")
      .query({ id: 999 })
      .send({ name: "Nouvel utilisateur", email: "new@example.com" });

    assert.equal(response.status, 404);
    assert.equal(response.body.error.code, "USER_NOT_FOUND");
  });

  it("renvoie 409 si l’email est déjà utilisé", async () => {
    const response = await request(app)
      .put("/user/update")
      .query({ id: 2 })
      .send({ name: "Camille Durand", email: "alex@example.com" });

    assert.equal(response.status, 409);
    assert.equal(response.body.error.code, "EMAIL_ALREADY_IN_USE");
  });
});

describe("DELETE /user/delete", () => {
  it("supprime l’utilisateur demandé", async () => {
    const response = await request(app).delete("/user/delete").query({ id: 3 });
    const getResponse = await request(app).get("/user/get").query({ id: 3 });

    assert.equal(response.status, 204);
    assert.equal(getResponse.status, 404);
    assert.equal(getResponse.body.error.code, "USER_NOT_FOUND");
  });

  it("renvoie 400 si l’identifiant est absent ou invalide", async () => {
    const missingId = await request(app).delete("/user/delete");
    const invalidId = await request(app).delete("/user/delete").query({ id: "abc" });

    assert.equal(missingId.status, 400);
    assert.equal(missingId.body.error.code, "INVALID_USER_ID");
    assert.equal(invalidId.status, 400);
    assert.equal(invalidId.body.error.code, "INVALID_USER_ID");
  });

  it("renvoie 404 si l’utilisateur n’existe pas", async () => {
    const response = await request(app).delete("/user/delete").query({ id: 999 });

    assert.equal(response.status, 404);
    assert.equal(response.body.error.code, "USER_NOT_FOUND");
  });
});
