type Props = {
  // icon 的类型(必选)
  type: string;
  // icon 的自定义样式(可选)
  className?: string;
  // icon 的大小(可选)
  size?: number;
  // icon 的颜色(可选)
  color?: string;
  // 点击事件(可选)
  onClick?: () => void;
  //旋转
  spin?: boolean;
};

const MyIcon = ({
  type,
  className,
  size = 16,
  color,
  spin,
  onClick,
}: Props) => {
  const spinAnimation = spin ? "spin 1s linear infinite" : "none";

  return (
    // <svg
    //   className={`icon ${className || ""}`}
    //   aria-hidden="true"
    //   onClick={onClick}
    //   style={{
    //     width: `${size}px`,
    //     height: `${size}px`,
    //     fill: color,
    //     animation: spinAnimation,
    //     transformOrigin: "50% 50%",
    //   }}
    // >
    //   <use xlinkHref={`#${type}`}></use>
    // </svg>
    <svg
      className={`iconfont ${type} ${className || ""}`}
      aria-hidden="true"
      onClick={onClick}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        fill: color,
        animation: spinAnimation,
        transformOrigin: "50% 50%",
      }}
    >
      <use xlinkHref={`#${type}`}></use>
    </svg>
  );
};

// Add a CSS keyframe animation for the spin effect
const style = document.createElement("style");
style.textContent = `
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;
document.head.appendChild(style);
export default MyIcon;
