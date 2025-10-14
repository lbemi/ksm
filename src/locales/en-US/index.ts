import { enUS_menu } from "./menus";
import { enUS_cluster } from "./cluster";
import { enUS_deployment } from "./deployment";
import { enUS_common } from "./common";
import { enUS_table } from "./table";
import { enUS_namespace } from "./namespace";

const en_US = {
  ...enUS_menu,
  ...enUS_cluster,
  ...enUS_deployment,
  ...enUS_common,
  ...enUS_table,
  ...enUS_namespace,
};

export default en_US;
