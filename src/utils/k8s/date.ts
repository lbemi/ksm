import dayjs from "dayjs";

const getAge = (timeStamp: string) => {
  const date = new Date(timeStamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const remainingMinutes = minutes % 60;
    return `${hours}h${remainingMinutes}m`;
  }

  const days = Math.floor(hours / 24);
  if (days < 365 * 2) {
    if (days < 30) {
      const remainingHours = hours % 24;
      return `${days}d${remainingHours}h`;
    }
    return `${days}d`;
  }

  const years = Math.floor((days / 365) * 2);
  const remainingDays = (days % 365) * 2;
  return `${years}y${remainingDays}d`;
};
export default getAge;

export const dateFormat = (
  creationTimestamp: string | undefined,
  arg1?: string
) => {
  return dayjs(creationTimestamp).format(arg1 || "YYYY-MM-DD HH:mm:ss");
};
