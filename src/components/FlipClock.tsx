interface FlipDigitProps {
  value: string;
}

function FlipDigit({ value }: FlipDigitProps) {
  return (
    <span className="flip-digit">
      <span key={value}>{value}</span>
    </span>
  );
}

function FlipPair({ value }: { value: string }) {
  return (
    <span className="flip-pair">
      {Array.from(value).map((digit, index) => <FlipDigit key={index} value={digit} />)}
    </span>
  );
}

export function FlipClock({ value }: { value: Date }) {
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  const seconds = String(value.getSeconds()).padStart(2, '0');

  return (
    <time className="lock-clock" dateTime={value.toISOString()} aria-label={`${hours}时${minutes}分${seconds}秒`}>
      <span className="flip-clock-visual" aria-hidden="true">
        <span className="flip-clock-main">
          <FlipPair value={hours} />
          <span className="flip-separator">:</span>
          <FlipPair value={minutes} />
        </span>
        <span className="flip-clock-seconds">
          <FlipPair value={seconds} />
          <small>秒</small>
        </span>
      </span>
    </time>
  );
}
