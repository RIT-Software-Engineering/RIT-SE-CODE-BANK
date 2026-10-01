'use client';
import UserPage from "../library/admin";
import Navbar from "../navbar/Navbar";
import AdminPage from "../library/admin";

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Navbar />
      <AdminPage />
    </>
  );
}

export default MyApp;