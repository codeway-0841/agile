import React from "react";
import { Event, EventCallbackFunction } from "@agile-ts/core";

export function useEvent<E extends Event<any>>(
  event: E,
  callback: EventCallbackFunction<E["payload"]>
) {
  // Call event on component mount and remove event on component unmount
  React.useEffect(() => {
    return () => {
      event.removeCallback(event.on(callback));
    };
  }, []);
}
