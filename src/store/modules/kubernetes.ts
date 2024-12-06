import { Cluster } from "@/types/cluster";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import {get, set} from '@/utils/lcoalStorage'
import { Namespace } from "kubernetes-models/v1";

interface KubernetesState {
    clusters: Array<Cluster>;
    activeCluster: string;
    namespaces: Array<Namespace>;
}

const initialState: KubernetesState = {
    clusters: [],
    activeCluster: get("activeCluster") || "",
    namespaces: [],
};

const k8sStore = createSlice({
    name: 'k8s',
    initialState,
    reducers: {
        setClusters(state, action: PayloadAction<Array<Cluster>>) {
            state.clusters = action.payload;
        },
        setActiveCluster(state, action: PayloadAction<string>) {
            state.activeCluster = action.payload;
            set("activeCluster", action.payload);
        },
        setNamespaces(state, action: PayloadAction<Array<Namespace>>) {
            state.namespaces = action.payload;
            set("namespace", action.payload);
        }
    }
});

const { setClusters,setActiveCluster,setNamespaces } = k8sStore.actions


export {setClusters,setActiveCluster,setNamespaces}
export default k8sStore.reducer;