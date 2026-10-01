'use client';
import ManagerPage from "../library/manager";
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