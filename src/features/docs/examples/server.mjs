// server.mjs — back-end de VOTRE application (Node 20+, Express 5).
// Il détient le secret de l'application et relaie les appels à l'API d'authentification :
// le navigateur ne voit jamais x-app-secret.
import express from "express";

const { AUTH_API_URL, AUTH_APP_ID, AUTH_APP_SECRET, PORT = 3001 } = process.env;

/** Appelle /consumers/auth/* avec les identifiants de l'application. */
async function authApi(path, { method = "POST", body, accessToken } = {}) {
  const response = await fetch(`${AUTH_API_URL}/consumers/auth${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-app-id": AUTH_APP_ID,
      "x-app-secret": AUTH_APP_SECRET,
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
    body: body && JSON.stringify(body),
  });
  return { status: response.status, data: await response.json() };
}

const app = express();
app.use(express.json());

/** Relaie la requête du navigateur vers l'API et renvoie sa réponse telle quelle (erreurs comprises). */
const relay = (path) => async (req, res) => {
  const { status, data } = await authApi(path, { body: req.body });
  res.status(status).json(data);
};

app.post("/auth/register", relay("/register")); // { firstName, lastName, email, password, confirmPassword }
app.post("/auth/verify-email", relay("/verifyEmail")); // { email, code }
app.post("/auth/login", relay("/login")); // { email, password } -> tokens, ou { MFARequired: true }
app.post("/auth/login/mfa", relay("/loginByMFA")); // { email, mfaCode } -> tokens
app.post("/auth/refresh", relay("/refresh")); // { refreshToken } -> nouvelle paire de tokens
app.post("/auth/logout", relay("/logout")); // { refreshToken }

/**
 * Protège vos routes métier. L'API vérifie l'access token (signature, expiration, révocation)
 * et renvoie le profil. L'identifiant est seulement lu dans le token, pas vérifié ici :
 * l'API refuse un token qui ne correspond pas à cet utilisateur.
 */
async function requireUser(req, res, next) {
  const accessToken = req.headers.authorization?.replace(/^Bearer /, "");
  if (!accessToken) return res.status(401).json({ error: "Non connecté" });

  const payload = JSON.parse(Buffer.from(accessToken.split(".")[1] ?? "", "base64url"));
  const { status, data } = await authApi(`/me/${payload.jwtPayload?.id}`, {
    method: "GET",
    accessToken,
  });
  if (status !== 200) return res.status(401).json({ error: "Session invalide ou expirée" });

  req.user = data;
  next();
}

// Exemple de route métier réservée aux utilisateurs connectés.
app.get("/api/profile", requireUser, (req, res) => res.json(req.user));

app.listen(PORT, () => console.log(`Back de l'application sur http://localhost:${PORT}`));
