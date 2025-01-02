import ReactDOM from "react-dom/client";
import "./styles.scss";
import "./assets/icon/iconfont.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import "normalize.css";
import { Provider } from "react-redux";
import store from "./store";
import { ThemeProvider } from "antd-style";
// import { theme } from "antd";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <ThemeProvider defaultThemeMode={"auto"}>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </ThemeProvider>
);
