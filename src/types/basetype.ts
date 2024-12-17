export type ImageBoundingBox = {
    boxId: number;
    label?: string;
    left: number;
    top: number;
    width: number;
    height: number;
}

export enum BBoxMovePoint {
    TOP_LEFT,
    TOP_RIGHT,
    BOT_LEFT,
    BOT_RIGHT,
    LEFT,
    RIGHT,
    TOP,
    BOT,
    CENTER
}

export const anchorsMap = {
    [BBoxMovePoint.TOP_LEFT]: BBoxMovePoint.BOT_RIGHT,
    [BBoxMovePoint.TOP_RIGHT]: BBoxMovePoint.BOT_LEFT,
    [BBoxMovePoint.BOT_LEFT]: BBoxMovePoint.TOP_RIGHT,
    [BBoxMovePoint.BOT_RIGHT]: BBoxMovePoint.TOP_LEFT,
}


export type ImageAnnotation = {
	labels?: {[key: string]: string},
    metadata?: {
        width?: number,
        height?: number,
    },
    boxes: ImageBoundingBox[],
}

export type FileEntry = {
    name: string,
    path: string,
    src: string,
}

