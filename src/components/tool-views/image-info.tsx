import { FileEntry } from "@/types/basetype"
import { writeText } from "@tauri-apps/plugin-clipboard-manager"

type ImageInfoProps = {
    meta: {
        width: number,
        height: number,
    },
    labels?: {
        [key: string]: string[]
    },
    file: FileEntry | null,
    elemWidth: number
}

export default function ImageInfo(props: ImageInfoProps) {

    const { meta, labels, file } = props

    if(!file) return (
        <div
            className="h-full"
            style={{ width: props.elemWidth }}
        >
            <h1 className="italic font-extralight" >No Image Selected</h1>
        </div>
    )

    return (
        <div 
            className="h-full px-1"
            style={{ width: props.elemWidth }}
        >
            <h1 className="text-sm font-extralight w-full pl-2 mb-2 text-white bg-amber-500">INFO</h1>
            <div className="flex flex-col justify-start items-start">
                <p className="text-md font-semibold text-gray-700/80 select-text">{file.name}</p>
                <button 
                    className="text-sm font-extralight bg-transparent 
                    px-2 mb-2 text-amber-500 border-amber-500 border
                    hover:text-amber-600 hover:border-amber-600
                    active:text-amber-600 active:border-amber-600"
                    onClick={() => writeText(file.path)}
                >copy path</button>
                <p className="text-xs font-light">WxH </p>
                <p className="text-sm font-light">{meta.width}x{meta.height}</p>
                <div className="flex flex-col justify-start items-start">
                    <h1 className="text-xs font-light">Labels</h1>
                    <div className="flex flex-col justify-start items-start">
                        {Object.keys(labels || {}).map((key) => {
                            return (
                                <div key={key} className="flex flex-col justify-start items-start">
                                    <h1 className="text-xs font-light">{key}</h1>
                                    <div className="flex flex-row justify-start items-start">
                                        {labels && labels[key].map((label, idx) => {
                                            return (
                                                <p key={idx} className="text-xs font-light">{label}</p>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}