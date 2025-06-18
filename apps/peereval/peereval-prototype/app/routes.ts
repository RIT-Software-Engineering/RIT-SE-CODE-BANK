import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("peerDashboard", "./routes/peerDashboard.tsx"),
    route("projects/:pid", "./routes/projectView.tsx"),
    route("feedbackForm/:fid", "./routes/feedbackForm.tsx"),
    route("receivedFeedback/:fid", "./routes/receivedFeedback.tsx")
] satisfies RouteConfig;
