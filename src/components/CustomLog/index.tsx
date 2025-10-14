import { useParams, useSearchParams } from "react-router-dom";
import CustomEdit from "../CustomEdit";
import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import WebSocket from "@tauri-apps/plugin-websocket";
import {
  Button,
  Checkbox,
  message,
  Select,
  theme,
  Tooltip,
  Typography,
} from "antd";
import { AppsV1Url, kubeApi } from "@/api/cluster";
import { Pod } from "kubernetes-models/v1";
import { useLocale } from "@/locales";

interface SelectOptions {
  value: string;
  label: string;
}
const Log = ({
  name,
  namespace,
  height,
}: {
  name?: string;
  namespace?: string;
  height?: string | number;
}) => {
  const panelHeight = document.getElementsByClassName("ant-splitter-panel")[1];
  const [tabHeight, setTabHeight] = useState<number | string>(
    panelHeight?.clientHeight - 32 || 300
  );

  if (!height) {
    const resizeObserver = new ResizeObserver(() => {
      let height = window.getComputedStyle(panelHeight).height;
      setTabHeight(Number(height.replace("px", "")) - 32);
    });
    useEffect(() => {
      resizeObserver.observe(panelHeight);
      return () => {
        resizeObserver.unobserve(panelHeight);
      };
    }, []);
  }

  const params = useParams();
  if (!name || !namespace) {
    name = params.name;
    namespace = params.namespace;
  }
  const [logs, setLogs] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tail, setTail] = useState<number>(100);
  const [follow, setFollow] = useState<boolean>(true);
  const [timestamp, setTimestamp] = useState<boolean>(false);
  const [container, setContainer] = useState<string>("");
  const [containers, setContainers] = useState<Array<SelectOptions>>([]);
  const [messageApi, contextHolderMessage] = message.useMessage();
  const [pauseBt, setPauseBt] = useState<boolean>(false);

  const logRef = useRef<string>("");

  const { formatMessage } = useLocale();
  const wsRef = useRef<WebSocket | null>(null);
  const pause = useRef<boolean>(false);
  const clean = useRef<boolean>(false);

  const [queryParams] = useSearchParams();
  const initContainerName = queryParams.get("container");

  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const getPodContainerName = async (pod: Pod) => {
    let containerName = Array<SelectOptions>();
    pod.spec?.containers.forEach((container) => {
      containerName.push({ value: container.name, label: container.name });
    });
    pod.spec?.initContainers?.forEach((container) => {
      containerName.push({ value: container.name, label: container.name });
    });
    setContainers(containerName);

    if (initContainerName && initContainerName !== "undefined") {
      setContainer(initContainerName);
    } else if (containerName.length > 0) {
      setContainer(containerName[0].value);
    }
  };
  const getPod = async () => {
    await kubeApi
      .get_one<Pod>(AppsV1Url, "pods", namespace, name)
      .then((res) => {
        getPodContainerName(res);
      });
  };

  const cleanupWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }
    setIsConnected(false);
  };

  const pauseLog = async () => {
    pause.current = true;
    setPauseBt(true);
  };

  const lineNumbers = useRef<number>(0);
  const startLogStream = async () => {
    if (pause.current) {
      pause.current = false;
      setPauseBt(false);
      return;
    }
    if (!name || !namespace) {
      messageApi.error(formatMessage({ id: "message.connecte_failed" }));
      return;
    }
    try {
      setIsLoading(true);
      cleanupWebSocket();

      let text = "";
      let clientId: string | undefined;
      const ws = await WebSocket.connect("ws://localhost:38012");
      wsRef.current = ws;
      const waitForClientId = new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          setIsLoading(false);
          reject(new Error(formatMessage({ id: "message.connecte_failed" })));
        }, 5000);

        ws.addListener((msg) => {
          if (!clientId || clientId === "") {
            clientId = msg.data?.toString() || "";
            clearTimeout(timeout);
            resolve(clientId);
            return;
          }

          if (msg.type === "Ping") {
            ws.send({ type: "Pong", data: [1] });
            return;
          }

          if (msg.type === "Text") {
            if (clean.current) {
              text = "";
              clean.current = false;
            }
            lineNumbers.current++;
            if (lineNumbers.current > 3000) {
              lineNumbers.current = 0;
              text = "";
            }
            text = text + msg.data?.toString() + "\n";
            if (!pause.current) {
              // setLogs(text);
              logRef.current = text;
            }
          }
        });
      });

      try {
        const receivedClientId = await waitForClientId;
        if (receivedClientId && receivedClientId !== "") {
          setIsConnected(true);
          invoke("log_stream", {
            podLogStream: {
              namespace: namespace,
              container: container || "",
              tail: tail,
              follow: follow,
              timestamps: timestamp,
              pod: name,
            },
            clientId: clientId,
          });
          setIsLoading(false);
          messageApi.success(
            formatMessage({ id: "message.logs_stream_started" })
          );
        } else {
          messageApi.error(formatMessage({ id: "message.connecte_failed" }));
          setIsLoading(false);
        }
      } catch (idError) {
        messageApi.error(formatMessage({ id: "message.connecte_failed" }));
        setIsLoading(false);
        cleanupWebSocket();
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      messageApi.error(formatMessage({ id: "message.connecte_failed" }));
      setIsLoading(false);
      cleanupWebSocket();
    }
  };

  useEffect(() => {
    getPod();
    const interval = setInterval(() => {
      setLogs(logRef.current);
    }, 1000);
    return () => {
      clearInterval(interval);
      cleanupWebSocket();
    };
  }, [params.name, params.namespace]);

  window.addEventListener("unload", () => {
    cleanupWebSocket();
  });
  const handleReconnect = () => {
    startLogStream();
  };

  const handleClearLogs = () => {
    clean.current = true;
    logRef.current = "";
    lineNumbers.current = 0;
    setLogs("");
  };

  const handleDownloadLogs = () => {
    const fileName = `${name}_log.txt`;
    const blob = new Blob([logs], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    messageApi.success(
      formatMessage({ id: "message.download_logs_success" }) +
        ` ${fileName} (Saved to your browser's default download folder)`
    );
  };

  return (
    <div
      style={{
        overflow: "hidden",
        background: colorBgContainer,
        width: "100%",
        minWidth: "1100px",
        height: height ? height : tabHeight,
      }}
    >
      {contextHolderMessage}
      <div
        style={{
          padding: "8px 15px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <span
            style={{
              color: isConnected ? "#52c41a" : "#ff4d4f",
              fontSize: "12px",
            }}
          >
            {pauseBt && "⏸️ " + formatMessage({ id: "button.pause" })}
            {!pauseBt &&
              "● " +
                (isConnected
                  ? formatMessage({ id: "message.connected" })
                  : formatMessage({ id: "message.disconnected" }))}
          </span>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Typography.Text strong>
            {formatMessage({ id: "button.containers" })} :
          </Typography.Text>
          <Select
            style={{ width: 150 }}
            size="small"
            options={containers}
            value={container}
            onChange={(value) => {
              setContainer(value);
            }}
          />
          <Select
            style={{ width: 80 }}
            defaultValue={100}
            size="small"
            options={[
              { value: 100, label: "100" },
              { value: 500, label: "500" },
              { value: 1000, label: "1000" },
            ]}
            onChange={(value) => {
              setTail(value);
            }}
          />
          <Checkbox
            defaultChecked={true}
            onChange={(e) => setFollow(e.target.checked)}
          >
            {formatMessage({ id: "button.follow" })}
          </Checkbox>
          <Checkbox onChange={(e) => setTimestamp(e.target.checked)}>
            {formatMessage({ id: "button.time_stamp" })}
          </Checkbox>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <Button onClick={startLogStream} disabled={isLoading} size="small">
            {isLoading
              ? formatMessage({ id: "message.connecting" })
              : formatMessage({ id: "button.start" })}
          </Button>
          <Button onClick={pauseLog} disabled={pauseBt} size="small">
            {formatMessage({ id: "button.pause" })}
          </Button>
          <Button onClick={handleReconnect} size="small">
            {formatMessage({ id: "button.reconnect" })}
          </Button>
          <Button onClick={handleClearLogs} size="small">
            {formatMessage({ id: "button.clear" })}
          </Button>
          <Tooltip
            title={formatMessage({
              id: "message.download_logs_tooltip",
            })}
          >
            <Button onClick={handleDownloadLogs} size="small">
              {formatMessage({ id: "button.download" })}
            </Button>
          </Tooltip>
        </div>
      </div>
      <CustomEdit
        original={logs || formatMessage({ id: "button.waiting_logs" })}
        readOnly={true}
        language="json"
        wordWrap
        scrollEnd
      />
    </div>
  );
};

export default Log;
