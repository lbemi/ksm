import ReactDOM from "react-dom/client";
import "./styles.scss";
import "./assets/iconfont.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import "normalize.css";
import { ConfigProvider, theme } from "antd";
import { Provider } from "react-redux";
import store from "./store";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <ConfigProvider
    theme={{
      // 1. 单独使用暗色算法
      // algorithm: theme.defaultAlgorithm,
      // algorithm: theme.darkAlgorithm,

      // 2. 组合使用暗色算法与紧凑算法
      algorithm: [
        // theme.darkAlgorithm,
        theme.compactAlgorithm,
        // theme.defaultAlgorithm,
      ],
    }}
  >
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </ConfigProvider>
);
