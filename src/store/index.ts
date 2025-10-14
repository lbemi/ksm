import { configureStore } from "@reduxjs/toolkit";

import k8sReducer from "./modules/kubernetes";
import themeReducer from "./modules/theme";

const store = configureStore({
  reducer: {
    kubernetes: k8sReducer,
    theme: themeReducer,
  },
});

// 从 store 本身推断 `RootState` 和 `AppDispatch` 类型
export type RootState = ReturnType<typeof store.getState>;
// 推断类型：{posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

export default store;
