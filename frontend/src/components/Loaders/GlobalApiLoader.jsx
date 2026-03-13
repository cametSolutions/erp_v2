import { useSelector } from "react-redux";
import CustomMoonLoader from "./CustomMoonLoader";

export default function GlobalApiLoader() {
  const pendingRequests = useSelector((state) => state.ui.pendingRequests);

  if (!pendingRequests) return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-10 flex items-center justify-center ">
        <CustomMoonLoader size={34} fullScreen={false} />
    </div>
  );
}
