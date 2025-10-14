import { Button, Card, Col, Flex, Row, Tag, Typography } from "antd";
import { IContainer, IContainerStatus, Pod } from "kubernetes-models/v1";
import { FC } from "react";
import { useLocale } from "@/locales";
import MyIcon from "../MyIcon";
import { dateFormat } from "@/utils/k8s/date";
import { createLogWindow, createTerminalWindow } from "@/api/pod";

const { Text } = Typography;
interface ContainerProps {
  pod: Pod;
  onLog?: (podName: string, namespace: string, contianerName: string) => void;
  onTerminal?: (
    podName: string,
    namespace: string,
    contianerName: string
  ) => void;
}

const Container: FC<ContainerProps> = ({ pod }) => {
  const { formatMessage } = useLocale();
  const { spec, status } = pod;
  const { containerStatuses, initContainerStatuses } = status || {};

  const getContainerStatus = (containerName: string) => {
    return containerStatuses?.find((c) => c.name === containerName);
  };
  const getInitContainerStatus = (containerName: string) => {
    return initContainerStatuses?.find((c) => c.name === containerName);
  };
  const CardContainer: FC<{
    container: IContainer;
    containerStatus: IContainerStatus | undefined;
    init?: boolean;
  }> = ({ container, containerStatus, init = false }) => {
    return (
      <Card
        hoverable
        size="small"
        title={
          <>
            <MyIcon type="icon-docker2" size={12} color="#237804" />{" "}
            {init && <Tag color="cyan">Init</Tag>}
            {container.name}
          </>
        }
        extra={
          <>
            <Button
              type="link"
              size="small"
              onClick={() =>
                createLogWindow(
                  pod.metadata!.name!,
                  pod.metadata!.namespace!,
                  container.name
                )
              }
            >
              {formatMessage({ id: "button.log" })}
            </Button>
            <Button
              type="link"
              size="small"
              onClick={() =>
                createTerminalWindow(
                  pod.metadata!.name!,
                  pod.metadata!.namespace!,
                  container.name
                )
              }
            >
              {formatMessage({ id: "button.terminal" })}
            </Button>
          </>
        }
        style={{ width: 390, height: 350 }}
      >
        <div className="flex flex-col gap-1">
          <Row gutter={16}>
            <Col className="gutter-row">
              <Text>{formatMessage({ id: "table.image" })}</Text> {"  "}
              <MyIcon type="icon-docker3" color="#4eaeea" size={12} />
            </Col>
          </Row>
          <Row gutter={16}>
            <Col className="gutter-row">
              <Text type="secondary" ellipsis={{ tooltip: true }}>
                {container.image}
              </Text>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col className="gutter-row">
              <Text>{formatMessage({ id: "table.status" })}</Text>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col className="gutter-row" span={10}>
              <Text
                type={
                  containerStatus?.state?.running
                    ? "success"
                    : containerStatus?.state?.terminated?.reason === "Completed"
                      ? "warning"
                      : "danger"
                }
              >
                {containerStatus?.state?.running
                  ? "Running"
                  : containerStatus?.state?.waiting?.reason ||
                    containerStatus?.state?.terminated?.reason ||
                    "Unknown"}
              </Text>
            </Col>
            <Col className="gutter-row" span={10}>
              <Text
                type={
                  containerStatus?.started
                    ? "success"
                    : containerStatus?.state?.terminated?.reason === "Completed"
                      ? "warning"
                      : "danger"
                }
              >
                Started
              </Text>
            </Col>
            <Col className="gutter-row" span={4}>
              <Text type={containerStatus?.ready ? "success" : "danger"}>
                Ready
              </Text>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col className="gutter-row" span={10}>
              <Text>{formatMessage({ id: "table.restart_count" })}</Text>
            </Col>
            <Col className="gutter-row" span={10}>
              <Text>{formatMessage({ id: "table.last_restart" })}</Text>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col className="gutter-row" span={10}>
              <Text type="warning">{containerStatus?.restartCount || 0}</Text>
            </Col>
            <Col className="gutter-row" span={14}>
              <Text type="warning">
                {dateFormat(containerStatus?.lastState?.running?.startedAt) ||
                  "-"}
              </Text>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col className="gutter-row" span={24}>
              <Text>{formatMessage({ id: "table.failure_reason" })}</Text>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col className="gutter-row" span={24}>
              <Text type="danger" ellipsis={{ tooltip: true }}>
                {containerStatus?.state?.waiting?.message ||
                  containerStatus?.state?.terminated?.message ||
                  "-"}
              </Text>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col className="gutter-row" span={10}>
              <Text>{formatMessage({ id: "table.cpu_resource" })}</Text>
            </Col>
            <Col className="gutter-row" span={10}>
              <Text>{formatMessage({ id: "table.memory_resource" })}</Text>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col className="gutter-row" span={10}>
              <div>
                <Text type="secondary">
                  {formatMessage({ id: "table.limit" })}
                </Text>
                {" : "}
                <Text type="secondary">
                  {container?.resources?.limits?.cpu || "-"}
                </Text>
              </div>
              <div>
                <Text type="secondary">
                  {formatMessage({ id: "table.request" })}
                </Text>
                {" : "}
                <Text type="secondary">
                  {container?.resources?.requests?.cpu || "-"}
                </Text>
              </div>
            </Col>
            <Col className="gutter-row" span={14}>
              <div>
                <Text type="secondary">
                  {formatMessage({ id: "table.limit" })}
                </Text>
                {" : "}
                <Text type="secondary">
                  {container?.resources?.limits?.memory || "-"}
                </Text>
              </div>
              <div>
                <Text type="secondary">
                  {formatMessage({ id: "table.request" })}
                </Text>
                {" : "}
                <Text type="secondary">
                  {container?.resources?.requests?.memory || "-"}
                </Text>
              </div>
            </Col>
          </Row>
        </div>
      </Card>
    );
  };
  return (
    <>
      <Flex wrap gap="small">
        {spec?.containers?.map((container) => {
          const containerStatus = getContainerStatus(container.name);
          return (
            <CardContainer
              key={container.name}
              container={container}
              containerStatus={containerStatus}
            />
          );
        })}
        {spec?.initContainers?.map((container) => {
          const containerStatus = getInitContainerStatus(container.name);
          return (
            <CardContainer
              key={container.name}
              container={container}
              containerStatus={containerStatus}
              init
            />
          );
        })}
      </Flex>
    </>
  );
};

export default Container;
