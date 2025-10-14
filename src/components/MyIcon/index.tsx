type Props = {
  type: string;
  className?: string;
  size?: number;
  color?: string;
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
    <span
      className={`iconfont ${type} ${className || ""}`}
      aria-hidden="true"
      onClick={onClick}
      style={{
        color,
        fontSize: size,
        animation: spinAnimation,
        transformOrigin: "50% 50%",
      }}
    >
      <use xlinkHref={`#${type}`}></use>
    </span>
  );
};

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
