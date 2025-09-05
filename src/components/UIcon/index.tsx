type Props = {
  // icon 的类型(必选)
  type: string;
  // icon 的自定义样式(可选)
  className?: string;
  size?: number;
  color?: string;
  // 点击事件(可选)
  onClick?: () => void;
};

const UIcon = ({ type, className, onClick, size = 16, color }: Props) => {
  return (
    <span
      className={`iconfont ${type} ${className || ""}`}
      onClick={onClick}
      style={{ fontSize: size, color }}
    />
  );
};

export default UIcon;
