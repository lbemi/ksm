import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { invoke } from "@tauri-apps/api/core";
import WebSocket from "@tauri-apps/plugin-websocket";
import { Button, message, Select, Typography, Space, Spin, theme } from "antd";
import { AppsV1Url, kubeApi } from "@/api/cluster";
import { Pod } from "kubernetes-models/v1";
import { useLocale } from "@/locales";
import "@xterm/xterm/css/xterm.css";

interface SelectOptions {
  value: string;
  label: string;
}

interface TerminalProps {
  podName?: string;
  namespace?: string;
  container?: string;
  height?: string | number;
}

const TerminalWindow = ({
  podName,
  namespace,
  container,
  height,
}: TerminalProps) => {
  const params = useParams();
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const clientIdRef = useRef<string>("");

  const [queryParams] = useSearchParams();
  const initContainerName = queryParams.get("container");
  // 使用 props 或 URL 参数
  const finalPodName = podName || params.name;
  const finalNamespace = namespace || params.namespace;

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedContainer, setSelectedContainer] = useState<string>(
    container || ""
  );
  const [containers, setContainers] = useState<Array<SelectOptions>>([]);
  const [messageApi, contextHolderMessage] = message.useMessage();

  const { formatMessage } = useLocale();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const panelHeight = document.getElementsByClassName("ant-splitter-panel")[1];
  const [tabHeight, setTabHeight] = useState<number | string>(
    panelHeight?.clientHeight - 32 || 300
  );
  // 处理窗口大小变化
  const handleResize = () => {
    setTimeout(() => {
      if (fitAddonRef.current && terminalInstanceRef.current) {
        fitAddonRef.current.fit();
      }
    }, 200);
  };
  if (!height) {
    const resizeObserver = new ResizeObserver(() => {
      let height = window.getComputedStyle(panelHeight).height;
      setTabHeight(Number(height.replace("px", "")) - 32);
      handleResize();
    });
    useEffect(() => {
      resizeObserver.observe(panelHeight);
      return () => {
        resizeObserver.unobserve(panelHeight);
      };
    }, []);
  }
  // 获取 Pod 容器信息
  const getPodContainerName = async (pod: Pod) => {
    const containerOptions: Array<SelectOptions> = [];
    pod.spec?.containers.forEach((container) => {
      containerOptions.push({ value: container.name, label: container.name });
    });
    pod.spec?.initContainers?.forEach((container) => {
      containerOptions.push({
        value: container.name,
        label: `${container.name} (init)`,
      });
    });
    setContainers(containerOptions);

    if (initContainerName && initContainerName !== "undefined") {
      setSelectedContainer(initContainerName);
    } else if (containerOptions.length > 0 && !selectedContainer) {
      setSelectedContainer(containerOptions[0].value);
    }
  };

  const getPod = async () => {
    if (!finalPodName || !finalNamespace) return;

    try {
      const pod = await kubeApi.get_one<Pod>(
        AppsV1Url,
        "pods",
        finalNamespace,
        finalPodName
      );
      getPodContainerName(pod);
    } catch (error) {
      messageApi.error("Failed to get pod information");
    }
  };

  // 初始化终端
  const initTerminal = () => {
    if (terminalInstanceRef.current) {
      return;
    }

    if (!terminalRef.current) {
      return;
    }

    const term = new Terminal({
      theme: {
        background: "#1e1e1e",
        foreground: "#d4d4d4",
        cursor: "help",
      },
      fontSize: 14,
      fontFamily: "Consolas, Lucida Console,monospace,JetBrainsMono, monaco",
      cursorBlink: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(terminalRef.current);

    setTimeout(() => {
      if (fitAddon && terminalInstanceRef.current) {
        fitAddon.fit();
      }
    }, 50);
    term.write(
      "\x1b[32mWelcome to the terminal! \r\n\r\nPress Ctrl+D to disconnect\r\n\r\n"
    );
    term.write("\x1b[0m");
    terminalInstanceRef.current = term;
    fitAddonRef.current = fitAddon;

    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.focus();
      }
    }, 100);

    // 处理终端输入
    term.onData((data) => {
      // 检查是否是Ctrl+D (ASCII码4)
      if (data === "\u0004") {
        disconnectTerminal();
        return;
      }
      // 检查是否是Ctrl+l
      if (data === "\u000c") {
        clearTerminal();
        return;
      }
      if (wsRef.current && clientIdRef.current) {
        wsRef.current.send(data);
      }
    });

    window.addEventListener("resize", handleResize);
  };

  // 清理 WebSocket 连接
  const cleanupWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }
    setIsConnected(false);
    clientIdRef.current = "";
  };

  // 连接终端
  const connectTerminal = async () => {
    if (!finalPodName || !finalNamespace || !selectedContainer) {
      messageApi.error(formatMessage({ id: "terminal.missing_parameters" }));
      return;
    }

    try {
      setIsLoading(true);
      cleanupWebSocket();

      // 清空终端
      if (terminalInstanceRef.current) {
        terminalInstanceRef.current.clear();
        terminalInstanceRef.current.write("Connecting to pod terminal...\r\n");
      }

      // 建立 WebSocket 连接
      const ws = await WebSocket.connect("ws://localhost:38012");
      wsRef.current = ws;

      const waitForClientId = new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          setIsLoading(false);
          reject(new Error("Connection timeout"));
        }, 10000);

        ws.addListener((msg) => {
          if (!clientIdRef.current || clientIdRef.current === "") {
            const receivedId = msg.data?.toString() || "";
            if (receivedId && receivedId.length > 10) {
              clientIdRef.current = receivedId;
              clearTimeout(timeout);
              resolve(receivedId);
              return;
            }
          }

          if (msg.type === "Ping") {
            ws.send({ type: "Pong", data: [1] });
            return;
          }

          if (msg.type === "Text" && terminalInstanceRef.current) {
            const data = msg.data?.toString() || "";
            if (data.startsWith("OCI runtime exec")) {
              terminalInstanceRef.current.write(data);
              reject(new Error("Connection failed"));
              setIsConnected(false);
              return;
            }
            terminalInstanceRef.current.write(data);
          }

          if (msg.type === "Binary" && terminalInstanceRef.current) {
            const data = new TextDecoder().decode(
              msg.data as unknown as ArrayBuffer
            );

            terminalInstanceRef.current.write(data);
          }
        });
      });

      try {
        const receivedClientId = await waitForClientId;
        if (receivedClientId) {
          setIsConnected(true);

          if (terminalInstanceRef.current) {
            terminalInstanceRef.current.clear();
          }

          try {
            invoke("pod_terminal", {
              podTerminal: {
                namespace: finalNamespace,
                name: finalPodName,
                container: selectedContainer,
                command: ["/bin/sh"], // 使用 sh 作为默认shell
              },
              clientId: receivedClientId,
            });

            // 连接成功后重新调整终端大小
            setTimeout(() => {
              if (fitAddonRef.current && terminalInstanceRef.current) {
                fitAddonRef.current.fit();
              }
            }, 500);

            setIsLoading(false);
            messageApi.success(
              formatMessage({ id: "terminal.connect_success" })
            );
          } catch (error) {
            throw error;
          } finally {
            setIsLoading(false);
          }
        } else {
          throw new Error(formatMessage({ id: "terminal.connect_failed" }));
        }
      } catch (error) {
        messageApi.error(formatMessage({ id: "terminal.connect_failed" }));
        cleanupWebSocket();
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      messageApi.error(formatMessage({ id: "terminal.connect_failed" }));
      cleanupWebSocket();
      if (terminalInstanceRef.current) {
        terminalInstanceRef.current.write(
          "\r\nConnection failed. Please try again.\r\n"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  window.addEventListener("unload", () => {
    cleanupWebSocket();
  });

  const disconnectTerminal = () => {
    cleanupWebSocket();
    if (terminalInstanceRef.current) {
      terminalInstanceRef.current.write("\r\nTerminal disconnected.\r\n");
    }
    messageApi.info("Terminal disconnected");
  };

  const clearTerminal = () => {
    if (terminalInstanceRef.current) {
      terminalInstanceRef.current.clear();
    }
  };

  useEffect(() => {
    getPod();

    // 延迟初始化终端，确保DOM已经渲染
    const timer = setTimeout(() => {
      initTerminal();
    }, 100);

    return () => {
      clearTimeout(timer);
      cleanupWebSocket();
      if (terminalInstanceRef.current) {
        terminalInstanceRef.current.dispose();
        terminalInstanceRef.current = null;
      }
    };
  }, [finalPodName, finalNamespace]);

  // 监听容器变化
  useEffect(() => {
    if (isConnected && selectedContainer) {
      connectTerminal();
    }
  }, [selectedContainer]);

  return (
    <div
      style={{
        height: height ? height : tabHeight,
        display: "flex",
        flexDirection: "column",
        background: colorBgContainer,
        minWidth: "800px",
      }}
    >
      {contextHolderMessage}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "6px 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              color: isConnected ? "#52c41a" : "#ff4d4f",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            ●{" "}
            {isConnected
              ? formatMessage({ id: "terminal.connected" })
              : formatMessage({ id: "terminal.disconnected" })}
          </span>

          <Typography.Text strong>Namespace:</Typography.Text>
          <Typography.Text code>{finalNamespace}</Typography.Text>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Typography.Text strong>Container:</Typography.Text>
          <Select
            style={{ width: 150 }}
            size="small"
            options={containers}
            value={selectedContainer}
            onChange={(value) => setSelectedContainer(value)}
            disabled={isLoading}
          />

          <Space>
            <Button
              type="primary"
              size="small"
              onClick={connectTerminal}
              loading={isLoading}
              disabled={isConnected}
            >
              {isLoading
                ? formatMessage({ id: "terminal.connecting" })
                : formatMessage({ id: "terminal.connect" })}
            </Button>
            <Button
              size="small"
              onClick={disconnectTerminal}
              disabled={!isConnected}
            >
              {formatMessage({ id: "terminal.disconnect" })}
            </Button>
            <Button size="small" onClick={clearTerminal}>
              Clear
            </Button>
          </Space>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          position: "relative",
          background: "#1e1e1e",
          overflow: "hidden",
        }}
      >
        {isLoading && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 10,
            }}
          >
            <Spin size="large" />
          </div>
        )}
        <div
          ref={terminalRef}
          id="terminal-container"
          tabIndex={0}
          style={{
            width: "100%",
            height: "100%",
            paddingLeft: "10px",
            paddingTop: "10px",
            outline: "none",
          }}
        />
      </div>
      {/* 底部空白 */}
      <div style={{ height: "10px", backgroundColor: "#1e1e1e" }}></div>
    </div>
  );
};

export default TerminalWindow;
