import { Button, Card } from "antd";
import { FC } from "react";
import MyIcon from "../MyIcon";
import { useLocale } from "@/locales";
import { open } from "@tauri-apps/plugin-shell";
const DescribeCard: FC<{
  title: string;
  description: string;
  url: string;
  buttonText?: string;
  icon?: string;
  height?: number;
}> = ({ title, description, url, buttonText, icon, height = 80 }) => {
  const { formatMessage } = useLocale();
  const openUrl = () => {
    open(url);
  };
  return (
    <div className="mr-5">
      <Card style={{ height }} bodyStyle={{ padding: "10px 20px" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-2">
              {icon && <MyIcon type={icon} size={18} />}
              <span className="ml-2 font-bold text-lg">{title}</span>
            </div>
            <span className="text-xs text-gray-500">{description}</span>
          </div>
          <div>
            <Button onClick={openUrl}>
              {buttonText || formatMessage({ id: "button.open" })}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DescribeCard;
