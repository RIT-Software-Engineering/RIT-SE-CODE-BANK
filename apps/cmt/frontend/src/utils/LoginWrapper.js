"use client";

import DevLoginPage from "../pages/DevLoginPage.jsx";
import ShibbLoginPage from '../pages/ShibbLoginPage.jsx';

/**
 * A wrapper component that conditionally renders the correct login system
 */
export default function LoginWrapper(props) {
  const loginMode = (process.env.NODE_ENV === "development" ? "development" : "shibb")
  if (loginMode === "shibb"){
    return <ShibbLoginPage {...props} />;
  }
  return <DevLoginPage {...props} />;
}