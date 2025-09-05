import "dayjs/locale/zh-cn";
import enUS from "antd/es/locale/en_US";
import zhCN from "antd/es/locale/zh_CN";
import dayjs from "dayjs";

import { ConfigProvider, Spin, theme as antdTheme } from "antd";
import { Suspense, useEffect } from "react";
import { IntlProvider } from "react-intl";
import { useSelector } from "react-redux";
import { LocaleFormatter, localeConfig } from "./locales";
import { RootState } from "./store";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";

const App: React.FC = () => {
  const { theme, loading, locale, compact } = useSelector(
    (state: RootState) => state.theme
  );

  useEffect(() => {
    if (locale === "en_US") {
      dayjs.locale("en");
    } else if (locale === "zh_CN") {
      dayjs.locale("zh-cn");
    }
  }, [locale]);

  return (
    <ConfigProvider
      locale={locale === "en_US" ? enUS : zhCN}
      componentSize="middle"
      theme={{
        token: {},
        algorithm: [
          ...(theme === "dark" ? [antdTheme.darkAlgorithm] : []),
          ...(compact ? [antdTheme.compactAlgorithm] : []),
        ],
      }}
    >
      <IntlProvider
        locale={locale.split("_")[0]}
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
