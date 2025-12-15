import { expressjwt } from "express-jwt";
import jwksRsa from "jwks-rsa";

// Replace with your Keycloak realm URL
const keycloakIssuer = "http://localhost:8080/realms/scoop-realm";

export const checkJwt = expressjwt({
  // Dynamically provide a signing key based on the kid in the header and the signing keys provided by the JWKS endpoint
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `${keycloakIssuer}/protocol/openid-connect/certs`,
  }),

  // Validate the audience and the issuer
  audience: "account", // Usually 'account' or your client ID
  issuer: keycloakIssuer,
  algorithms: ["RS256"],
});

export default checkJwt;