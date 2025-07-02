'use client';
import UserPage from "./admin";
import Navbar from "../navbar/Navbar";
import AdminPage from "./admin";

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Navbar />
      <AdminPage />
    </>
  );
}

export default MyApp;