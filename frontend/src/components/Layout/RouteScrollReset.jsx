import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

function resetMarkedScrollContainers() {
  const containers = document.querySelectorAll("[data-route-scroll-reset='true']");

  containers.forEach((container) => {
    container.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  });
}

export default function RouteScrollReset() {
  const location = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    resetMarkedScrollContainers();

    const frameId = window.requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      resetMarkedScrollContainers();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [location.pathname, location.search, location.hash]);

  return null;
}
