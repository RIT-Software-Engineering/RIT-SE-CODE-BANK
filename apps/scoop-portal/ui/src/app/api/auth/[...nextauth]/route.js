import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

export const authOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
      issuer: process.env.KEYCLOAK_ISSUER,
    }),
  ],
  callbacks: {
    // 1. Save the tokens from Keycloak into the NextAuth JWT
    async jwt({ token, account }) {
      if (account) {
        token.id_token = account.id_token;
        token.access_token = account.access_token;
      }
      return token;
    },
    // 2. Expose the tokens to the Next.js session (client & server)
    async session({ session, token }) {
      session.user.access_token = token.access_token;
      session.user.id_token = token.id_token;
      return session;
    },
  },
  // Optional: Custom logout logic if you want to clear Keycloak session too
  events: {
    async signOut({ token }) {
      // Logic for federated logout can go here or in a separate route
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };