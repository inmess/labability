import { FileEntry, ImageBoundingBox } from "@/types/basetype"
import { annotationAtom } from "@/utils/atoms"
import { useAtom } from "jotai"
import { useRef, useState } from "react"
import Modal from "../common/modal"
import { WorkspaceConfig } from "@/hooks/useWorkConfig"
import { SearchInput } from "../common/search-input"

type FileExplorerProps = {
    onChangeSelection: (path: FileEntry) => void
    selected: FileEntry | null
    files: FileEntry[]
    elemWidth: number
    boxes?: ImageBoundingBox[]
    onBoxClick?: (box: ImageBoundingBox) => void
    onBoxDelete?: (boxId: number) => void
    onBoxClassEdit?: (boxId: number, classId: number) => void
    workspaceConfig?: WorkspaceConfig

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
        onBoxClassEdit,
        workspaceConfig
    } = props

    const [ annotations ] = useAtom(annotationAtom)

    const [ boxListHeight, setBoxListHeight ] = useState(200)

    const [ editingBoxId, setEditingBoxId ] = useState<number | null>(null)

    const classListWithId = workspaceConfig?.classList.map((c, idx) => ({...c, id: idx})) ?? []

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
                        <div
                            className={`rounded-full border ${
                                annotations[file.name] 
                                    ? annotations[file.name].boxes.length > 0 
                                        ? 'bg-green-500' 
                                        : 'bg-amber-500' 
                                    : 'bg-transparent'
                                } w-2 h-2 mr-1 -ml-1
                            `} 
                        />
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
                        classLabel={classListWithId.find(c => c.id === box.class)?.name}
                        onBoxDoubleClick={box => setEditingBoxId(box.boxId)}
                    />
                )
            }
            </div>
        </div>
        <Modal
            isOpen={editingBoxId !== null}
            onClose={() => setEditingBoxId(null)}
            title="Edit Box"
            width="40%"
            height="30%"
        >
            <div className="p-4 h-full w-full flex flex-col justify-center items-center">
                <div className="flex flex-row justify-start items-center">
                    <h1 className="text-sm font-light">Box Class</h1>
                    <SearchInput 
                        placeholder="Search Class"
                        items={classListWithId}
                        itemComponent={({ item }) => (
                            <div className="flex flex-row justify-between items-center w-full hover:bg-gray-200 px-2 py-1">
                                <h1 style={{color: item.color}}>Class ID {item.id}</h1>
                                <h1>{item.name}</h1>
                            </div>
                        )}
                        filterKeys={['name', '#index']}
                        resultKey="name"
                        initialValue={classListWithId.find(c => c.id === boxes?.find(b => b.boxId === editingBoxId)?.class)?.name}
                        onResultClick={cls => {
                            onBoxClassEdit && onBoxClassEdit(editingBoxId!, cls.id)
                            // setEditingBoxId(null)
                        }}
                        emptyMessage={<h1>No Class Found</h1>}
                        className="w-1/3 mx-3 border-"
                    />
                </div>
                <button className="bg-red-500 text-white p-2 rounded-md mt-2" onClick={() => {
                    editingBoxId && onBoxDelete && onBoxDelete(editingBoxId)
                    setEditingBoxId(null)
                }}>
                    Delete Box
                </button>
            </div>
        </Modal>
    </div>
    )
}

const BoxEntry = ({
    box,
    onBoxClick,
    onBoxDoubleClick,
    editing,
    classLabel
    // onDeleteBox,
    // onSave,
}: {
    box: ImageBoundingBox
    onBoxClick: (box: ImageBoundingBox) => void
    onBoxDoubleClick: (box: ImageBoundingBox) => void
    // onSave?: (value: string) => void
    editing?: boolean 
    onDeleteBox?: (boxId: number) => void
    classLabel?: string
}) => {

    const inputRef = useRef<HTMLInputElement>(null)

    // const class_name = 

    return (
        <div className="flex flex-row justify-start items-center text-xs w-full">
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
                <h1 className="w-full text-left truncate">{classLabel?? 'class_' + box.class}_{box.boxId}</h1>
            </button>
        </div>
    )
}