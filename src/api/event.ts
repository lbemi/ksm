import { Event } from "kubernetes-models/v1";
import { kubernetes_request } from "./cluster";

// /api/v1/namespaces/default/events?limit=500
// /api/v1/namespaces/default/name/test-deploy-578dbbfffc-b6dw5/kind/Pod/events?limit=500
//       /namespaces/${namespace}/name/${name}/kind/${resource}/events
export const getEventsByResource = async (
  name: string,
  namespace: string,
  kind: string
) => {
  const response = await kubernetes_request<Array<Event>>(
    "GET",
    `/api/v1/namespaces/${namespace}/events?fieldSelector=involvedObject.name=${name},involvedObject.kind=${kind}`
  );
  return response;
};
export const listEvents = async (_name: string, namespace: string) => {
  const response = await kubernetes_request<Array<Event>>(
    "GET",
    `/api/v1/namespaces/${namespace}/events`
  );
  return response;
};
