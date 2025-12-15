import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: "http://localhost:8080", // Your Keycloak URL
  realm: "scoop-realm",
  clientId: "realm-client",
});

export default keycloak;