import { BBoxMovePoint, ImageBoundingBox } from "@/types/basetype";

const CORNER_SIZE = 6

const BoxEdge = ({
    onSelected,
    length,
    position,
    locked
}: {
    onSelected: () => void,
    length: number,
    position: BBoxMovePoint.BOT | BBoxMovePoint.TOP | BBoxMovePoint.LEFT | BBoxMovePoint.RIGHT,
    locked?: boolean
}) => {

    const styles = {
        [BBoxMovePoint.TOP]: {
            top: -(CORNER_SIZE / 2),
            left: CORNER_SIZE / 2,
            width: length - CORNER_SIZE-2,
            height: CORNER_SIZE,
        },
        [BBoxMovePoint.BOT]: {
            bottom: -(CORNER_SIZE / 2),
            left: CORNER_SIZE / 2,
            width: length - CORNER_SIZE-2,
            height: CORNER_SIZE,
        },
        [BBoxMovePoint.LEFT]: {
            left: -(CORNER_SIZE / 2),
            top: CORNER_SIZE / 2,
            width: CORNER_SIZE,
            height: length - CORNER_SIZE -2 ,
        },
        [BBoxMovePoint.RIGHT]: {
            right: -(CORNER_SIZE / 2),
            top: CORNER_SIZE / 2,
            width: CORNER_SIZE,
            height: length - CORNER_SIZE - 2,
        },
    }

    return (
    <div 
        className={`
            absolute bg-transparent
            ${
                !locked && (
                    (position === BBoxMovePoint.TOP || position === BBoxMovePoint.BOT) 
                    ? 'hover:cursor-ns-resize' 
                    : 'hover:cursor-ew-resize'
                )
            }
        `}
        style={styles[position]}
        onPointerDown={e => {
            e.stopPropagation()
            onSelected()
        }}
    />
    )
}

const BoxCorner = ({
    onSelected,
    position,
    locked
}:{
    onSelected: () => void,
    position: BBoxMovePoint.TOP_LEFT | BBoxMovePoint.TOP_RIGHT | BBoxMovePoint.BOT_LEFT | BBoxMovePoint.BOT_RIGHT,
    locked?: boolean
}) => {
    
        const styles = {
            [BBoxMovePoint.TOP_LEFT]: {
                top: -(CORNER_SIZE / 2),
                left: -(CORNER_SIZE / 2),
                width: CORNER_SIZE,
                height: CORNER_SIZE,
            },
            [BBoxMovePoint.TOP_RIGHT]: {
                top: -(CORNER_SIZE / 2),
                right: -(CORNER_SIZE / 2),
                width: CORNER_SIZE,
                height: CORNER_SIZE,
            },
            [BBoxMovePoint.BOT_LEFT]: {
                bottom: -(CORNER_SIZE / 2),
                left: -(CORNER_SIZE / 2),
                width: CORNER_SIZE,
                height: CORNER_SIZE,
            },
            [BBoxMovePoint.BOT_RIGHT]: {
                bottom: -(CORNER_SIZE / 2),
                right: -(CORNER_SIZE / 2),
                width: CORNER_SIZE,
                height: CORNER_SIZE,
            },
        }
    
        return (
        <div 
            className={`
                absolute bg-transparent
                ${
                    !locked && (
                        (position === BBoxMovePoint.TOP_LEFT || position === BBoxMovePoint.BOT_RIGHT)
                        ? 'hover:cursor-nwse-resize' 
                        : 'hover:cursor-nesw-resize'
                    )
                }
            `}
            style={styles[position]}
            onPointerDown={e => {
                e.stopPropagation()
                onSelected()
            }}
        />
        )
    }

interface BoundingBoxProps {
    box: ImageBoundingBox
    onSelectMovePoint?: (point: BBoxMovePoint) => void
    scale?: number
    id: string
    locked?: boolean
}


export default function BoundingBox(props: BoundingBoxProps) {
    const { 
        box,
        onSelectMovePoint,
        id,
        scale = 1,
        locked = false
    } = props

    let labelHeight = 40 / scale

    labelHeight = labelHeight < 30 ? 30 : labelHeight

    labelHeight = labelHeight > 100 ? 100 : labelHeight

    return (
        <div 
            className="absolute border-amber-500"
            style={{
                top: box.top,
                left: box.left,
                width: box.width,
                height: box.height,
                borderWidth: 1
            }}
            id={id}
        >
            {box.label && <div
                className="absolute bg-amber-500 rounded-b-lg flex justify-center items-center px-2"
                style={{
                    bottom: -labelHeight,
                    height: labelHeight,
                    fontSize: labelHeight - 10,
                    right: -1,
                }}
            >
                <h1 className="font-semibold">{box.label}</h1>
            </div>}
            <div 
                className={`
                    absolute bg-transparent
                    ${!locked && 'hover:cursor-move'}
                `}
                style={{
                    top: CORNER_SIZE / 2,
                    left: CORNER_SIZE / 2,
                    width: box.width - CORNER_SIZE - 2,
                    height: box.height - CORNER_SIZE - 2,
                }}
                onPointerDown={e => {
                    e.stopPropagation()
                    onSelectMovePoint&&onSelectMovePoint(BBoxMovePoint.CENTER)
                }}
            />
            <BoxCorner 
                locked={locked}
                onSelected={() => onSelectMovePoint&&onSelectMovePoint(BBoxMovePoint.TOP_LEFT)}
                position={BBoxMovePoint.TOP_LEFT}
            />
            <BoxCorner 
                locked={locked}
                onSelected={() => onSelectMovePoint&&onSelectMovePoint(BBoxMovePoint.TOP_RIGHT)}
                position={BBoxMovePoint.TOP_RIGHT}
            />
            <BoxCorner 
                locked={locked}
                onSelected={() => onSelectMovePoint&&onSelectMovePoint(BBoxMovePoint.BOT_LEFT)}
                position={BBoxMovePoint.BOT_LEFT}
            />
            <BoxCorner 
                locked={locked}
                onSelected={() => onSelectMovePoint&&onSelectMovePoint(BBoxMovePoint.BOT_RIGHT)}
                position={BBoxMovePoint.BOT_RIGHT}
            />
            <BoxEdge 
                locked={locked}
                onSelected={() => onSelectMovePoint&&onSelectMovePoint(BBoxMovePoint.TOP)}
                length={box.width}
                position={BBoxMovePoint.TOP}
            />
            <BoxEdge 
                locked={locked}
                onSelected={() => onSelectMovePoint&&onSelectMovePoint(BBoxMovePoint.BOT)}
                length={box.width}
                position={BBoxMovePoint.BOT}
            />
            <BoxEdge 
                locked={locked}
                onSelected={() => onSelectMovePoint&&onSelectMovePoint(BBoxMovePoint.LEFT)}
                length={box.height}
                position={BBoxMovePoint.LEFT}
            />
            <BoxEdge 
                locked={locked}
                onSelected={() => onSelectMovePoint&&onSelectMovePoint(BBoxMovePoint.RIGHT)}
                length={box.height}
                position={BBoxMovePoint.RIGHT}
            />
        </div>
    )
}