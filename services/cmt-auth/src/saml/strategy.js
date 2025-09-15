const { Strategy: SamlStrategy } = require("passport-saml");

// Helper to normalize multi-valued attrs to an array of strings
function toArray(v) {
  if (!v) return [];
  return Array.isArray(v) ? v.map(String) : [String(v)];
}

function createSamlStrategy(cfg) {
  return new SamlStrategy(
    {
      entryPoint: cfg.IDP_ENTRYPOINT,    // RIT IdP SSO URL
      issuer: cfg.SP_ENTITY_ID,          // Your SP EntityID
      callbackUrl: cfg.ACS_URL,          // https://auth.example.com/saml/acs
      cert: cfg.IDP_CERT,                // IdP signing cert (PEM)
      identifierFormat: null,            // let IdP choose (or set to email/unspecified if required)
      disableRequestedAuthnContext: true // fewer surprises across IdPs
    },
    (profile, done) => {
      // Pull the attributes RIT releases to your SP
      const affiliations = toArray(
        profile.ritEduAffiliation || profile["ritEduAffiliation"]
      ).map((s) => s.toLowerCase());

      // Enforce Employee-only access
      if (!affiliations.includes("employee")) {
        return done(null, false, { message: "Not an employee" });
      }

      const user = {
        id: profile.nameID,
        uid: profile.uid,
        email: profile.mail || profile.email || profile.nameID,
        givenName: profile.givenName,
        sn: profile.sn,
        affiliations
      };

      return done(null, user);
    }
  );
}

module.exports = { createSamlStrategy };
