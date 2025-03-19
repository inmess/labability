import { BBoxMovePoint, ImageBoundingBox } from "@/types/basetype";
import { useMemo } from "react";

// 基础尺寸常量
const BASE_CORNER_SIZE = 8
const BASE_BORDER_WIDTH = 2

interface BoundingBoxProps {
    box: ImageBoundingBox
    onSelectMovePoint?: (point: BBoxMovePoint) => void
    onActivateEditMode?: (activate: boolean) => void
    editMode?: boolean
    scale?: number
    id: string
    locked?: boolean
    boxOptions?: {
        color: string
        classLabel?: string
    }
    viewportSize?: {  // 新增viewport尺寸参数
        width: number
        height: number
    }

}

// 动态尺寸计算函数
const calculateDynamicSize = (
    baseSize: number,
    scale: number,
    viewportSize?: { width: number, height: number }
) => {
    if (!viewportSize) return baseSize * scale;
    // console.log('viewportSize', viewportSize);
    // 根据视口尺寸和默认参考尺寸(1920x1080)计算密度因子
    const referenceArea = 1920 * 1080;
    const currentArea = viewportSize.width * viewportSize.height;
    const densityFactor = Math.sqrt(currentArea / referenceArea);
    
    return baseSize / scale * densityFactor;
};

const BoxAdjustSpot = ({
    onSelected,
    position,
    locked,
    cornerSize,
    borderWidth,
    color
}:{
    onSelected: () => void,
    position: BBoxMovePoint.TOP_LEFT | BBoxMovePoint.TOP_RIGHT | BBoxMovePoint.BOT_LEFT | BBoxMovePoint.BOT_RIGHT | BBoxMovePoint.TOP | BBoxMovePoint.BOT | BBoxMovePoint.LEFT | BBoxMovePoint.RIGHT,
    locked?: boolean,
    cornerSize: number,
    borderWidth: number,
    color?: string
}) => {
    const edgeOffset = borderWidth / 2;
    
    const styles = {
        [BBoxMovePoint.TOP_LEFT]: {
            top: -cornerSize / 2 - edgeOffset,
            left: -cornerSize / 2 - edgeOffset,
            width: cornerSize,
            height: cornerSize,
        },
        [BBoxMovePoint.TOP_RIGHT]: {
            top: -cornerSize / 2 - edgeOffset,
            right: -cornerSize / 2 - edgeOffset,
            width: cornerSize,
            height: cornerSize,
        },
        [BBoxMovePoint.BOT_LEFT]: {
            bottom: -cornerSize / 2 - edgeOffset,
            left: -cornerSize / 2 - edgeOffset,
            width: cornerSize,
            height: cornerSize,
        },
        [BBoxMovePoint.BOT_RIGHT]: {
            bottom: -cornerSize / 2 - edgeOffset,
            right: -cornerSize / 2 - edgeOffset,
            width: cornerSize,
            height: cornerSize,
        },
        [BBoxMovePoint.TOP]: {
            top: -cornerSize / 2 - edgeOffset,
            left: '50%',
            width: cornerSize,
            height: cornerSize,
        },
        [BBoxMovePoint.BOT]: {
            bottom: -cornerSize / 2 - edgeOffset,
            left: '50%',
            width: cornerSize,
            height: cornerSize,
        },
        [BBoxMovePoint.LEFT]: {
            left: -cornerSize / 2 - edgeOffset,
            top: '50%',
            width: cornerSize,
            height: cornerSize,
        },
        [BBoxMovePoint.RIGHT]: {
            right: -cornerSize / 2 - edgeOffset,
            top: '50%',
            width: cornerSize,
            height: cornerSize,
        },
    };
    return (
        <div 
            className={`absolute ${!locked && getCursorStyle(position)}`}
            style={{
                ...styles[position],
                backgroundColor: color ?? 'transparent'
            }}
            onPointerDown={e => {
                if (locked) return;
                e.stopPropagation();
                onSelected();
            }}
        />
    );
};

// 光标样式映射函数
const getCursorStyle = (position: BBoxMovePoint) => {
    switch(position) {
        case BBoxMovePoint.TOP_LEFT:
        case BBoxMovePoint.BOT_RIGHT:
            return 'hover:cursor-nwse-resize';
        case BBoxMovePoint.TOP_RIGHT:
        case BBoxMovePoint.BOT_LEFT:
            return 'hover:cursor-nesw-resize';
        case BBoxMovePoint.TOP:
        case BBoxMovePoint.BOT:
            return 'hover:cursor-ns-resize';
        case BBoxMovePoint.LEFT:
        case BBoxMovePoint.RIGHT:
            return 'hover:cursor-ew-resize';
        default:
            return 'hover:cursor-move';
    }
};

export default function BoundingBox(props: BoundingBoxProps) {
    const { 
        box,
        onSelectMovePoint,
        editMode = false,
        id,
        scale = 1,
        locked = false,
        boxOptions = { color: "#000000" },
        viewportSize,
        onActivateEditMode
    } = props;

    // 动态计算尺寸
    const dynamicBorderWidth = useMemo(() => 
        calculateDynamicSize(BASE_BORDER_WIDTH, scale, viewportSize),
        [scale, viewportSize]
    );

    const dynamicCornerSize = useMemo(() => 
        calculateDynamicSize(BASE_CORNER_SIZE, scale, viewportSize),
        [scale, viewportSize]
    );

    // 标签高度计算
    const labelHeight = useMemo(() => {
        const baseHeight = 30;
        const minHeight = 20;
        const maxHeight = 100;
        return Math.min(Math.max(baseHeight / scale, minHeight), maxHeight);
    }, [scale]);

    return (
        <div 
            className="absolute"
            style={{
                top: box.top,
                left: box.left,
                width: box.width,
                height: box.height,
                borderStyle: editMode ? 'dashed' : 'solid',
                borderWidth: dynamicBorderWidth,
                borderColor: boxOptions.color,
                boxSizing: 'content-box', // 确保边框不影响内容尺寸
            }}
            id={id}
        >
            {/* 标签显示 */}
            {box.label && (
                <div
                    className="absolute rounded-b-lg flex justify-center items-center px-2 hover:cursor-pointer"
                    style={{
                        bottom: -labelHeight,
                        height: labelHeight,
                        fontSize: Math.max(labelHeight - 8, 12),
                        right: -dynamicBorderWidth,
                        backgroundColor: boxOptions.color,
                    }}
                    onClick={() => onActivateEditMode?.(true)}
                >
                    <h1 className="font-semibold" style={{color: 'black'}}>
                        {boxOptions.classLabel ?? `class_${box.class}`}_{box.boxId}
                    </h1>
                </div>
            )}

            {/* 中心拖拽区域 */}
            {editMode && (
                <div 
                    className={`absolute ${!locked && 'hover:cursor-move'}`}
                    style={{
                        top: dynamicCornerSize / 2 + dynamicBorderWidth,
                        left: dynamicCornerSize / 2 + dynamicBorderWidth,
                        width: box.width - dynamicCornerSize - dynamicBorderWidth * 2,
                        height: box.height - dynamicCornerSize - dynamicBorderWidth * 2,
                    }}
                    onPointerDown={e => {
                        if (locked || !editMode) return;
                        e.stopPropagation();
                        onSelectMovePoint?.(BBoxMovePoint.CENTER);
                    }}
                />
            )}

            {/* 调整点 */}
            {editMode && (
                <>
                    <BoxAdjustSpot 
                        locked={locked || !editMode}
                        color={boxOptions.color}
                        onSelected={() => onSelectMovePoint?.(BBoxMovePoint.TOP_LEFT)}
                        position={BBoxMovePoint.TOP_LEFT}
                        cornerSize={dynamicCornerSize}
                        borderWidth={dynamicBorderWidth}
                    />
                    <BoxAdjustSpot 
                        locked={locked || !editMode}
                        color={boxOptions.color}
                        onSelected={() => onSelectMovePoint?.(BBoxMovePoint.TOP_RIGHT)}
                        position={BBoxMovePoint.TOP_RIGHT}
                        cornerSize={dynamicCornerSize}
                        borderWidth={dynamicBorderWidth}
                    />
                    <BoxAdjustSpot 
                        locked={locked || !editMode}
                        color={boxOptions.color}
                        onSelected={() => onSelectMovePoint?.(BBoxMovePoint.BOT_LEFT)}
                        position={BBoxMovePoint.BOT_LEFT}
                        cornerSize={dynamicCornerSize}
                        borderWidth={dynamicBorderWidth}
                    />
                    <BoxAdjustSpot 
                        locked={locked || !editMode}
                        color={boxOptions.color}
                        onSelected={() => onSelectMovePoint?.(BBoxMovePoint.BOT_RIGHT)}
                        position={BBoxMovePoint.BOT_RIGHT}
                        cornerSize={dynamicCornerSize}
                        borderWidth={dynamicBorderWidth}
                    />
                    <BoxAdjustSpot 
                        locked={locked || !editMode}
                        color={boxOptions.color}
                        onSelected={() => onSelectMovePoint?.(BBoxMovePoint.TOP)}
                        position={BBoxMovePoint.TOP}
                        cornerSize={dynamicCornerSize}
                        borderWidth={dynamicBorderWidth}
                    />
                    <BoxAdjustSpot 
                        locked={locked || !editMode}
                        color={boxOptions.color}
                        onSelected={() => onSelectMovePoint?.(BBoxMovePoint.BOT)}
                        position={BBoxMovePoint.BOT}
                        cornerSize={dynamicCornerSize}
                        borderWidth={dynamicBorderWidth}
                    />
                    <BoxAdjustSpot 
                        locked={locked || !editMode}
                        color={boxOptions.color}
                        onSelected={() => onSelectMovePoint?.(BBoxMovePoint.LEFT)}
                        position={BBoxMovePoint.LEFT}
                        cornerSize={dynamicCornerSize}
                        borderWidth={dynamicBorderWidth}
                    />
                    <BoxAdjustSpot 
                        locked={locked || !editMode}
                        color={boxOptions.color}
                        onSelected={() => onSelectMovePoint?.(BBoxMovePoint.RIGHT)}
                        position={BBoxMovePoint.RIGHT}
                        cornerSize={dynamicCornerSize}
                        borderWidth={dynamicBorderWidth}
                    />
                </>
            )}
        </div>
    )
}