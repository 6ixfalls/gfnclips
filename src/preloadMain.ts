import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    "api", {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    send: (channel: string, ...data: any[]) => {
        // whitelist channels
        const validChannels = ["minimize-window", "close-window", "show-window", "set-ignore-mouse-events"];
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