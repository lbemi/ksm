import { FC, useEffect, useState } from "react";
import { Badge, Button, Flex, Image, Tag } from "antd";
import { checkUpdate, installUpdate } from "@/utils/version";
import { useLocale } from "@/locales";
import { getVersion } from "@tauri-apps/api/app";
import MyIcon from "@/components/MyIcon";
import DescribeCard from "@/components/DescribeCard";
const About: FC = () => {
  const { formatMessage } = useLocale();
  const [update, setUpdate] = useState<boolean>(false);
  const [version, setVersion] = useState<string>("已经是最新版本");
  const [loading, setLoading] = useState<boolean>(false);
  const [appVersion, setAppVersion] = useState<string>("");

  useEffect(() => {
    getVersion().then((v) => setAppVersion(v));
    checkVersion();
  }, []);

  const checkVersion = () => {
    setLoading(true);
    checkUpdate()
      .then((version) => {
        setUpdate(version ? true : false);
        if (version && version !== null) {
          setVersion(`v${version}`);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };
  const items = [
    {
      title: "GitHub",
      description: formatMessage({ id: "setting.about_github_desc" }),
      url: "https://github.com/lbemi/ksm",
      icon: "icon-github",
      buttonText: formatMessage({ id: "button.open" }),
    },
    {
      title: formatMessage({ id: "setting.about_update_log" }),
      description: formatMessage({ id: "setting.about_update_log_desc" }),
      url: "https://github.com/lbemi/ksm/releases",
      icon: "icon-gengxinrizhi",
      buttonText: formatMessage({ id: "setting.about_view" }),
    },
    {
      title: formatMessage({ id: "setting.about_bug" }),
      description: formatMessage({ id: "setting.about_bug_desc" }),
      url: "https://github.com/lbemi/ksm/issues",
      icon: "icon-bug",
      buttonText: formatMessage({ id: "setting.about_feedback" }),
    },
    {
      title: formatMessage({ id: "setting.about_talk" }),
      description: formatMessage({ id: "setting.about_talk_desc" }),
      url: "https://github.com/lbemi/ksm/discussions",
      icon: "icon-jiaoliu",
      buttonText: formatMessage({ id: "setting.about_discussions" }),
    },
  ];
  return (
    <>
      <div className="mt-2 h-lvh">
        <div className="text-xl font-bold">
          <MyIcon type="icon-a-shuxing1moren-3" size={18} />
          {"  "}
          {formatMessage({ id: "setting.about" })}
        </div>
        <div className="mt-10 mb-10 mr-5 flex items-center justify-between ">
          <div className="flex items-center">
            <div>
              <Image src="/app-icon.png" alt="" width={80} />
            </div>
            <div className="ml-5">
              <div className="text-lg font-bold font-sans">
                Kubernetes Manager
              </div>
              <div className="text-sm text-gray-500 mb-2">
                {formatMessage({ id: "setting.about_desc" })}
              </div>
              <div>
                <Flex gap={20}>
                  <Tag color="green">
                    <Badge dot={update} color="red">
                      v{appVersion}{" "}
                    </Badge>
                    {"  "}
                    {version === "已经是最新版本" ? `${version}` : ""}
                  </Tag>
                  {update && (
                    <div>
                      <MyIcon type="icon-shengji1" color="red" size={13} />

                      <Tag color="green">
                        <Badge dot={false}>{version}</Badge>
                      </Tag>
                    </div>
                  )}
                </Flex>
              </div>
            </div>
          </div>
          <div>
            <Button
              type="primary"
              loading={loading}
              onClick={() => {
                if (update) {
                  installUpdate();
                } else {
                  checkVersion();
                }
              }}
            >
              {update
                ? formatMessage({ id: "button.update_now" })
                : formatMessage({ id: "button.check_update" })}
            </Button>
          </div>
        </div>
        <Flex gap={10} vertical>
          {items.map((item) => (
            <DescribeCard key={item.title} {...item} />
          ))}
        </Flex>
      </div>
    </>
  );
};

export default About;
