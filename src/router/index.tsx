import { createBrowserRouter } from "react-router-dom";
import GeekLayout from "../Layout";
import { Home } from "../pages/Home";
import { Suspense, lazy } from "react";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const DeploymentView = lazy(() => import("@/pages/Workload/Deployment"));
const Pod = lazy(() => import("@/pages/Workload/Pod"));
const StatefulSet = lazy(() => import("@/pages/Workload/StatefulSet"));
const DaemonSet = lazy(() => import("@/pages/Workload/DaemonSet"));
const Message = lazy(() => import("@/pages/Message"));
const About = lazy(() => import("@/pages/About"));
const Service = lazy(() => import("@/pages/NetWork/Service"));
const Ingress = lazy(() => import("@/pages/NetWork/Ingress"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/about",
    element: <About />,
  },
  {
    path: "/kubernetes",
    element: <GeekLayout />,
    children: [
      {
        index: true,
        path: "/kubernetes/dashboard",
        element: (
          <Suspense fallback={<div>Loading...</div>}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: "workload",
        children: [
          {
            path: "deployment",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <DeploymentView />
              </Suspense>
            ),
          },
          {
            path: "pod",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <Pod />
              </Suspense>
            ),
          },
          {
            path: "statefulset",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <StatefulSet />
              </Suspense>
            ),
          },
          {
            path: "daemonset",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <DaemonSet />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: "network",
        children: [
          {
            path: "service",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <Service />
              </Suspense>
            ),
          },
          {
            path: "ingress",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <Ingress />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
  {
    path: "/msg",
    element: <Message />,
  },
]);
