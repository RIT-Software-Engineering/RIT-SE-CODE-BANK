'use client';
import ManagerPage from "./manager";
import Navbar from "../navbar/Navbar";
function MyApp({ Component, pageProps }) {
  return (
    <>
      <Navbar />
      <ManagerPage />
    </>
  );
}

export default MyApp;