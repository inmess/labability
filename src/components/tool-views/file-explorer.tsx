import { FileEntry, ImageBoundingBox } from "@/types/basetype"
import { useEffect, useRef, useState } from "react"
import { BsTrash } from "react-icons/bs"
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
        onBoxDelete,
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
        <div className="overflow-y-scroll overflow-hidden w-full flex-1">       
            {files.map((file) => {
                const isSelected = selected?.name === file.name
                return(
                <div key={file.name} className="flex flex-row justify-start w-full overflow-hidden">
                    <button 
                        onClick={() => onChangeSelection(file)}
                        className={
                            `overflow-hidden h-6 flex flex-row justify-start items-center 
                            ${isSelected && 'text-amber-500'} text-xs
                            px-2 hover:bg-zinc-200 truncate w-full`
                        }
                    >
                        <p
                            className="truncate text-left" 
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
            className="w-full flex flex-col overflow-hidden transition-all"
            style={{height: boxListHeight}}
        >
            <div className="flex flex-col overflow-y-scroll overflow-hidden w-full ">
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
                        onDeleteBox={onBoxDelete}
                    />
                )
            }
            </div>
        </div>
    </div>
    )
}

const BoxEntry = ({
    box,
    onBoxClick,
    onBoxDoubleClick,
    editing,
    onDeleteBox,
    onSave
}: {
    box: ImageBoundingBox
    onBoxClick: (box: ImageBoundingBox) => void
    onBoxDoubleClick: (box: ImageBoundingBox) => void
    onSave?: (value: string) => void
    editing?: boolean 
    onDeleteBox?: (boxId: number) => void
}) => {

    const inputRef = useRef<HTMLInputElement>(null)

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
        <div 
            className="flex flex-row justify-start items-center text-xs
                         w-full"
        >
            { !editing &&
                <>
                <button 
                    className="flex flex-1 flex-row justify-between items-center 
                    h-full hover:bg-zinc-200 overflow-hidden pl-2  py-1"
                    onClick={() => !editing && onBoxClick(box)}
                    onDoubleClick={() => {
                        if(editing) return null
                        onBoxDoubleClick(box)
                        inputRef.current?.focus()
                    }}
                >
                    <h1 className="w-full text-left truncate">{box.label || `box_${box.boxId}`}</h1>
                </button>
                </>
            }
            { editing &&
            <>
                <form onSubmit={() => onSave && onSave(value)}>
                    <input 
                        ref={inputRef}
                        className="w-full bg-transparent focus:ring-0 focus:outline-none border-b
                        border-amber-500 py-1 pl-2"
                        value={value}
                        onChange={e => setValue(e.target.value)}
                    />

                    
                </form>
                <button 
                    className="w-8 flex justify-center items-center hover:bg-zinc-200 h-full"
                    onClick={() => onDeleteBox && onDeleteBox(box.boxId)}
                >
                    <BsTrash size={16} />
                </button>
            </>
            }
        </div>
    )
}