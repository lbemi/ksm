import { Outlet, createBrowserRouter } from "react-router-dom";
import GeekLayout from "../pages/Layout";
import { Home } from "../pages/Home";
import { Suspense, lazy } from "react";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Deployment = lazy(() => import("@/pages/Workload/Deployment"));
const Pod = lazy(() => import("@/pages/Workload/Pod"));
export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
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
                <Deployment />
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
            <Deployment />
          </Suspense>
        ),
      },
    ],
  },
]);
