import ReactDOM from "react-dom/client";
import "./styles.scss";
import "./assets/icon/iconfont.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import "normalize.css";
import { Provider } from "react-redux";
import store from "./store";
import { ThemeProvider } from "antd-style";
import { theme } from "antd";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <ThemeProvider
    defaultThemeMode={"auto"}
    theme={{
      algorithm: theme.compactAlgorithm,
      token: {
        // colorPrimary: "#69b4ff",
        // colorPrimary: "#0085ff",
        // primary-200:#69b4ff,
        // primary-300:#e0ffff,
        // accent-100:#006fff,
        // accent-200:#e1ffff,
        // text-100:#FFFFFF,
        // text-200:#9e9e9e,
        // bg-100:#1E1E1E,
        // bg-200:#2d2d2d,
        // bg-300:#454545,
      },
    }}
  >
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </ThemeProvider>
);
