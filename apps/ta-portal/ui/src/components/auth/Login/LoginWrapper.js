// src/components/auth/Login/LoginWrapper.js
"use client";

import DevLogin from "./DevLogin";
import ProdLogin from "./ProdLogin";
import ShibbLogin from './ShibbLogin';

/**
 * A wrapper component that conditionally renders the correct login system
 * based on the environment variable NEXT_PUBLIC_SERVER_ENV.
 */
export default function LoginWrapper(props) {
  const isDevEnvironment = process.env.NEXT_PUBLIC_NODE_ENV === "DEV";

  if (isDevEnvironment) {
    return <DevLogin {...props} />;
  }

  return <ShibbLogin {...props} />;
}