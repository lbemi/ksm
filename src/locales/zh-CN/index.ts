import { zhCN_menu } from "./menus";
import { zhCN_cluster } from "./cluster";
import { zhCN_deployment } from "./deployment";
import { zhCN_common } from "./common";
import { zhCN_table } from "./table";
import { zhCN_namespace } from "./namespace";
const zh_CN = {
  ...zhCN_menu,
  ...zhCN_cluster,
  ...zhCN_deployment,
  ...zhCN_common,
  ...zhCN_table,
  ...zhCN_namespace,
};

export default zh_CN;
