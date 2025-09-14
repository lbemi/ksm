import { IPodSpec } from "kubernetes-models/v1";
import { Tag, Tooltip, Typography } from "antd";

export const getImages = (deployemnt_spec?: IPodSpec) => {
  if (!deployemnt_spec) return null;
  const containers = deployemnt_spec.containers || [];
  if (containers.length === 0) return null;
  const firstImage = containers[0].image;
  const remainingImages = containers.slice(1);
  const initContainers = deployemnt_spec.initContainers || [];

  return (
    <div>
      <Tooltip
        placement="topLeft"
        title={
          remainingImages && (
            <div>
              {remainingImages.length > 0 &&
                remainingImages.map((container, index) => (
                  <div key={`remaining-${index}`}>{container.image}</div>
                ))}
              {initContainers.length > 0 &&
                initContainers.map((container, index) => (
                  <div key={`init-${index}`}>
                    <Tag color="cyan">Init</Tag>
                    {container.image}
                  </div>
                ))}
            </div>
          )
        }
      >
        <Typography.Text copyable={{ text: firstImage }}>
          {firstImage}
        </Typography.Text>
      </Tooltip>
    </div>
  );
};

export const listImages = (deployemnt_spec?: IPodSpec) => {
  if (!deployemnt_spec) return null;
  if (!deployemnt_spec.containers.length) return null;
  return (
    <div className="flex flex-col gap-1">
      {deployemnt_spec.containers.map((container, index) => (
        <Typography.Text
          key={`container-${index}`}
          copyable={{ text: container.image }}
        >
          {container.image}
        </Typography.Text>
      ))}

      {deployemnt_spec.initContainers?.map((container, index) => (
        <Typography.Text
          key={`init-container-${index}`}
          copyable={{ text: container.image }}
        >
          <Tag color="cyan">Init</Tag>
          {container.image}
        </Typography.Text>
      ))}
    </div>
  );
};

export const formatAnnotations = (annotations: any) => {
  if (!annotations) return <>-</>;
  return Object.entries(annotations).map(([key, value]) => (
    <div key={key}>
      <Tag color="blue">{key}</Tag>
      {": "}
      {`${value}`}
    </div>
  ));
};
