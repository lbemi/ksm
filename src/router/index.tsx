import { createBrowserRouter } from "react-router-dom";
import GeekLayout from "../Layout";
import { Home } from "../pages/Home";
import { Suspense, lazy } from "react";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const DeploymentView = lazy(() => import("@/pages/Workload/Deployment"));
const Pod = lazy(() => import("@/pages/Workload/Pod"));
const Message = lazy(() => import("@/pages/Message"));
const About = lazy(() => import("@/pages/About"));
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
        ],
      },
      {
        path: "network",
        element: (
          <Suspense fallback={<div>Loading...</div>}>
            <DeploymentView />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "/msg",
    element: <Message />,
  },
]);
