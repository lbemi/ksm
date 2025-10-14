import { FC, useEffect, useState } from "react";
import CustomBox from "@/components/CustomBox";
import "./index.scss";
import { Badge, Button } from "antd";
import { checkUpdate, installUpdate } from "@/utils/version";
import { useLocale } from "@/locales";
import { getVersion } from "@tauri-apps/api/app";
const About: FC = () => {
  const { formatMessage } = useLocale();
  const [update, setUpdate] = useState<boolean>(false);
  const [version, setVersion] = useState<string>("已经是最新版本");
  const checkVersion = () => {
    checkUpdate().then((version) => {
      setUpdate(version ? true : false);
      if (version && version !== null) {
        setVersion(`v${version}`);
      }
    });
  };
  useEffect(() => {
    checkVersion();
  }, []);
  const appVersion = async () => {
    return await getVersion();
  };
  return (
    <>
      <CustomBox className="about">
        <div className="about-wave"></div>
        <div className="about-wave"></div>
        <div className="about-wave"></div>
        <div
          style={{
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            userSelect: "none",
          }}
        >
          <img
            data-tauri-drag-region
            style={{ maxHeight: 120, maxWidth: 120, userSelect: "none" }}
            src="/app-icon.png"
            alt=""
          />
          <div className="about-title">Kubernetes Manager</div>
          <div>
            开源地址：
            <a href="https://github.com/lbemi/ksm" target="_blank">
              https://github.com/lbemi/ksm
            </a>
          </div>
          <div className="mt-3">
            <Badge dot={update} color="blue">
              Verson: v{appVersion()}
            </Badge>
          </div>

          <div className="mt-3 flex items-center">
            <div>{version}</div>
            {update && (
              <Button
                type="link"
                onClick={() => {
                  installUpdate();
                }}
              >
                {formatMessage({ id: "button.update_now" })}
              </Button>
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "#9599a3",
              userSelect: "none",
              marginTop: 80,
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              基于{" "}
              <img
                style={{ height: 20, margin: "0 10px" }}
                src="/tauri.svg"
                alt=""
              />{" "}
              框架
            </div>
          </div>
        </div>
      </CustomBox>
    </>
  );
};

export default About;
