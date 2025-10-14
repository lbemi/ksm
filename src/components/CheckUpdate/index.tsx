import { check } from "@tauri-apps/plugin-updater";
import { Button, notification, Space, Tag } from "antd";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { FC, useEffect } from "react";
import { useLocale } from "@/locales";
import { setTheme } from "@/store/modules/theme";
import { useAppDispatch } from "@/store/hook";
import { installUpdate } from "@/utils/version";

const CheckUpdate: FC = () => {
  const dispatch = useAppDispatch();
  const { checkUpdate: update } = useSelector(
    (state: RootState) => state.theme
  );
  const { formatMessage } = useLocale();
  const [api, contextHolder] = notification.useNotification();

  const key = `open${Date.now()}`;
  const close = () => {
    api.destroy(key);
    dispatch(setTheme({ checkUpdate: false }));
  };
  const confirm = () => {
    api.destroy(key);
    installUpdate();
  };
  const btn = (
    <Space>
      <Button type="link" size="small" onClick={() => close()}>
        {formatMessage({ id: "button.ignore_update" })}
      </Button>
      <Button type="primary" size="small" onClick={() => confirm()}>
        {formatMessage({ id: "button.update_now" })}
      </Button>
    </Space>
  );

  const checkUpdate = async () => {
    try {
      const updateApi = await check();
      if (updateApi) {
        console.log(
          `found update ${updateApi.version} from ${updateApi.date} with notes ${updateApi.body}`
        );
        api.open({
          message: formatMessage({ id: "common.update_title" }),
          description: <Tag color="blue">{`v${updateApi.version}`}</Tag>,
          showProgress: true,
          actions: [btn],
          key,
          onClose: close,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (update) {
      checkUpdate();
    }
  });

  if (!update) {
    return <>{contextHolder}</>;
  }

  return <>{contextHolder}</>;
};

export default CheckUpdate;
