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

  // set the locale for the user
  // more languages options can be added here
  useEffect(() => {
    if (locale === "en_US") {
      dayjs.locale("en");
    } else if (locale === "zh_CN") {
      dayjs.locale("zh-cn");
    }
  }, [locale]);

  /**
   * handler function that passes locale
   * information to ConfigProvider for
   * setting language across text components
   */
  const getAntdLocale = () => {
    if (locale === "en_US") {
      return enUS;
    } else if (locale === "zh_CN") {
      return zhCN;
    }
  };

  return (
    <ConfigProvider
      locale={getAntdLocale()}
      componentSize="middle"
      theme={{
        token: { colorPrimary: "#13c2c2" },
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
          <Spin
            spinning={loading}
            className="app-loading-wrapper"
            style={{
              backgroundColor:
                theme === "dark"
                  ? "rgba(0, 0, 0, 0.44)"
                  : "rgba(255, 255, 255, 0.44)",
            }}
            tip={<LocaleFormatter id="cluster.loading" />}
          ></Spin>
          <RouterProvider router={router} />
        </Suspense>
      </IntlProvider>
    </ConfigProvider>
  );
};

export default App;
