declare module "tui-image-editor" {
    export default class ImageEditor {
        constructor(container: HTMLElement | string, options: any);
        toDataURL(): string;
        destroy(): void;
    }
}
