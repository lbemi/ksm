export interface Cluster {
  name: string;
  url: string;
  version: string;
  platform: string;
  status: boolean;
}

export interface ClusterInfo {
  server: string;
  certificate_authority_data: string;
}
export interface K8sResponse {
  items: Array<Namespace>;
}
