export { };

declare global {
    interface Window {
        api: {

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            send: (channel: string, ...data: any[]) => void;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            receive: (channel: string, func: (...args: any[]) => void) => void;
        },
        setIgnoreMouseEvents: (ignore: boolean, options?: { forward?: boolean }) => void;
    }
}