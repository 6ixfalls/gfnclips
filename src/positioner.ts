import { BrowserWindow, Display, Point, Rectangle, screen, Screen } from "electron";

export default {
    /**
     * Calculates the position of the tray window
     *
     * @param {Rectangle} trayBounds - tray bounds from electron Tray
     * @return {string} - the position of the taskbar (top|right|bottom|left)
     */
    getTaskbarPosition(trayBounds: Rectangle): string {
        const display = this._getDisplay(trayBounds);

        if (display.workArea.y > display.bounds.y) {
            return 'top';
        }

        if (display.workArea.x > display.bounds.x) {
            return 'left';
        }

        if (display.workArea.width === display.bounds.width) {
            return 'bottom';
        }

        return 'right';
    },

    /**
     * Calculates the position of the tray window
     *
     * @param {Rectangle} windowBounds - electron BrowserWindow bounds of tray window to position
     * @param {Rectangle} trayBounds - tray bounds from electron Tray
     * @param {Object} [alignment] - alignment of window to tray
     * @param {string} [alignment.x] - x align if tray bar is on top or bottom (left|center|right),
        default: center
     * @param {string} [alignment.y] - y align if tray bar is left or right (up|middle|down),
        default: down
     * @return {Point} - Calculated point {x, y} where the window should be positioned
     */
    calculate(windowBounds: Rectangle, trayBounds: Rectangle, alignment?: { x: "left" | "middle" | "right", y: "up" | "middle" | "down" }): Point {
        let tb;
        if (this._getPlatform() === 'linux') {
            tb = { width: 0, height: 0, ...this._getCursorPosition() };
        } else {
            tb = trayBounds;
        }

        const _alignment = alignment || { y: undefined, x: undefined };
        const taskbarPosition = this.getTaskbarPosition(tb);
        const display = this._getDisplay(tb);
        let x;
        let y;

        switch (taskbarPosition) {
            case 'left':
                x = display.workArea.x;
                y = this._calculateYAlign(windowBounds, tb, _alignment.y);
                break;
            case 'right':
                x = display.workArea.width - windowBounds.width;
                y = this._calculateYAlign(windowBounds, tb, _alignment.y);
                break;
            case 'bottom':
                x = this._calculateXAlign(windowBounds, tb, _alignment.x);
                y = display.workArea.height - windowBounds.height;
                break;
            case 'top':
            default:
                x = this._calculateXAlign(windowBounds, tb, _alignment.x);
                y = display.workArea.y;
        }

        return { x, y };
    },

    /**
     * Calculates the position of the tray window
     *
     * @param {BrowserWindow} window - window to position
     * @param {Rectangle} trayBounds - tray bounds from electron Tray
     * @param {Object} [alignment] - alignment of window to tray
     * @param {string} [alignment.x] - x align if tray bar is on top or bottom (left|center|right),
        default: center
     * @param {string} [alignment.y] - y align if tray bar is left or right (up|middle|down),
        default: down
     * @return {Void}
     */
    position(window: BrowserWindow, trayBounds: Rectangle, alignment?: { x: "left" | "middle" | "right", y: "up" | "middle" | "down" }): void {
        const position = this.calculate(window.getBounds(), trayBounds, alignment);
        window.setPosition(position.x, position.y, false);
    },

    /**
     * Calculates the x position of the tray window
     *
     * @param {Rectangle} windowBounds - electron BrowserWindow bounds of tray window to position
     * @param {Rectangle} trayBounds - tray bounds from electron Tray.getBounds()
     * @param {string} [align] - align left|center|right, default: center
     * @return {integer} - calculated x position
     */
    _calculateXAlign(windowBounds: Rectangle, trayBounds: Rectangle, align: "left" | "center" | "right"): number {
        const display = this._getDisplay(trayBounds);
        let x;

        function alignLeft() {
            return trayBounds.x + trayBounds.width - windowBounds.width;
        }

        function alignRight() {
            return trayBounds.x;
        }

        switch (align) {
            case 'right':
                x = alignRight();
                break;
            case 'left':
                x = alignLeft();
                break;
            case 'center':
            default:
                x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));
        }

        if ((x + windowBounds.width) > (display.bounds.width + display.bounds.x) && align !== 'left') {
            // if window would overlap on right side align it left
            x = alignLeft();
        } else if (x < display.bounds.x && align !== 'right') {
            // if window would overlap on the left side align it right
            x = alignRight();
        }

        return x;
    },

    /**
     * Calculates the y position of the tray window
     *
     * @param {Rectangle} windowBounds - electron BrowserWindow bounds
     * @param {Rectangle} trayBounds - tray bounds from electron Tray.getBounds()
     * @param {string} [align] - align up|middle|down, default: down
     * @return {integer} - calculated y position
     */
    _calculateYAlign(windowBounds: Rectangle, trayBounds: Rectangle, align?: "up" | "middle" | "down"): number {
        const display = this._getDisplay(trayBounds);
        let y;

        function alignUp() {
            return trayBounds.y + trayBounds.height - windowBounds.height;
        }

        function alignDown() {
            return trayBounds.y;
        }

        switch (align) {
            case 'up':
                y = alignUp();
                break;
            case 'middle':
                y = Math.round((trayBounds.y + (trayBounds.height / 2)) - (windowBounds.height / 2));
                break;
            case 'down':
            default:
                y = alignDown();
        }

        if (y + windowBounds.height > display.bounds.height && align !== 'up') {
            y = alignUp();
        } else if (y < 0 && align !== 'down') {
            y = alignDown();
        }

        return y;
    },

    /**
     * Returns `process.platform`
     *
     * @return {string} - the platform electron is running on
     */
    _getPlatform(): NodeJS.Platform {
        return process.platform;
    },

    _getScreen(): Screen {
        if (this.screen) return this.screen;

        // requireing electron.screen here so this dependency can be mocked easily
        this.screen = screen;
        return this.screen;
    },

    _getCursorPosition(): Point {
        const screen = this._getScreen();
        return screen.getCursorScreenPoint();
    },

    /**
     * Get the display nearest the current cursor position
     *
     * @param {Rectangle} trayBounds - tray bounds from electron Tray
     * @return {Electron.Display} - the display closest to the current cursor position
     */
    _getDisplay(trayBounds: Rectangle): Display {
        const screen = this._getScreen();
        return screen.getDisplayNearestPoint((({ x, y }) => ({ x, y }))(trayBounds));
    },
};