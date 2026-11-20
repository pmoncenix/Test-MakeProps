import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import argon2 from "argon2";
import { jwtVerify } from "jose";
import request from "supertest";
import { createApp } from "../src/app.js";
import {
  ACCESS_TOKEN_AUDIENCE,
  ACCESS_TOKEN_ISSUER,
  AccessTokenService,
} from "../src/auth/AccessTokenService.js";
import { openDatabase } from "../src/infrastructure/sqlite/database.js";
import { UserPhotoStorage } from "../src/infrastructure/fileSystem/UserPhotoStorage.js";
import { SqliteUserRepository } from "../src/infrastructure/sqlite/SqliteUserRepository.js";
import { UserService } from "../src/users/userService.js";

const database = openDatabase(":memory:");
const photoDirectory = mkdtempSync(join(tmpdir(), "makeprops-user-photos-"));
const photoStorage = new UserPhotoStorage(photoDirectory);
const testJwtSecret = new TextEncoder().encode("test-only-jwt-secret-with-at-least-32-bytes");
const accessTokenService = new AccessTokenService(testJwtSecret);
const app = createApp(
  new UserService(new SqliteUserRepository(database), accessTokenService, photoStorage),
  accessTokenService,
  photoStorage,
);
let authToken: string;
let registeredUserId: number;
let registeredPhotoUrl: string;
const tinyPng = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000b49444154789c636000020000050001a5f645400000000049454e44ae426082",
  "hex",
);

function registerWithPhoto(fields: { firstName: string; lastName: string; email: string; password: string }) {
  return request(app)
    .post("/user/register")
    .field("firstName", fields.firstName)
    .field("lastName", fields.lastName)
    .field("email", fields.email)
    .field("password", fields.password)
    .attach("photos", tinyPng, { filename: "profile.png", contentType: "image/png" });
}

const api = {
  get: (path: string) => request(app).get(path).set("Authorization", `Bearer ${authToken}`),
  put: (path: string) => request(app).put(path).set("Authorization", `Bearer ${authToken}`),
  delete: (path: string) => request(app).delete(path).set("Authorization", `Bearer ${authToken}`),
};

before(async () => {
  database.prepare("INSERT INTO users (id, name, email) VALUES (?, ?, ?)")
    .run(1, "Alex Martin", "alex@example.com");
  database.prepare("INSERT INTO users (id, name, email) VALUES (?, ?, ?)")
    .run(2, "Camille Durand", "camille@example.com");
  database.prepare("INSERT INTO users (id, name, email) VALUES (?, ?, ?)")
    .run(3, "Morgan Petit", "morgan@example.com");
  authToken = await accessTokenService.issue({ id: 1, email: "alex@example.com" });
});

after(() => {
  database.close();
  rmSync(photoDirectory, { recursive: true, force: true });
});

describe("middleware d’authentification", () => {
  it("refuse l’accès sans jeton ou avec un jeton invalide", async () => {
    const missingToken = await request(app).get("/user/list");
    const invalidToken = await request(app)
      .get("/user/list")
      .set("Authorization", "Bearer invalid-token");
    const healthWithoutToken = await request(app).get("/health");
    const docsWithoutToken = await request(app).get("/api-docs.json");
    const docsUiWithoutToken = await request(app).get("/api-docs/");

    assert.equal(missingToken.status, 401);
    assert.equal(missingToken.body.error.code, "AUTHENTICATION_REQUIRED");
    assert.equal(missingToken.headers["www-authenticate"], "Bearer");
    assert.equal(invalidToken.status, 401);
    assert.equal(invalidToken.body.error.code, "AUTHENTICATION_REQUIRED");
    assert.equal(healthWithoutToken.status, 200);
    assert.equal(docsWithoutToken.status, 200);
    assert.equal(docsUiWithoutToken.status, 200);
  });
});

describe("GET /user/get", () => {
  it("renvoie l’utilisateur demandé", async () => {
    const response = await api.get("/user/get").query({ id: 1 });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      id: 1,
      name: "Alex Martin",
      email: "alex@example.com",
      photos: [],
    });
  });

  it("renvoie 400 si l’identifiant est absent ou invalide", async () => {
    const missingId = await api.get("/user/get");
    const invalidId = await api.get("/user/get").query({ id: "abc" });

    assert.equal(missingId.status, 400);
    assert.equal(missingId.body.error.code, "INVALID_USER_ID");
    assert.equal(invalidId.status, 400);
    assert.equal(invalidId.body.error.code, "INVALID_USER_ID");
  });

  it("renvoie 404 si l’utilisateur n’existe pas", async () => {
    const response = await api.get("/user/get").query({ id: 999 });

    assert.equal(response.status, 404);
    assert.equal(response.body.error.code, "USER_NOT_FOUND");
  });
});

describe("GET /user/list", () => {
  it("renvoie les utilisateurs et les métadonnées de pagination", async () => {
    const firstPage = await api.get("/user/list").query({ page: 1, limit: 2 });
    const secondPage = await api.get("/user/list").query({ page: 2, limit: 2 });

    assert.equal(firstPage.status, 200);
    assert.deepEqual(firstPage.body, {
      users: [
        { id: 1, name: "Alex Martin", email: "alex@example.com", photos: [] },
        { id: 2, name: "Camille Durand", email: "camille@example.com", photos: [] },
      ],
      pagination: { page: 1, limit: 2, total: 3, totalPages: 2 },
    });
    assert.equal(secondPage.status, 200);
    assert.deepEqual(secondPage.body, {
      users: [{ id: 3, name: "Morgan Petit", email: "morgan@example.com", photos: [] }],
      pagination: { page: 2, limit: 2, total: 3, totalPages: 2 },
    });
  });

  it("utilise les valeurs par défaut si aucun paramètre n’est fourni", async () => {
    const response = await api.get("/user/list");

    assert.equal(response.status, 200);
    assert.equal(response.body.pagination.page, 1);
    assert.equal(response.body.pagination.limit, 10);
    assert.equal(response.body.pagination.total, 3);
  });

  it("renvoie 400 si les paramètres de pagination sont invalides", async () => {
    const invalidPage = await api.get("/user/list").query({ page: 0 });
    const excessiveLimit = await api.get("/user/list").query({ limit: 101 });

    assert.equal(invalidPage.status, 400);
    assert.equal(invalidPage.body.error.code, "INVALID_PAGINATION");
    assert.equal(excessiveLimit.status, 400);
    assert.equal(excessiveLimit.body.error.code, "INVALID_PAGINATION");
  });
});

describe("GET /user/search", () => {
  it("recherche par prénom, nom ou email", async () => {
    const firstNameMatch = await api.get("/user/search").query({ q: "alex" });
    const lastNameMatch = await api.get("/user/search").query({ q: "martin" });
    const emailMatch = await api.get("/user/search").query({ q: "camille@example.com" });

    assert.deepEqual(firstNameMatch.body.users.map((user: { id: number }) => user.id), [1]);
    assert.deepEqual(lastNameMatch.body.users.map((user: { id: number }) => user.id), [1]);
    assert.deepEqual(emailMatch.body.users.map((user: { id: number }) => user.id), [2]);
  });

  it("applique la pagination aux résultats de recherche", async () => {
    const response = await api
      .get("/user/search")
      .query({ q: "example.com", page: 2, limit: 1 });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      users: [{ id: 2, name: "Camille Durand", email: "camille@example.com", photos: [] }],
      pagination: { page: 2, limit: 1, total: 3, totalPages: 3 },
    });
  });

  it("renvoie 400 si le terme ou la pagination est invalide", async () => {
    const missingQuery = await api.get("/user/search");
    const emptyQuery = await api.get("/user/search").query({ q: "  " });
    const invalidPage = await api.get("/user/search").query({ q: "alex", page: 0 });

    assert.equal(missingQuery.status, 400);
    assert.equal(missingQuery.body.error.code, "INVALID_SEARCH_QUERY");
    assert.equal(emptyQuery.status, 400);
    assert.equal(emptyQuery.body.error.code, "INVALID_SEARCH_QUERY");
    assert.equal(invalidPage.status, 400);
    assert.equal(invalidPage.body.error.code, "INVALID_PAGINATION");
  });

  it("ignore la casse et les accents", async () => {
    database.prepare("INSERT INTO users (id, name, email) VALUES (?, ?, ?)")
      .run(4, "Élodie Moreau", "elodie.moreau@example.com");

    try {
      const response = await api.get("/user/search").query({ q: "elodie" });

      assert.equal(response.status, 200);
      assert.deepEqual(response.body.users.map((user: { id: number }) => user.id), [4]);
    } finally {
      database.prepare("DELETE FROM users WHERE id = ?").run(4);
    }
  });
});

describe("POST /user/register", () => {
  it("crée un compte et ne renvoie ni ne stocke le mot de passe en clair", async () => {
    const password = "A memorable passphrase 2026!";
    const response = await registerWithPhoto({
        firstName: "Élodie",
        lastName: "Moreau",
        email: "ELODIE.MOREAU@example.com",
        password,
      });
    const storedUser = database.prepare(
      "SELECT first_name, last_name, password_hash FROM users WHERE email = ?",
    ).get("elodie.moreau@example.com") as {
      first_name: string;
      last_name: string;
      password_hash: string;
    } | undefined;
    const { payload } = await jwtVerify(response.body.accessToken, testJwtSecret, {
      issuer: ACCESS_TOKEN_ISSUER,
      audience: ACCESS_TOKEN_AUDIENCE,
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.user.name, "Élodie Moreau");
    assert.equal(response.body.user.email, "elodie.moreau@example.com");
    assert.equal(typeof response.body.user.id, "number");
    assert.equal(response.headers.location, `/user/get?id=${response.body.user.id}`);
    assert.deepEqual(Object.keys(response.body).sort(), ["accessToken", "expiresIn", "tokenType", "user"]);
    assert.deepEqual(Object.keys(response.body.user).sort(), ["email", "id", "name", "photos"]);
    assert.equal(response.body.user.photos.length, 1);
    assert.match(response.body.user.photos[0], /^\/uploads\/users\/[\da-f-]+\.png$/u);
    registeredUserId = response.body.user.id;
    registeredPhotoUrl = response.body.user.photos[0];
    const protectedPhoto = await request(app).get(response.body.user.photos[0]);
    const loadedPhoto = await api.get(response.body.user.photos[0]);
    assert.equal(protectedPhoto.status, 401);
    assert.equal(loadedPhoto.status, 200);
    assert.match(loadedPhoto.headers["content-type"], /^image\/png/u);
    assert.equal(response.body.tokenType, "Bearer");
    assert.equal(response.body.expiresIn, 900);
    assert.equal(payload.sub, String(response.body.user.id));
    assert.equal(payload.email, "elodie.moreau@example.com");
    assert.equal(storedUser?.first_name, "Élodie");
    assert.equal(storedUser?.last_name, "Moreau");
    assert.ok(storedUser?.password_hash.startsWith("$argon2id$"));
    assert.notEqual(storedUser?.password_hash, password);
    assert.equal(await argon2.verify(storedUser!.password_hash, password), true);
  });

  it("renvoie 400 pour des données invalides", async () => {
    const shortPassword = await request(app)
      .post("/user/register")
      .send({
        firstName: "Alex",
        lastName: "Martin",
        email: "alex2@example.com",
        password: "short",
      });
    const invalidEmail = await request(app)
      .post("/user/register")
      .send({
        firstName: "Alex",
        lastName: "Martin",
        email: "not-an-email",
        password: "A memorable passphrase 2026!",
      });
    const missingPhoto = await request(app)
      .post("/user/register")
      .send({
        firstName: "Alex",
        lastName: "Martin",
        email: "alex3@example.com",
        password: "A memorable passphrase 2026!",
      });

    assert.equal(shortPassword.status, 400);
    assert.equal(shortPassword.body.error.code, "INVALID_REGISTRATION_DATA");
    assert.equal(invalidEmail.status, 400);
    assert.equal(invalidEmail.body.error.code, "INVALID_REGISTRATION_DATA");
    assert.equal(missingPhoto.status, 400);
    assert.equal(missingPhoto.body.error.code, "INVALID_PHOTOS");
  });

  it("rejette les images dont le contenu ne correspond pas à un format autorisé", async () => {
    const response = await request(app)
      .post("/user/register")
      .field("firstName", "Noah")
      .field("lastName", "Image")
      .field("email", "noah.image@example.com")
      .field("password", "A memorable passphrase 2026!")
      .attach("photos", Buffer.from("ceci n’est pas une image"), {
        filename: "profile.png",
        contentType: "image/png",
      });

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, "INVALID_PHOTOS");
  });

  it("renvoie 409 si l’adresse email existe déjà", async () => {
    const response = await registerWithPhoto({
        firstName: "Alex",
        lastName: "Autre",
        email: "ALEX@example.com",
        password: "A memorable passphrase 2026!",
      });

    assert.equal(response.status, 409);
    assert.equal(response.body.error.code, "EMAIL_ALREADY_IN_USE");
  });
});

describe("POST /user/login", () => {
  it("vérifie le mot de passe et renvoie un jeton Bearer valide", async () => {
    const response = await request(app)
      .post("/user/login")
      .send({ email: "ELODIE.MOREAU@example.com", password: "A memorable passphrase 2026!" });
    const { payload, protectedHeader } = await jwtVerify(response.body.accessToken, testJwtSecret, {
      issuer: ACCESS_TOKEN_ISSUER,
      audience: ACCESS_TOKEN_AUDIENCE,
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.tokenType, "Bearer");
    assert.equal(response.body.expiresIn, 900);
    assert.deepEqual(response.body.user, {
      id: response.body.user.id,
      name: "Élodie Moreau",
      email: "elodie.moreau@example.com",
      photos: response.body.user.photos,
    });
    assert.deepEqual(Object.keys(response.body.user).sort(), ["email", "id", "name", "photos"]);
    assert.equal(protectedHeader.alg, "HS256");
    assert.equal(payload.sub, String(response.body.user.id));
    assert.equal(payload.email, "elodie.moreau@example.com");
    assert.ok(payload.exp);
  });

  it("renvoie la même erreur si le compte est inconnu ou le mot de passe incorrect", async () => {
    const wrongPassword = await request(app)
      .post("/user/login")
      .send({ email: "elodie.moreau@example.com", password: "incorrect passphrase 2026!" });
    const unknownAccount = await request(app)
      .post("/user/login")
      .send({ email: "unknown@example.com", password: "incorrect passphrase 2026!" });

    assert.equal(wrongPassword.status, 401);
    assert.equal(unknownAccount.status, 401);
    assert.deepEqual(wrongPassword.body, unknownAccount.body);
    assert.equal(wrongPassword.body.error.code, "INVALID_CREDENTIALS");
  });

  it("renvoie 400 si les identifiants sont mal formés", async () => {
    const response = await request(app)
      .post("/user/login")
      .send({ email: "not-an-email", password: "password" });

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, "INVALID_LOGIN_DATA");
  });
});

describe("PUT /user/update", () => {
  it("modifie et renvoie l’utilisateur", async () => {
    const response = await api
      .put("/user/update")
      .query({ id: 2 })
      .send({ name: "Camille Martin", email: "camille.martin@example.com" });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      id: 2,
      name: "Camille Martin",
      email: "camille.martin@example.com",
      photos: [],
    });
  });

  it("renvoie 400 si l’identifiant ou les champs sont invalides", async () => {
    const missingId = await api
      .put("/user/update")
      .send({ name: "Camille", email: "camille@example.com" });
    const invalidBody = await api
      .put("/user/update")
      .query({ id: 2 })
      .send({ name: " ", email: "pas-une-adresse" });

    assert.equal(missingId.status, 400);
    assert.equal(missingId.body.error.code, "INVALID_USER_ID");
    assert.equal(invalidBody.status, 400);
    assert.equal(invalidBody.body.error.code, "INVALID_USER_INPUT");
  });

  it("renvoie 400 si le JSON est mal formé", async () => {
    const response = await api
      .put("/user/update?id=2")
      .set("Content-Type", "application/json")
      .send('{"name":');

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, "INVALID_JSON_BODY");
  });

  it("renvoie 404 si l’utilisateur n’existe pas", async () => {
    const response = await api
      .put("/user/update")
      .query({ id: 999 })
      .send({ name: "Nouvel utilisateur", email: "new@example.com" });

    assert.equal(response.status, 404);
    assert.equal(response.body.error.code, "USER_NOT_FOUND");
  });

  it("renvoie 409 si l’email est déjà utilisé", async () => {
    const response = await api
      .put("/user/update")
      .query({ id: 2 })
      .send({ name: "Camille Durand", email: "alex@example.com" });

    assert.equal(response.status, 409);
    assert.equal(response.body.error.code, "EMAIL_ALREADY_IN_USE");
  });
});

describe("DELETE /user/delete", () => {
  it("supprime l’utilisateur demandé", async () => {
    const response = await api.delete("/user/delete").query({ id: 3 });
    const getResponse = await api.get("/user/get").query({ id: 3 });

    assert.equal(response.status, 204);
    assert.equal(getResponse.status, 404);
    assert.equal(getResponse.body.error.code, "USER_NOT_FOUND");
  });

  it("supprime aussi les photos associées au compte", async () => {
    const response = await api.delete("/user/delete").query({ id: registeredUserId });
    const fileName = registeredPhotoUrl.slice("/uploads/users/".length);

    assert.equal(response.status, 204);
    assert.equal(existsSync(join(photoDirectory, fileName)), false);
  });

  it("renvoie 400 si l’identifiant est absent ou invalide", async () => {
    const missingId = await api.delete("/user/delete");
    const invalidId = await api.delete("/user/delete").query({ id: "abc" });

    assert.equal(missingId.status, 400);
    assert.equal(missingId.body.error.code, "INVALID_USER_ID");
    assert.equal(invalidId.status, 400);
    assert.equal(invalidId.body.error.code, "INVALID_USER_ID");
  });

  it("renvoie 404 si l’utilisateur n’existe pas", async () => {
    const response = await api.delete("/user/delete").query({ id: 999 });

    assert.equal(response.status, 404);
    assert.equal(response.body.error.code, "USER_NOT_FOUND");
  });
});

describe("GET /user/me", () => {
  it("renvoie le profil rattaché au jeton", async () => {
    const response = await api.get("/user/me");

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      id: 1,
      name: "Alex Martin",
      email: "alex@example.com",
      photos: [],
    });
  });
});

describe("PUT /user/me", () => {
  it("modifie le profil lié au jeton, sans utiliser un ID fourni par le client", async () => {
    const response = await api.put("/user/me").send({
      id: 2,
      name: "Alex Authentifié",
      email: "alex.authentifie@example.com",
    });
    const otherUser = await api.get("/user/get").query({ id: 2 });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      id: 1,
      name: "Alex Authentifié",
      email: "alex.authentifie@example.com",
      photos: [],
    });
    assert.deepEqual(otherUser.body, {
      id: 2,
      name: "Camille Martin",
      email: "camille.martin@example.com",
      photos: [],
    });
  });

  it("gère les données invalides et les emails déjà utilisés", async () => {
    const invalidBody = await api.put("/user/me").send({ name: " ", email: "not-an-email" });
    const duplicateEmail = await api.put("/user/me").send({
      name: "Alex Authentifié",
      email: "camille.martin@example.com",
    });

    assert.equal(invalidBody.status, 400);
    assert.equal(invalidBody.body.error.code, "INVALID_USER_INPUT");
    assert.equal(duplicateEmail.status, 409);
    assert.equal(duplicateEmail.body.error.code, "EMAIL_ALREADY_IN_USE");
  });
});
