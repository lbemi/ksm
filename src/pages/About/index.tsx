import { FC } from "react";
import CustomBox from "@/components/CustomBox";
import WindowOperation from "@/components/WindowOperation";
import "./index.scss";
import { theme } from "antd";
const About: FC = () => {
  return (
    <>
      <CustomBox className="about">
        <div style={{ position: "absolute", right: 5, top: 0 }}>
          <WindowOperation
            hide={false}
            height={40}
            style={{ right: 10 }}
            isMaximize={false}
          />
        </div>
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
            src="/logo.png"
            alt=""
          />
          <div className="about-title">Kubernetes Manager</div>
          <div>
            开源地址：
            <a href="https://github.com/lbemi/ksm" target="_blank">
              https://github.com/lbemi/ksm
            </a>
          </div>
          <div style={{ color: "#9599a3", marginTop: 20 }}>Lbemi</div>
          <div style={{ color: "#9599a3", marginTop: 10 }}>QQ群：xxxxxx</div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "#9599a3",
              userSelect: "none",
              marginTop: 80,
            }}
          >
            基于{" "}
            <img
              style={{ height: 20, margin: "0 10px" }}
              src="/tauri.svg"
              alt=""
            />{" "}
            框架
          </div>
        </div>
      </CustomBox>
    </>
  );
};

export default About;
