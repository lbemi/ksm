import React, { FC } from "react";
import "./index.scss";

const IconButton: FC<{
  icon: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}> = ({ icon, onClick, danger = false }) => {
  return (
    <div
      className={`button-icon-container ${danger ? "danger" : ""}`}
      onClick={() => {
        onClick?.();
      }}
    >
      {icon}
    </div>
  );
};

export default IconButton;
