// src/pages/Home/HomePage.jsx
import { useSelector } from "react-redux";

export default function HomePage() {
  const user = useSelector((state) => state.auth.user);
  const userName = user?.userName || user?.name || "User";

  return (
    <div className="mt-4 text-sm text-muted-foreground ">
      <h1 className="text-lg font-semibold text-foreground">
        Welcome, {userName}
      </h1>
    </div>
  );
}
