export const formatWon = (value) =>
  `${Math.round(Number(value) || 0).toLocaleString("ko-KR")}원`;

export const formatKm = (value) => {
  const distance = Number(value) || 0;
  const digits = distance < 100 && !Number.isInteger(distance) ? 1 : 0;
  return `${distance.toLocaleString("ko-KR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}km`;
};

export const formatDuration = (value, compact = false) => {
  const totalMinutes = Math.max(0, Math.round(Number(value) || 0));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!hours) return compact ? `${minutes}m` : `${minutes}분`;
  if (!minutes) return compact ? `${hours}h` : `${hours}시간`;
  return compact ? `${hours}h ${minutes}m` : `${hours}시간 ${minutes}분`;
};

export const formatPercent = (value, digits = 1) => {
  const percent = Number(value) || 0;
  return `${percent.toLocaleString("ko-KR", {
    minimumFractionDigits: Number.isInteger(percent) ? 0 : digits,
    maximumFractionDigits: digits,
  })}%`;
};

export const formatShortDate = (value) => {
  if (!value) return "-";
  const [, month, day] = value.split("-");
  return month && day ? `${month}.${day}` : value;
};

export const priorityLabels = {
  1: "비용 우선",
  2: "시간 우선",
  3: "친환경 우선",
  4: "균형형",
};
