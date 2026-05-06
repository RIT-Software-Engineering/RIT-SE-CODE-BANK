import { Outlet } from "react-router-dom";
import SiteNav from "./components/SiteNav.jsx";
import React from "react";

export default function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-full">
        <SiteNav />
        <main>
            <Outlet />
        </main>
      </div>
    </ErrorBoundary>
  );
}

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("Error caught by boundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Something went wrong.</h2>
          <pre>{this.state.error?.message}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}