import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  "api", {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  send: (channel: string, ...data: any[]) => {
    // whitelist channels
    const validChannels = ["minimize-window", "close-window", "show-window"];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  receive: (channel: string, func: (...args: any[]) => void) => {
    const validChannels = [];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender` 
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  }
}
);

contextBridge.exposeInMainWorld("setIgnoreMouseEvents", (ignore: boolean, options?: { forward?: boolean }) => {
  ipcRenderer.send("set-ignore-mouse-events", ignore, options);
});

window.addEventListener("DOMContentLoaded", () => {
  refreshClickableElements();
});

window.addEventListener("DOMNodeInserted", () => {
  refreshClickableElements();
});

function refreshClickableElements() {
  const clickableElements = document.getElementsByClassName("clickable");
  const listeningAttr = "listeningForMouse";
  for (const ele of Array.from(clickableElements)) {
    // If the listeners are already set up for this element, skip it.
    if (ele.getAttribute(listeningAttr)) {
      continue;
    }
    ele.addEventListener("mouseenter", () => {
      console.log("enter");
      ipcRenderer.send("set-ignore-mouse-events", false);
    });
    ele.addEventListener("mouseleave", () => {
      console.log("exit");
      ipcRenderer.send("set-ignore-mouse-events", true, { forward: true });
    });
    ele.setAttribute(listeningAttr, "true");
  }
}