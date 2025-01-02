export interface Cluster {
  name: string;
  cluster: ClusterInfo;
}

export interface ClusterInfo {
  server: string;
  certificate_authority_data: string;
}
export interface K8sResponse {
  items: Array<Namespace>;
}
