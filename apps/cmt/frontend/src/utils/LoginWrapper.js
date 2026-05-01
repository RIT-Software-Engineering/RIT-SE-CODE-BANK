"use client";

import DevLoginPage from "../pages/DevLoginPage";
import ShibbLoginPage from '../pages/ShibbLoginPage';

/**
 * A wrapper component that conditionally renders the correct login system
 */
export default function LoginWrapper(props) {
  const {loginMode} = props
  if (loginMode === "shibb"){
    return <ShibbLoginPage {...props} />;
  }
  return <DevLoginPage {...props} />;
}