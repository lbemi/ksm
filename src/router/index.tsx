import { createBrowserRouter } from "react-router-dom";
import GeekLayout from "@/Layout";
import { Home } from "@/pages/Home";
import { Suspense, lazy } from "react";
import ConfigMapPage from "@/pages/Config/ConfigMap";
import SecretPage from "@/pages/Config/Secret";
import JobPage from "@/pages/Task/Job";
import CronJobPage from "@/pages/Task/CronJob";
import StorageClassPage from "@/pages/Storage/StorageClass";
import PersistentVolumePage from "@/pages/Storage/PersistentVolume";
import PersistentVolumeClaimPage from "@/pages/Storage/PersistentVolumeClaims";
import CustomResourceDefinitionsPage from "@/pages/CustomResource";
import Log from "@/components/CustomLog";
import TerminalWindow from "@/components/Terminal";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const DeploymentView = lazy(() => import("@/pages/Workload/Deployment"));
const Pod = lazy(() => import("@/pages/Workload/Pod"));
const StatefulSet = lazy(() => import("@/pages/Workload/StatefulSet"));
const DaemonSet = lazy(() => import("@/pages/Workload/DaemonSet"));
const Message = lazy(() => import("@/pages/Message"));
const About = lazy(() => import("@/pages/About"));
const Service = lazy(() => import("@/pages/NetWork/Service"));
const Ingress = lazy(() => import("@/pages/NetWork/Ingress"));
const NodePage = lazy(() => import("@/pages/Node"));
const NamespacePage = lazy(() => import("@/pages/Namespace"));

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
        path: "/kubernetes/node",
        element: (
          <Suspense fallback={<div>Loading...</div>}>
            <NodePage />
          </Suspense>
        ),
      },
      {
        path: "/kubernetes/namespace",
        element: (
          <Suspense fallback={<div>Loading...</div>}>
            <NamespacePage />
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
      {
        path: "/kubernetes/config",
        children: [
          {
            path: "configmap",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <ConfigMapPage />
              </Suspense>
            ),
          },
          {
            path: "secret",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <SecretPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: "/kubernetes/task",
        children: [
          {
            path: "job",
            element: <JobPage />,
          },
          {
            path: "cronjob",
            element: <CronJobPage />,
          },
        ],
      },
      {
        path: "/kubernetes/storage",
        children: [
          {
            path: "storageclass",
            element: <StorageClassPage />,
          },
          {
            path: "persistentvolume",
            element: <PersistentVolumePage />,
          },
          {
            path: "persistentvolumeclaim",
            element: <PersistentVolumeClaimPage />,
          },
        ],
      },
      {
        path: "/kubernetes/crd",
        element: <CustomResourceDefinitionsPage />,
      },
    ],
  },
  {
    path: "/msg",
    element: <Message />,
  },
  {
    //传递参数,name和namespace
    path: "/log/:name/:namespace",
    element: <Log height={"100vh"} />,
  },
  {
    path: "/terminal/:name/:namespace",
    element: <TerminalWindow height={"100vh"} />,
  },
]);
