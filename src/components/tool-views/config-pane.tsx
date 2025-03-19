import { WorkspaceConfig } from "@/hooks/useWorkConfig"
// import Input from "@/components/common/input"
import { BiFolderOpen } from "react-icons/bi"
// import { TbTrash } from "react-icons/tb"
import Modal from "../common/modal"
import { useState } from "react"

type ConfigPaneProps = {
    config: WorkspaceConfig | null
    setConfig: (config: WorkspaceConfig) => void
    setModel: () => void
    elemWidth: number
    setClassList: (classList: {name: string, color: string}[]) => void
}


export default function ConfigPane(props: ConfigPaneProps) {
    const { 
        config, 
        // setConfig,
        elemWidth,
        setModel,
        setClassList
    } = props

    const [ classModalOpened, setClassModalOpened ] = useState(-1)

    const [ tempClassConfig, setTempClassConfig ] = useState({
        id: -1,
        name: '',
        color: ''
    })

    if(!config) return (
        <div className="h-full w-full flex flex-col justify-center items-center">
            <h1 className="italic font-light text-gray-500">No Workspace Loaded</h1>
        </div>
    )

    return (
        <div className="h-full flex flex-col bg-zinc-100 overflow-y-scroll" style={{width: elemWidth}}>
            <div className="p-4 border-b border-zinc-300">
                <h1 className="text-lg font-extralight">Configuration</h1>
            </div>
            <div className="p-2 pt-0 flex flex-col gap-2">
                {/* <div className="flex flex-col justify-start items-start border-b border-zinc-300 py-2">
                    <h1 className="mb-1 font-extralight text-sm">Box stroke color</h1>
                    <div className="flex flex-row justify-start items-center">
                        {Object.keys(LabelColor).map((color, idx) => (
                            <button 
                                key={idx}
                                className={`
                                    rounded-full w-4 h-4 border border-gray-500 mx-1
                                    ${
                                        config.boxOptions.color === LabelColor[color as keyof typeof LabelColor] 
                                        && ' outline outline-1 outline-blue-600'
                                    }
                                `}
                                style={{backgroundColor: LabelColor[color as keyof typeof LabelColor]}}
                                onClick={() => {
                                    setConfig({
                                        ...config,
                                        boxOptions: {
                                            color: LabelColor[color as keyof typeof LabelColor]
                                        }
                                    })
                                }}
                            />
                        ))}
                    </div>
                </div> */}
                <div 
                    className="flex flex-col justify-center items-center border-b border-zinc-300 p-2"
                >
                    <h1 className="mb-1 font-extralight text-sm self-start">Object Detecion Model</h1>
                    <h1 className="italic font-light my-3 flex justify-center items-center">
                        <BiFolderOpen size={20} className="inline-block mr-1" />
                        {
                        config.detection.loadedModel?.split('/')?.pop()?.split('\\').pop() 
                            ?? 'No Model Loaded'
                        }
                    </h1>
                    <button
                        className="border-amber-500 text-amber-500 
                        border-2 hover:border-amber-600 hover:text-amber-600
                        font-light p-2 rounded-md text-xs"
                        onClick={setModel}
                    >
                        Load YOLOv8 Model
                    </button>
                </div>
                <div 
                    className="flex flex-col justify-center items-center border-b border-zinc-300 p-2"
                >
                    <h1 className="mb-1 font-extralight text-sm self-start">Object Detecion Model</h1>
                    {
                        config.classList.map((cls, idx) => (
                            <div 
                                key={idx} 
                                className="flex flex-row justify-between items-center w-full hover:cursor-default hover:bg-gray-200"
                                onDoubleClick={() => {
                                    setTempClassConfig({
                                        id: idx,
                                        name: cls.name,
                                        color: cls.color
                                    })
                                    setClassModalOpened(idx)
                                }}
                            >
                                
                                <h1 className="italic font-light my-1 flex justify-center items-center">
                                    <div className={
                                        ` bg-opacity-50 rounded-md inline-block px-1 mr-1`
                                    }>
                                        <h1 style={{ color: cls.color }} className="text-xs text-opacity-50 font-semibold">ID {idx}</h1>
                                    </div>
                                    {cls.name}
                                </h1>
                            </div>
                        ))
                    }
                    <button
                        className="border-amber-500 text-amber-500 
                        border-2 hover:border-amber-600 hover:text-amber-600
                        font-light p-2 rounded-md text-xs mt-2"
                        onClick={() => setClassList([...config.classList, {
                            name: `class_${config.classList.length}`,
                            color: '#000000'
                        }])}
                    >
                        Add Class
                    </button>
                </div>
            </div>
            <Modal 
                isOpen={classModalOpened > -1}
                onClose={() => setClassModalOpened(-1)}
                title="Class Configuration"
                width="500px"
                height="450px"
            >
                <div className="flex flex-col justify-center items-center gap-2">
                    <h1 className="font-light text-sm">Class Name</h1>
                    <input 
                        type="text" 
                        value={tempClassConfig.name}
                        onChange={(e) => setTempClassConfig({
                            ...tempClassConfig,
                            name: e.target.value
                        })}
                        className="border border-zinc-300 p-1 rounded-md w-1/2"
                    />
                    <h1 className="font-light text-sm">Class Stroke Color
                        
                    </h1>
                    {/* <HexColorPicker 
                        color={tempClassConfig.color} 
                        onChange={(color) => setTempClassConfig({
                            ...tempClassConfig,
                            color
                        })}
                    /> */}
                    <h1 className="text-xs font-light text-gray-500 flex justify-center items-center">{tempClassConfig.color}
                        <input
                            type="color"
                            value={tempClassConfig.color}
                            onChange={(e) => setTempClassConfig({
                                ...tempClassConfig,
                                color: e.target.value
                            })}
                            className="inline-block m-1 hover:cursor-pointer"
                        />
                    </h1>
                    
                    <button
                        className="border-amber-500 text-amber-500
                        border-2 hover:border-amber-600 hover:text-amber-600
                        font-light p-2 rounded-md text-xs m-2 w-1/3"

                        onClick={() => {
                            setClassList(config.classList.map((cls, idx) => {
                                if(idx === tempClassConfig.id) {
                                    return tempClassConfig
                                }
                                return cls
                            }))
                            setClassModalOpened(-1)
                        }}
                    >
                        Save
                    </button>
                </div>
            </Modal>
        </div>
    )

}

