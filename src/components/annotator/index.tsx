import { BBoxMovePoint, FileEntry, ImageAnnotation, ImageBoundingBox } from "@/types/basetype"
import { annotationAtom } from "@/utils/atoms"
import { useAtom } from "jotai"
import {
    forwardRef, 
    PointerEventHandler, 
    useCallback, 
    useEffect, 
    useImperativeHandle, 
    useMemo, 
    useRef, 
    useState 
} from "react"
import { useImageSize } from "react-image-size"
import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from "react-zoom-pan-pinch"
import BoundingBox from "./bounding-box"
import { useEventListener } from "usehooks-ts"
import { LabelColor } from "@/hooks/useWorkConfig"

export type AnnotatorRef = {
    resizeContent: () => void
    zoomToBox: (box: ImageBoundingBox) => void
    boxes: ImageBoundingBox[]
}

type AnnotatorProps = {
    image: FileEntry
    containerRef: React.RefObject<HTMLDivElement>
    mode: 'adjust' | 'view'
    imageInfo: {
        width: number
        height: number
    }
    boxOptions?: {
        color: LabelColor
    }
}

export default forwardRef<AnnotatorRef, AnnotatorProps>((props, ref) => {

    const { 
        image, 
        containerRef,
        mode,
        boxOptions
    } = props

    const [ dimensions ] = useImageSize(image.src)

    const width = dimensions?.width || 1
    const height = dimensions?.height || 1

    const transfromRef = useRef<ReactZoomPanPinchRef>(null)

    const [ canvasX, setCanvasX ] = useState(0)
    const [ canvasY, setCanvasY ] = useState(0)
    const [ scale, setScale ] = useState(1)
    const [ pointerPos, setPointerPos ] = useState({x: 0, y: 0})

    const [ annotations, setAnnotations ] = useAtom(annotationAtom)

    useEffect(() => {
        if(!annotations[image.name]) {
            setAnnotations({
                ...annotations,
                [image.name]: {
                    boxes: [],
                    metadata: {
                        width,
                        height
                    },
                    labels: {}
                }
            })
        }
    }, [annotations, image, width, height])

    const currAnno: ImageAnnotation = annotations[image.name] ?? {
        boxes: [],
        metadata: {
            width,
            height
        },
        labels: {}
    }

    const [ creatingBox, setCreatingBox ] = useState(false)
    const [ selectedBox, setSelectedBox ] = useState<{
        index: number,
        movepoint: BBoxMovePoint
    } | null>(null)

    const [ tempBoxAnchor, setTempBoxAnchor ] = useState({ x: 0, y: 0 })

    const [ tempBox, setTempBox ] = useState<ImageBoundingBox>({
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        boxId: -1
    })

    const bboxCreating: (ImageBoundingBox | null) = useMemo(() => {
        return creatingBox ? {
            left: Math.min(tempBoxAnchor.x, pointerPos.x),
            top: Math.min(tempBoxAnchor.y, pointerPos.y),
            width: Math.abs(pointerPos.x - tempBoxAnchor.x),
            height: Math.abs(pointerPos.y - tempBoxAnchor.y),
            boxId: -10
        } : null
    }, [creatingBox, pointerPos, tempBoxAnchor])

    const handleBBoxChangeOnce = useCallback((id: number, bbox: Partial<ImageBoundingBox>) => {
        const newBoxes = currAnno.boxes.map(b => b.boxId === id ? {...b, ...bbox} : b)
        setAnnotations({
            ...annotations,
            [image.name]: {
                ...currAnno,
                boxes: newBoxes
            }
        })
    }, [annotations, currAnno])

    const onMovePointer: PointerEventHandler<HTMLDivElement> = useCallback(e => {
        const px = (e.clientX - containerRef.current?.offsetLeft!- canvasX) / scale 
        const py = (e.clientY - containerRef.current?.offsetTop! - canvasY) / scale 

        setPointerPos({x: px, y: py})

        if(selectedBox) {
            const deltaPointer = {
                dx: px - tempBoxAnchor.x,
                dy: py - tempBoxAnchor.y
            }
            // console.log(tempBoxAnchor);
            
            const { index, movepoint } = selectedBox
            const box = currAnno.boxes.find(b => b.boxId === index)
            if(!box) return

            switch (movepoint) {
                case BBoxMovePoint.TOP_LEFT:
                    handleBBoxChangeOnce(index, {
                        left: Math.min(px, tempBox.left + tempBox.width),
                        top: Math.min(py, tempBox.top + tempBox.height),
                        width: Math.abs(tempBox.width - deltaPointer.dx),
                        height: Math.abs(tempBox.height - deltaPointer.dy)
                    })
                    break;
                case BBoxMovePoint.TOP_RIGHT:
                    handleBBoxChangeOnce(index, {
                        left: Math.min(px, tempBox.left),
                        top: Math.min(py, tempBox.top + tempBox.height),
                        width: Math.abs(px - tempBox.left),
                        height: Math.abs(tempBox.height - deltaPointer.dy)
                    })
                    break;
                case BBoxMovePoint.BOT_LEFT:
                    handleBBoxChangeOnce(index, {
                        left: Math.min(px, tempBox.left + tempBox.width),
                        top: Math.min(py, tempBox.top),
                        width: Math.abs(tempBox.width - deltaPointer.dx),
                        height: Math.abs(tempBox.height + deltaPointer.dy)
                    })
                    break;
                case BBoxMovePoint.BOT_RIGHT:
                    handleBBoxChangeOnce(index, {
                        left: Math.min(px, tempBox.left),
                        top: Math.min(py, tempBox.top),
                        width: Math.abs(px - tempBox.left),
                        height: Math.abs(tempBox.height + deltaPointer.dy)
                    })
                    break;
                case BBoxMovePoint.LEFT:
                    handleBBoxChangeOnce(index, {
                        ...tempBox,
                        left: Math.min(px, tempBox.left + tempBox.width),
                        width: Math.abs(tempBox.width - deltaPointer.dx)
                    })
                    break;
                case BBoxMovePoint.RIGHT:
                    handleBBoxChangeOnce(index, {
                        ...tempBox,
                        left: Math.min(px, tempBox.left),
                        width: Math.abs(tempBox.width + deltaPointer.dx)
                    })
                    break;
                case BBoxMovePoint.TOP:
                    handleBBoxChangeOnce(index, {
                        ...tempBox,
                        top: Math.min(py, tempBox.top + tempBox.height),
                        height: Math.abs(tempBox.height - (py - tempBox.top))
                    })
                    break;
                case BBoxMovePoint.BOT:
                    handleBBoxChangeOnce(index, {
                        ...tempBox,
                        top: Math.min(py, tempBox.top),
                        height: Math.abs(tempBox.height + deltaPointer.dy)
                    })
                    break;
                case BBoxMovePoint.CENTER:
                    handleBBoxChangeOnce(index, {
                        ...tempBox,
                        left: tempBox.left + deltaPointer.dx,
                        top: tempBox.top + deltaPointer.dy
                    })
                    break;
                default:
                    break;
            }

        }
    }, [
        currAnno.boxes, 
        canvasX, 
        canvasY, 
        handleBBoxChangeOnce, 
        scale, 
        selectedBox, 
        tempBox, 
        tempBoxAnchor,
    ])

    const addBox = useCallback((box: ImageBoundingBox) => {
        setAnnotations({
            ...annotations,
            [image.name]: {
                ...currAnno,
                boxes: [
                    ...currAnno.boxes,
                    box
                ]
            }
        })
    }, [annotations, currAnno])

    const onTransformContentPointerUp = useCallback(() => {
        console.log('pointer up, view state:', mode, 'isCreatingBox', creatingBox);
        if(selectedBox) {
            return setSelectedBox(null)
        }
        if(mode !== 'adjust' || !creatingBox) return;
        // console.log('adding box');
        
        addBox({
            left: Math.min(tempBoxAnchor.x, pointerPos.x),
            top: Math.min(tempBoxAnchor.y, pointerPos.y),
            width: Math.abs(pointerPos.x - tempBoxAnchor.x),
            height: Math.abs(pointerPos.y - tempBoxAnchor.y),
            boxId: currAnno.boxes.length,
            label: 'box_' + currAnno.boxes.length
        })
        setCreatingBox(false)
    }, [addBox, creatingBox, pointerPos, tempBoxAnchor, mode])

    const resizeContent = useCallback(() => {

        const containerHeight = containerRef.current?.offsetHeight || height
        const containerWidth = containerRef.current?.offsetWidth || width

        const diffRatioY = containerHeight / height;
        const diffRatioX = containerWidth / width;

        const ratio = Math.min(diffRatioX, diffRatioY)

        const x = (containerWidth - (width * ratio)) / 2
        const y = (containerHeight - (height * ratio)) / 2

        transfromRef.current?.setTransform(x, y, ratio)

    }, [height, width])

    const zoomToBox = useCallback((box: ImageBoundingBox) => {
        // const box = currAnno.boxes.find(b => b.boxId === id)
        // if(!box) return
        // console.log('zooming to box', id);
        
        transfromRef.current?.zoomToElement(
            box.boxId.toString(),
            (containerRef.current?.offsetHeight || height) / (box.height * 2),
            100
        )
    }, [currAnno.boxes, height])

    useImperativeHandle(ref, () => ({
        resizeContent,
        boxes: currAnno.boxes,
        zoomToBox
    }), [resizeContent])

    /**
     * reszie the canvas every time the image changes
     */
    useEffect(() => {
        // setCanvasLoading(true)

        // transfromRef.current?.resetTransform()
        resizeContent()
    }, [image, resizeContent])

    useEventListener('keyup', e => {
        if(e.key === 'Alt') {
            // setViewState('drag');
            setCreatingBox(false)
        }
    })

    const cursorStyle = {
        [BBoxMovePoint.TOP_LEFT]: 'nwse-resize',
        [BBoxMovePoint.TOP_RIGHT]: 'nesw-resize',
        [BBoxMovePoint.BOT_LEFT]: 'nesw-resize',
        [BBoxMovePoint.BOT_RIGHT]: 'nwse-resize',
        [BBoxMovePoint.LEFT]: 'col-resize',
        [BBoxMovePoint.RIGHT]: 'col-resize',
        [BBoxMovePoint.TOP]: 'row-resize',
        [BBoxMovePoint.BOT]: 'row-resize',
        [BBoxMovePoint.CENTER]: 'move',
    }

    return (
        <div 
            onPointerMove={onMovePointer}
            className={`
                flex flex-1 w-full h-full
            `}
            style={selectedBox ? {cursor: cursorStyle[selectedBox.movepoint]}: {}}
        >
            <TransformWrapper
                ref={transfromRef} 
                maxScale={1000} 
                minScale={
                    Math.min(
                        (containerRef.current?.offsetWidth || width ) / width, 
                        (containerRef.current?.offsetHeight || height) / height
                    )
                } 
                smooth
                disabled={mode !== 'view'}
                onTransformed={(_ref, { positionX, positionY, scale }) => {
                    setCanvasX(positionX)
                    setCanvasY(positionY)
                    setScale(scale)
                }}
                
            >
                {/* This is for pointer position debug, uncomment by need */}
                {/* <div className="absolute bottom-1 left-1/2 rounded-full p-1 z-10 bg-white text-black">
                    <h1>{(pointerPos.x.toFixed(2))}, {pointerPos.y.toFixed(2)}</h1>
                    <h1>{height}x{width}</h1>
                </div> */}
                <TransformComponent
                    wrapperStyle={{
                        overflow: "visible",
                        display: 'flex',
                        flex: 1,
                        width: '100%',
                        height: '100%',
                    }}
                    contentProps={{
                        onPointerDown: _ => {
                            if(mode !== 'adjust') return
                            setCreatingBox(true)
                            setTempBoxAnchor(pointerPos)
                        },
                        onPointerUp: onTransformContentPointerUp
                    }}
                    contentStyle={{
                        width,
                        height,
                        position: 'absolute',
                        zIndex: 0
                    }}

                >
                    { bboxCreating && <BoundingBox 
                        id={`temp-box`}
                        box={bboxCreating}
                        {...bboxCreating}
                        scale={scale}
                        boxOptions={boxOptions}
                    />}

                    { currAnno.boxes.map((box, index) => (
                        <BoundingBox
                            key={box.boxId}
                            id={box.boxId.toString()}
                            scale={scale}
                            box={box}
                            onSelectMovePoint={movepoint => {
                                if(mode !== 'adjust') return
                                setTempBoxAnchor(pointerPos)
                                setTempBox(box)
                                setSelectedBox({
                                    index,
                                    movepoint
                                })
                            }}
                            locked={mode !== 'adjust'}
                            boxOptions={boxOptions}
                        />
                    ))}
                    <img 
                        src={image.src} 
                        alt={image.name} 
                        height={dimensions?.height} 
                        width={dimensions?.width} 
                    />
                </TransformComponent>
            </TransformWrapper>
        </div>
    )
})
