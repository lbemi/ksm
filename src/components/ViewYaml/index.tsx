import { Button, Modal, Tag } from "antd";
import { useLocale } from "@/locales";
import { FC } from "react";
import CustomEdit from "../CustomEdit";
import jsYaml from "js-yaml";

interface ViewYamlProps {
  data: any;
  name: string;
  visible: boolean;
  handleCancel: () => void;
}
const ViewYaml: FC<ViewYamlProps> = ({ data, name, visible, handleCancel }) => {
  const { formatMessage } = useLocale();
  return (
    <div>
      <Modal
        title={
          <span>
            <Tag color="magenta" bordered={false}>
              {formatMessage({ id: "menu.read" })} <span> {name}</span>
            </Tag>
          </span>
        }
        centered
        onCancel={handleCancel}
        open={visible}
        width={"70%"}
        className="p-0"
        footer={[
          <Button size="small" onClick={handleCancel}>
            {formatMessage({ id: "button.cancel" })}
          </Button>,
        ]}
      >
        <CustomEdit height={"80vh"} original={jsYaml.dump(data)} readOnly />
      </Modal>
    </div>
  );
};

export default ViewYaml;
