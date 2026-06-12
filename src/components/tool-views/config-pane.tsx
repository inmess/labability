import { WorkspaceConfig } from "@/hooks/useWorkConfig"
// import Input from "@/components/common/input"
import { useI18n } from "@/i18n"
// import { TbTrash } from "react-icons/tb"
import { confirm } from "@tauri-apps/plugin-dialog"
import Modal from "../common/modal"
import { useState } from "react"

const CLASS_COLOR_OPTIONS = [
    "#f59e0b",
    "#ef4444",
    "#3b82f6",
    "#10b981",
    "#f97316",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
]

type ConfigPaneProps = {
    config: WorkspaceConfig | null
    setConfig: (config: WorkspaceConfig) => void
    elemWidth: number
    setClassList: (classList: {name: string, color: string}[]) => void
    onDeleteClass: (classId: number) => void
}


export default function ConfigPane(props: ConfigPaneProps) {
    const { 
        config, 
        // setConfig,
        elemWidth,
        setClassList,
        onDeleteClass,
    } = props

    const { texts } = useI18n()

    const [ classModalOpened, setClassModalOpened ] = useState(-1)

    const [ tempClassConfig, setTempClassConfig ] = useState({
        id: -1,
        name: '',
        color: ''
    })

    if(!config) return (
        <div className="h-full w-full flex flex-col justify-center items-center">
            <h1 className="italic font-light text-gray-500">{texts.config.noWorkspaceLoaded}</h1>
        </div>
    )

    const pickNextClassColor = () => {
        return CLASS_COLOR_OPTIONS[config.classList.length % CLASS_COLOR_OPTIONS.length]
    }

    return (
        <div className="h-full flex flex-col bg-zinc-100 overflow-y-scroll" style={{width: elemWidth}}>
            <div className="p-4 border-b border-zinc-300">
                <h1 className="text-lg font-extralight">{texts.config.title}</h1>
            </div>
            <div className="p-2 pt-0 flex flex-col gap-2">
                <div 
                    className="flex flex-col justify-center items-center border-b border-zinc-300 p-2"
                >
                    <h1 className="mb-1 font-extralight text-sm self-start">{texts.config.classesSection}</h1>
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
                                <div className="flex flex-row items-center overflow-hidden">
                                    <div 
                                        className="w-3 h-3 rounded-full mr-2 border border-zinc-400 shrink-0"
                                        style={{ backgroundColor: cls.color }}
                                    />
                                    <h1 className="italic font-light my-1 flex justify-center items-center truncate">
                                        <div className={
                                            `bg-opacity-50 rounded-md inline-block px-1 mr-1`
                                        }>
                                            <h1 style={{ color: cls.color }} className="text-xs text-opacity-50 font-semibold">{texts.config.classId(idx)}</h1>
                                        </div>
                                        {cls.name}
                                    </h1>
                                </div>
                            </div>
                        ))
                    }
                    <button
                        className="border-amber-500 text-amber-500 
                        border-2 hover:border-amber-600 hover:text-amber-600
                        font-light p-2 rounded-md text-xs mt-2"
                        onClick={() => setClassList([...config.classList, {
                            name: `class_${config.classList.length}`,
                            color: pickNextClassColor()
                        }])}
                    >
                        {texts.config.addClass}
                    </button>
                </div>
            </div>
            <Modal 
                isOpen={classModalOpened > -1}
                onClose={() => setClassModalOpened(-1)}
                title={texts.config.classConfiguration}
                width="500px"
                height="450px"
            >
                <div className="flex flex-col justify-center items-center gap-2">
                    <h1 className="font-light text-sm">{texts.config.className}</h1>
                    <input 
                        type="text" 
                        value={tempClassConfig.name}
                        onChange={(e) => setTempClassConfig({
                            ...tempClassConfig,
                            name: e.target.value
                        })}
                        className="border border-zinc-300 p-1 rounded-md w-1/2"
                    />
                    <h1 className="font-light text-sm">{texts.config.classStrokeColor}
                        
                    </h1>
                    <div className="grid grid-cols-4 gap-3">
                        {CLASS_COLOR_OPTIONS.map(color => (
                            <button
                                key={color}
                                type="button"
                                className={`w-8 h-8 rounded-full border-2 ${tempClassConfig.color === color ? 'border-zinc-900 scale-110' : 'border-zinc-300'}`}
                                style={{ backgroundColor: color }}
                                onClick={() => setTempClassConfig({
                                    ...tempClassConfig,
                                    color,
                                })}
                            />
                        ))}
                    </div>
                    <h1 className="text-xs font-light text-gray-500">{tempClassConfig.color}</h1>
                    
                    <div className="flex flex-row justify-center items-center gap-3 w-full mt-2">
                        <button
                            className="border-amber-500 text-amber-500
                            border-2 hover:border-amber-600 hover:text-amber-600
                            font-light p-2 rounded-md text-xs w-1/3"

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
                            {texts.config.save}
                        </button>
                        <button
                            type="button"
                            disabled={config.classList.length <= 1}
                            className="border-red-500 text-red-500 border-2 disabled:border-zinc-300 disabled:text-zinc-300 hover:border-red-600 hover:text-red-600 font-light p-2 rounded-md text-xs w-1/3"
                            onClick={async () => {
                                if (config.classList.length <= 1) return

                                const agreed = await confirm(
                                    texts.config.deleteClassConfirmMessage,
                                    { title: texts.config.deleteClassConfirmTitle }
                                )
                                if (!agreed) return

                                onDeleteClass(tempClassConfig.id)
                                setClassModalOpened(-1)
                            }}
                        >
                            {texts.config.deleteClass}
                        </button>
                    </div>
                    {config.classList.length <= 1 && (
                        <h1 className="text-xs text-zinc-500">{texts.config.keepOneClassHint}</h1>
                    )}
                </div>
            </Modal>
        </div>
    )

}

