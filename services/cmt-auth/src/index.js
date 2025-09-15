require("dotenv").config();
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const passport = require("passport");
const cors = require("cors");
const { createSamlStrategy } = require("./saml/strategy");

const PORT = process.env.PORT || 3001;
const AUTH_BASE_URL = process.env.AUTH_BASE_URL || `http://localhost:${PORT}`;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173"; // Vite default
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

const cfg = {
  IDP_ENTRYPOINT: process.env.SAML_IDP_ENTRYPOINT, // RIT SSO URL
  IDP_ENTITY_ID: process.env.SAML_IDP_ENTITYID,
  IDP_CERT: process.env.SAML_IDP_CERT,
  SP_ENTITY_ID: process.env.SAML_SP_ENTITYID || `${AUTH_BASE_URL}/sp`,
  ACS_PATH: process.env.SAML_ACS_PATH || "/saml/acs"
};
cfg.ACS_URL = `${AUTH_BASE_URL}${cfg.ACS_PATH}`;

const app = express();

// CORS (if client hosted on another origin)
app.use(cors({
  origin: CLIENT_ORIGIN,
  credentials: true
}));

app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
  secret: process.env.SESSION_SECRET || "dev-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: /^https:/.test(AUTH_BASE_URL), // true in prod with https
    domain: COOKIE_DOMAIN,                 // e.g., .yourdomain.com (optional)
    maxAge: 1000 * 60 * 30                 // 30 minutes
  }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Configure SAML
const samlStrategy = createSamlStrategy(cfg);
passport.use("saml", samlStrategy);

// Health
app.get("/health", (_, res) => res.json({ ok: true }));

// Login (SP-initiated). Preserve target path with RelayState.
app.get("/login", (req, res, next) => {
  const returnTo = req.query.returnTo || "/";
  passport.authenticate("saml", { additionalParams: { RelayState: returnTo } })(req, res, next);
});

// ACS — IdP POST target
app.post(cfg.ACS_PATH,
  passport.authenticate("saml", { failureRedirect: "/forbidden" }),
  (req, res) => {
    const relay = req.body?.RelayState || "/";
    res.redirect(relay);
  }
);

// Protected API
function requireAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  const returnTo = encodeURIComponent(req.originalUrl);
  return res.redirect(`/login?returnTo=${returnTo}`);
}

app.get("/api/me", requireAuth, (req, res) => res.json(req.user));

app.get("/forbidden", (_, res) => res.status(403).send("Access denied"));

// Local logout (does not log out of IdP)
app.post("/logout", (req, res) => {
  req.logout(() => res.status(204).end());
});

// Serve SP metadata (give this XML to RIT ITS)
app.get("/saml/metadata", (req, res) => {
  const metadata = samlStrategy.generateServiceProviderMetadata();
  res.type("application/xml").send(metadata);
});

app.listen(PORT, () => {
  console.log(`cmt-auth listening on ${AUTH_BASE_URL}`);
});
