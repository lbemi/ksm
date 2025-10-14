import { Cluster } from "@/types/cluster";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

interface KubernetesState {
  clusters: Array<Cluster>;
  activeCluster: string;
  namespace: string;
}

const initialState: KubernetesState = {
  clusters: [],
  activeCluster: localStorage.getItem("activeCluster") || "",
  namespace: localStorage.getItem("namespace") || "default",
};

const k8sStore = createSlice({
  name: "k8s",
  initialState,
  reducers: {
    setClusters(state, action: PayloadAction<Array<Cluster>>) {
      state.clusters = action.payload;
    },
    setActiveCluster(state, action: PayloadAction<string>) {
      state.activeCluster = action.payload;
      localStorage.setItem("activeCluster", action.payload);
    },
    setActiveNamespace(state, action: PayloadAction<string>) {
      state.namespace = action.payload;
      localStorage.setItem("namespace", action.payload);
    },
  },
});

const { setClusters, setActiveCluster, setActiveNamespace } = k8sStore.actions;

export { setClusters, setActiveCluster, setActiveNamespace };
export default k8sStore.reducer;
