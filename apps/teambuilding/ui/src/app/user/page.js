'use client';
import UserPage from "./user";
import Navbar from "../navbar/Navbar";

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Navbar />
      <UserPage />
    </>
  );
}

export default MyApp;