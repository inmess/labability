import { WorkspaceConfig } from "@/hooks/useWorkConfig"
import { BBoxMovePoint, FileEntry, ImageAnnotation, ImageBoundingBox } from "@/types/basetype"
import { annotationAtom, AnnotationsState } from "@/utils/atoms"
import { useAtom } from "jotai"
import { clamp, throttle, cloneDeep } from "lodash-es"
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
import { useEventListener } from "usehooks-ts"
import BoundingBox from "./bounding-box"


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
    workspaceConfig: WorkspaceConfig
}

export default forwardRef<AnnotatorRef, AnnotatorProps>((props, ref) => {

    const {
        image,
        containerRef,
        mode,
        workspaceConfig: {
            classList
        }
    } = props

    const [dimensions] = useImageSize(image.src)

    const width = dimensions?.width || 1
    const height = dimensions?.height || 1

    const transfromRef = useRef<ReactZoomPanPinchRef>(null)

    const [canvasX, setCanvasX] = useState(0)
    const [canvasY, setCanvasY] = useState(0)
    const [scale, setScale] = useState(1)
    const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 })

    const [annotations, setAnnotations] = useAtom(annotationAtom)

    const [boxOptions] = useState({
        classId: 0,
        name: classList[0].name,
        color: classList[0].color
    })

    const [boxEditing, setBoxEditing] = useState(-1)

    const [history, setHistory] = useState<AnnotationsState[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const MAX_HISTORY_STEPS = 50;

    const [shouldRecordHistory, setShouldRecordHistory] = useState(false);

    const recordHistorySnapshot = useCallback(() => {
        setHistory(prevHistory => {
            const newHistory = [...prevHistory.slice(0, historyIndex + 1), cloneDeep(annotations)];
            return newHistory.slice(-MAX_HISTORY_STEPS);
        });
        setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY_STEPS - 1));
    }, [historyIndex, annotations]);

    useEffect(() => {
        if (shouldRecordHistory) {
            recordHistorySnapshot();
            setShouldRecordHistory(() => false);
        }
    }, [recordHistorySnapshot, shouldRecordHistory]);

    // 获取当前激活的图片标注副本
    // const getCurrentImageAnnotation = useCallback((): ImageAnnotation => {
    //     return JSON.parse(JSON.stringify(annotations[image.name])) || {
    //         boxes: [],
    //         metadata: { width, height },
    //         labels: {}
    //     };
    // }, [annotations, image.name, width, height]);

    useEffect(() => {
        if (!annotations[image.name]) {
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

    const currAnno: ImageAnnotation = useMemo(() => annotations[image.name] ?? {
        boxes: [],
        metadata: {
            width,
            height
        },
        labels: {}
    }, [annotations, image, width, height])

    const [creatingBox, setCreatingBox] = useState(false)
    const [selectedBox, setSelectedBox] = useState<{
        id: number,
        movepoint: BBoxMovePoint
    } | null>(null)

    const [tempBoxAnchor, setTempBoxAnchor] = useState({ x: 0, y: 0 })

    const [tempBox, setTempBox] = useState<ImageBoundingBox>({
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        boxId: -1,
        class: boxOptions.classId
    })

    const bboxCreating: (ImageBoundingBox | null) = useMemo(() => {
        return creatingBox ? {
            left: Math.min(tempBoxAnchor.x, pointerPos.x),
            top: Math.min(tempBoxAnchor.y, pointerPos.y),
            width: Math.abs(pointerPos.x - tempBoxAnchor.x),
            height: Math.abs(pointerPos.y - tempBoxAnchor.y),
            boxId: -10,
            class: boxOptions.classId,
        } : null
    }, [creatingBox, pointerPos, tempBoxAnchor, boxOptions])

    const handleBBoxChangeOnce = useCallback((id: number, bbox: Partial<ImageBoundingBox>) => {

        setAnnotations(prev => {
            // if (!operationInProgress.current) {
            //     operationInProgress.current = true;
            // }

            // 实时更新但不记录历史
            const newAnnotations: AnnotationsState = JSON.parse(JSON.stringify(prev));
            const current = newAnnotations[image.name] ?? { boxes: [] };

            return {
                ...newAnnotations,
                [image.name]: {
                    ...current,
                    boxes: current.boxes.map(b =>
                        b.boxId === id ? { ...b, ...bbox } : b
                    )
                }
            };
        });
    }, [image.name]);

    useEventListener('keydown', (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') { // 撤销
            setHistoryIndex(prev => {
                const newIndex = Math.max(prev - 1, 0);
                setAnnotations(history[newIndex] || {});
                return newIndex;
            });
        }
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') { // 重做
            setHistoryIndex(prev => {
                const newIndex = Math.min(prev + 1, history.length - 1);
                setAnnotations(history[newIndex] || {});
                return newIndex;
            });
        }
    });

    // 添加边界保护
    useEffect(() => {
        if (historyIndex >= 0 && history[historyIndex]) {
            setAnnotations(history[historyIndex]);
        }
    }, [historyIndex, history, setAnnotations]);

    const onMovePointer: PointerEventHandler<HTMLDivElement> = useCallback(throttle(e => {

        if (!containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect() || { left: 0, top: 0 };

        const px = (e.clientX - rect.left - canvasX) / scale
        const py = (e.clientY - rect.top - canvasY) / scale

        const clampX = clamp(px, 0, width)
        const clampY = clamp(py, 0, height)
        setPointerPos({ x: clampX, y: clampY })

        if (!selectedBox) return

        const originalBox = currAnno.boxes.find(b => b.boxId === selectedBox.id)
        if (!originalBox) {
            setSelectedBox(null)
            return
        }

        // 创建可修改副本
        const newBox = { ...originalBox }
        const MIN_SIZE = 5

        switch (selectedBox.movepoint) {
            case BBoxMovePoint.TOP_LEFT: {
                // 动态计算可能交叉的边界
                let left = clampX
                let top = clampY
                const right = originalBox.left + originalBox.width
                const bottom = originalBox.top + originalBox.height

                // 处理左>右或上>下的交叉情况
                if (left > right - MIN_SIZE) {
                    left = right - MIN_SIZE
                }
                if (top > bottom - MIN_SIZE) {
                    top = bottom - MIN_SIZE
                }

                newBox.width = right - left
                newBox.height = bottom - top
                newBox.left = left
                newBox.top = top
                break
            }

            case BBoxMovePoint.TOP_RIGHT: {
                let right = clampX
                const left = originalBox.left
                let top = clampY
                const bottom = originalBox.top + originalBox.height

                // 右边界不能小于左边界+最小宽度
                right = Math.max(right, left + MIN_SIZE)
                // 上边界不能超过下边界-最小高度
                top = Math.min(top, bottom - MIN_SIZE)

                newBox.width = right - left
                newBox.height = bottom - top
                newBox.top = top
                break
            }

            case BBoxMovePoint.BOT_LEFT: {
                let left = clampX
                const right = originalBox.left + originalBox.width
                const top = originalBox.top
                let bottom = clampY

                left = Math.min(left, right - MIN_SIZE)
                bottom = Math.max(bottom, top + MIN_SIZE)

                newBox.width = right - left
                newBox.height = bottom - top
                newBox.left = left
                break
            }

            case BBoxMovePoint.BOT_RIGHT: {
                const left = originalBox.left
                const top = originalBox.top
                let right = clampX
                let bottom = clampY

                right = Math.max(right, left + MIN_SIZE)
                bottom = Math.max(bottom, top + MIN_SIZE)

                newBox.width = right - left
                newBox.height = bottom - top
                break
            }

            case BBoxMovePoint.LEFT: {
                let left = clampX
                const right = originalBox.left + originalBox.width
                left = Math.min(left, right - MIN_SIZE)
                newBox.width = right - left
                newBox.left = left
                break
            }

            case BBoxMovePoint.RIGHT: {
                const left = originalBox.left
                let right = clampX
                right = Math.max(right, left + MIN_SIZE)
                newBox.width = right - left
                break
            }

            case BBoxMovePoint.TOP: {
                let top = clampY
                const bottom = originalBox.top + originalBox.height
                top = Math.min(top, bottom - MIN_SIZE)
                newBox.height = bottom - top
                newBox.top = top
                break
            }

            case BBoxMovePoint.BOT: {
                const top = originalBox.top
                let bottom = clampY
                bottom = Math.max(bottom, top + MIN_SIZE)
                newBox.height = bottom - top
                break
            }

            case BBoxMovePoint.CENTER: {
                const deltaX = tempBoxAnchor.x - tempBox.left
                const deltaY = tempBoxAnchor.y - tempBox.top
                newBox.left = clamp(clampX - deltaX, 0, width - newBox.width)
                newBox.top = clamp(clampY - deltaY, 0, height - newBox.height)
                break
            }
        }

        newBox.left = clamp(newBox.left, 0, width - MIN_SIZE)
        newBox.top = clamp(newBox.top, 0, height - MIN_SIZE)
        newBox.width = clamp(newBox.width, MIN_SIZE, width - newBox.left)
        newBox.height = clamp(newBox.height, MIN_SIZE, height - newBox.top)

        handleBBoxChangeOnce(selectedBox.id, newBox)
    }, 16), [
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
        setShouldRecordHistory(() => true);
    }, [annotations, currAnno])

    const onTransformContentPointerUp = useCallback(() => {

        // if (selectedBox) {
            
        //     return setSelectedBox(null)
        // }
        if (selectedBox) {
            // 记录调整操作历史
            // setAnnotations(prev => {
            //     const newState = JSON.parse(JSON.stringify(prev));
            //     setHistory(prevHistory => [...prevHistory.slice(0, historyIndex + 1), newState]);
            //     setHistoryIndex(prev => prev + 1);
            //     return newState;
            // });
            
            setSelectedBox(null);  // 清除选中状态
            // return;
        }
        if (mode !== 'adjust' || !creatingBox) return;

        const maxId = currAnno.boxes.reduce((acc, box) => box.boxId > acc ? box.boxId : acc, 0)

        addBox({
            left: Math.min(tempBoxAnchor.x, pointerPos.x),
            top: Math.min(tempBoxAnchor.y, pointerPos.y),
            width: Math.abs(pointerPos.x - tempBoxAnchor.x),
            height: Math.abs(pointerPos.y - tempBoxAnchor.y),
            boxId: maxId + 1,
            label: boxOptions.name,
            class: boxOptions.classId
        })
        setCreatingBox(false)
    }, [addBox, creatingBox, pointerPos, tempBoxAnchor, mode, currAnno.boxes, selectedBox, boxOptions])

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

    const activateBoxEditMode = useCallback((id: number, activate: boolean) => {
        setBoxEditing(activate ? id : -1)
    }, [])

    useImperativeHandle(ref, () => ({
        resizeContent,
        boxes: currAnno.boxes,
        zoomToBox,
        activateBoxEditMode
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
        if (e.key === 'Alt') {
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
            style={selectedBox ? { cursor: cursorStyle[selectedBox.movepoint] } : {}}
        >
            <TransformWrapper
                ref={transfromRef}
                maxScale={1000}
                minScale={
                    Math.min(
                        (containerRef.current?.offsetWidth || width) / width,
                        (containerRef.current?.offsetHeight || height) / height
                    )
                }
                panning={{
                    disabled: mode !== 'view' || boxEditing > -1
                }}
                pinch={{ disabled: mode !== 'view' || boxEditing > -1 }}
                doubleClick={{ disabled: boxEditing > -1 }}
                smooth
                disabled={mode !== 'view'}
                onTransformed={(_ref, { positionX, positionY, scale }) => {
                    setCanvasX(positionX)
                    setCanvasY(positionY)
                    setScale(scale)
                }}
                velocityAnimation={{
                    disabled: true
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
                            if (mode !== 'adjust') return
                            setCreatingBox(true)
                            setTempBoxAnchor(pointerPos)
                        },
                        onPointerUp: onTransformContentPointerUp,
                        onDoubleClick: () => {
                            if(boxEditing > -1) {
                                setShouldRecordHistory(() => true);
                            }
                            setBoxEditing(-1)
                        }
                    }}
                    contentStyle={{
                        width,
                        height,
                        position: 'absolute',
                        zIndex: 0
                    }}

                >
                    {bboxCreating && <BoundingBox
                        id={`temp-box`}
                        box={bboxCreating}
                        {...bboxCreating}
                        scale={scale}
                        boxOptions={{
                            color: boxOptions.color
                        }}
                        viewportSize={{
                            width: containerRef.current?.offsetWidth || width,
                            height: containerRef.current?.offsetHeight || height
                        }}
                    />}

                    {currAnno.boxes.map((box) => (
                        <BoundingBox
                            key={box.boxId}
                            id={box.boxId.toString()}
                            scale={scale}
                            box={box}
                            onSelectMovePoint={movepoint => {
                                // if (mode !== 'adjust') return
                                
                                setTempBoxAnchor(pointerPos)
                                setTempBox(box)
                                setSelectedBox({
                                    id: box.boxId,
                                    movepoint
                                })
                            }}
                            editMode={boxEditing === box.boxId}
                            onActivateEditMode={(activate) => {
                                if(activate) return setBoxEditing(box.boxId)
                                setBoxEditing(-1)
                            }}
                            locked={false}
                            boxOptions={{
                                color: classList.find((_, idx) => idx === box.class)?.color ?? boxOptions.color,
                                classLabel: classList.find((_, idx) => idx === box.class)?.name
                            }}
                            viewportSize={{
                                width: containerRef.current?.offsetWidth || width,
                                height: containerRef.current?.offsetHeight || height
                            }}
                            // onPointerUp={() => console.log('pointer up')}
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
