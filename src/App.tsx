import "dayjs/locale/zh-cn";
import enUS from "antd/es/locale/en_US";
import zhCN from "antd/es/locale/zh_CN";
import dayjs from "dayjs";

import { ConfigProvider, theme as antdTheme } from "antd";
import { Suspense, useEffect } from "react";
import { IntlProvider } from "react-intl";
import { useSelector } from "react-redux";
import { localeConfig } from "./locales";
import { RootState } from "./store";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import windows from "./utils/windows";

const App: React.FC = () => {
  const { theme, locale, compact } = useSelector(
    (state: RootState) => state.theme
  );
  const w = new windows.Windows();

  useEffect(() => {
    if (locale === "en_US") {
      dayjs.locale("en");
    } else if (locale === "zh_CN") {
      dayjs.locale("zh-cn");
    }
  }, [locale]);

  useEffect(() => {
    w.onListen();
  });

  return (
    <ConfigProvider
      locale={locale === "en_US" ? enUS : zhCN}
      componentSize="middle"
      theme={{
        token: {
          colorSuccess: "#3f6600",
          // colorPrimary: "#9254de",
        },
        algorithm: [
          ...(theme === "dark" ? [antdTheme.darkAlgorithm] : []),
          ...(compact ? [antdTheme.compactAlgorithm] : []),
        ],
      }}
    >
      <IntlProvider
        locale={locale.split("_")[0]}
        // locale={locale === "zh_CN" ? "zh" : "en"}
        messages={localeConfig[locale]}
      >
        <Suspense fallback={null}>
          <RouterProvider router={router} />
        </Suspense>
      </IntlProvider>
    </ConfigProvider>
  );
};

export default App;
