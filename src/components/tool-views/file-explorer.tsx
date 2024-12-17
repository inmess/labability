import { FileEntry, ImageBoundingBox } from "@/types/basetype"
import { useEffect, useState } from "react"
import { useEventListener } from "usehooks-ts"

type FileExplorerProps = {
    onChangeSelection: (path: FileEntry) => void
    selected: FileEntry | null
    files: FileEntry[]
    elemWidth: number
    boxes?: ImageBoundingBox[]
    onBoxClick?: (box: ImageBoundingBox) => void
    onBoxDelete?: (boxId: number) => void
    onBoxLabelEdit?: (boxId: number, value: string) => void
}

export default function FileExplorer(props: FileExplorerProps) {
    const {
        onChangeSelection,
        files,
        selected,
        elemWidth,
        boxes,
        onBoxClick,
        // onBoxDelete,
        onBoxLabelEdit,
    } = props

    const [ boxListHeight, setBoxListHeight ] = useState(200)

    const [ editingBoxId, setEditingBoxId ] = useState<number | null>(null)

    return (
    <div 
        className={`flex-1 h-full flex flex-col justify-start items-start px-1`}
        style={{ width: elemWidth }}
    >
        <h1 className="text-sm font-extralight w-full pl-2 mb-2 text-white bg-amber-500">EXPLORER</h1>
        <div className="overflow-y-scroll flex-1">       
            {files.map((file) => {
                const isSelected = selected?.name === file.name
                return(
                <div key={file.name} className="flex flex-row justify-start" style={{width: elemWidth - 4}}>
                    <button 
                        onClick={() => onChangeSelection(file)}
                        style={{width: elemWidth - 4 - 4}}
                        className={
                            `overflow-hidden h-6 flex flex-row justify-start items-center 
                            ${isSelected && 'text-amber-500'} text-xs
                            px-2 hover:bg-zinc-200 truncate`
                        }
                    >
                        <p
                            className="truncate text-left" 
                            style={{width: elemWidth - 4 - 16}}
                        >{file.name}</p>
                    </button>
                </div>
                )
            })}
            {
            files.length === 0 && <div className="h-full w-full flex flex-col justify-center items-center">
                <h1 className="italic font-light text-gray-500">No Image Found</h1>
            </div>
            }
        </div>
        <div className="w-full">
            
            <h1
                onClick={() => setBoxListHeight(h => h === 0 ? 200 : 0)}
                className="text-sm font-extralight w-full pl-2 mb-2 text-white bg-amber-500 hover:cursor-pointer "
            >
                BOUNDING-BOXES
            </h1>
        </div>
        <div 
            className="w-full flex flex-col overflow-y-scroll transition-all"
            style={{height: boxListHeight}}
        >
            {
                boxes?.map((box, index) => 
                    <BoxEntry
                        box={box}
                        key={index}
                        editing={editingBoxId === box.boxId}
                        onBoxClick={() => onBoxClick && onBoxClick(box)}
                        onSave={val => {
                            onBoxLabelEdit && onBoxLabelEdit(box.boxId, val)
                            setEditingBoxId(null)
                        }}
                        onBoxDoubleClick={box => setEditingBoxId(box.boxId)}
                    />
                )
            }
        </div>
    </div>
    )
}

const BoxEntry = ({
    box,
    onBoxClick,
    onBoxDoubleClick,
    editing,
    onSave
}: {
    box: ImageBoundingBox
    onBoxClick: (box: ImageBoundingBox) => void
    onBoxDoubleClick: (box: ImageBoundingBox) => void
    onSave?: (value: string) => void
    editing?: boolean 
}) => {

    const [ value, setValue] = useState(box.label ?? '')

    useEventListener('keypress', e => {
        if(e.key === 'enter' && editing) {
            onSave && onSave(value)
        }
    })

    useEffect(() => {
        if(!editing) setValue(box.label ?? '')
    }, [editing])

    return (
        <div className="flex flex-row justify-start items-center">
            { !editing &&
                <button 
                    onClick={() => onBoxClick(box)} 
                    onDoubleClick={() => onBoxDoubleClick(box)}
                >
                    <h1>{box.label || `box_${box.boxId}`}</h1>
                </button>
            }
            { editing &&
            <>
                <form onSubmit={() => onSave && onSave(value)}>
                    <input 
                        value={value}
                        onChange={e => setValue(e.target.value)}
                    />
                </form>
                
            </>
            }
        </div>
    )
}