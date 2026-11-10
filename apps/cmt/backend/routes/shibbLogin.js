import express from "express";

export default function makeAuthRouter(prisma) {
  const router = express.Router();

  // ---------------------------------------------------------------------------
  // GET /me
  // Validates the current SAML session and returns the logged-in user.
  // The SAML middleware (e.g. passport-saml) should populate req.user.
  // ---------------------------------------------------------------------------
  router.get("/me", (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    return res.json({ user: req.user });
  });

  // ---------------------------------------------------------------------------
  // GET /users/:id
  // Looks up a user in the database by their auth ID.
  // ---------------------------------------------------------------------------
  router.get("/users/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const user = await prisma.User.findUnique({
        where: { authId: id },
      });

      if (!user) return res.status(404).json({ error: "User not found" });
      return res.json(user);
    } catch (e) {
      res.status(500).json({
        error: "Failed to fetch user",
        detail: String(e.message || e),
      });
    }
  });


  router.get(
    "/login",
    (req, res) => {
      const returnTo = typeof req.query.returnTo === "string" ? req.query.returnTo : "/";
      const allowed = "https://apps.se.rit.edu/cmt";

      if (!returnTo.startsWith(allowed)) {
        return res.status(400).json({ error: "Invalid returnTo URL" });
      }

      return res.redirect(returnTo);
    }
  );

  return router;
}