import "dotenv/config";
import { hashPassword } from "../auth/passwordService.js";
import { openDatabase } from "../infrastructure/sqlite/database.js";

if (process.env.NODE_ENV?.toLowerCase() === "production") {
  throw new Error("Le seed de démonstration ne peut pas être exécuté en production.");
}

const testUser = {
  firstName: "Utilisateur",
  lastName: "Test",
  email: "test@example.com",
  password: "Makeprops-Test-User-2026!",
};
const databasePath = process.env.DATABASE_PATH ?? "./data/app.sqlite";
const database = openDatabase(databasePath);

try {
  database.prepare(`
    INSERT INTO users (name, email)
    VALUES (?, ?)
    ON CONFLICT(email) DO NOTHING
  `).run("Utilisateur de démonstration", "demo@example.com");

  const user = database.prepare("SELECT id FROM users WHERE email = ?")
    .get("demo@example.com") as { id: number } | undefined;

  if (user) {
    console.log(`Utilisateur de démonstration prêt : GET /user/get?id=${user.id}`);
  }

  const passwordHash = await hashPassword(testUser.password);
  database.prepare(`
    INSERT INTO users (name, first_name, last_name, email, password_hash)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      name = excluded.name,
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      password_hash = excluded.password_hash
  `).run(
    `${testUser.firstName} ${testUser.lastName}`,
    testUser.firstName,
    testUser.lastName,
    testUser.email,
    passwordHash,
  );

  console.log(`Compte de test prêt : ${testUser.email} / ${testUser.password}`);
} finally {
  database.close();
}
