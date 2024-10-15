import { FC } from "react";
import MyIcon from "@/components/MyIcon";

const Deployment: FC = () => {
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column" }}>
        Deployment+ icon-yunxingzhong
        <MyIcon type="icon-chasis" size={30} color="red" />
        <MyIcon type="icon-container" size={30} color="#c62828" />
        Deployment+ icon-yunxingzhong
        <MyIcon type="icon-icon--gengxin" />
        <MyIcon type="icon-POD" size={50} spin />
        <MyIcon type="icon-ecs-running" color="green" size={30} />
      </div>
    </>
  );
};

export default Deployment;
