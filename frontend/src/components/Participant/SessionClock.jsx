import React from "react";

const SessionClock = React.memo(function SessionClock({ className }) {
  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000); // update once per minute
    return () => clearInterval(id);
  }, []);

  const time = new Date(now).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return <div className={className}>{time}</div>;
});

export default SessionClock;
