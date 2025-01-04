import {IContainer} from "kubernetes-models/v1";
import {Tag, Tooltip, Typography} from "antd";

export const getImages = (containers: Array<IContainer>) => {
    if (!containers.length) return null;

    const firstImage = containers[0];
    const remainingImages = containers.slice(1);

    return (
        <div
            className="container-images"
            style={{display: "flex", justifyContent: "center"}}
        >
            <Tooltip
                placement="topLeft"
                // color={token.colorBgContainer}
                title={
                    <div className="image-tooltip">
                        <Tag bordered={false} className="copyable-tag">
                            <Typography.Text copyable={{text: firstImage.image}}>
                                {firstImage.image}
                            </Typography.Text>
                        </Tag>
                        {remainingImages.length > 0 &&
                            remainingImages.map((container, index) => (
                                <Tag bordered={false} key={index} className="copyable-tag">
                                    <Typography.Text copyable={{text: container.image}}>
                                        {container.image}
                                    </Typography.Text>
                                </Tag>
                            ))}
                    </div>
                }
            >
                <Tag bordered={false}>
                    <Typography.Text>{firstImage.image}</Typography.Text>
                    {remainingImages.length > 0 && ` +${remainingImages.length}`}
                </Tag>
            </Tooltip>
        </div>
    );
};