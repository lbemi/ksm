import { Cluster } from "@/types/cluster";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import {get, set} from '@/utils/lcoalStorage'

const k8sStore = createSlice({
    name: 'k8s',
    initialState: {
        clusters: [] as Array<Cluster>,
        activeCluster: get("activeCluster") || ""
    },
    reducers: {
        setClusters(state, action:PayloadAction<Array<Cluster>>) {
            state.clusters = action.payload
        },
        setActiveCluster(state, action:PayloadAction<string>) {
            state.activeCluster = action.payload
            set("activeCluster",action.payload)
        }
    }
})

const { setClusters,setActiveCluster } = k8sStore.actions


export {setClusters,setActiveCluster}
export default k8sStore.reducer;