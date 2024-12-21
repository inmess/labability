import { confirm } from "@tauri-apps/plugin-dialog";
import { useCallback } from "react";
import { AiOutlineAim } from "react-icons/ai";
import { BiFolderOpen } from "react-icons/bi";
import { MdCheckBox, MdCheckBoxOutlineBlank } from "react-icons/md";

interface DetectPaneProps {
    elemWidth: number;
    onDetect: (threshold?: number) => void;
    onSetLoadedModel: () => void;
    configDetection?: (detection: {
        defaultAgree?: boolean,
        probThreshold?: number,
        loadedModel?: string
    }) => void;
    detectionConfig?: {
        defaultAgree: boolean,
        probThreshold: number,
        loadedModel: string | null
    }
}

export default function DetectPane(props: DetectPaneProps) {
    const { 
        elemWidth,
        onDetect,
        onSetLoadedModel,
        configDetection,
        detectionConfig
    } = props;

    const onDetectClick = useCallback(async () => {
        if(detectionConfig?.defaultAgree) return onDetect(detectionConfig.probThreshold)
        const agree = await confirm(
            'Are you sure to detect? It may takes a while.', 
            { title: 'Confirm Detection' }
        )
        if(!agree) return;
        onDetect(detectionConfig?.probThreshold)
    }, [detectionConfig, onDetect])

    if (!detectionConfig) return (
        <div className="h-full  flex flex-col justify-center items-center" style={{width: elemWidth}}>
            <h1 className="italic font-light text-gray-500">No Detection Config</h1>
        </div>
    )

    return (
    <div 
        className="h-full flex flex-col justify-start items-center 
        bg-zinc-100 overflow-hidden p-1" 
        style={{width: elemWidth}}
    >
        <h1 className="text-sm font-extralight w-full pl-2 mb-2 text-white bg-amber-500">DETECT</h1>
        <div className="h-full w-full flex flex-col justify-center items-center">
            <div 
                className="flex flex-col w-full justify-center items-center border-b border-zinc-300 p-2"
            >
                <h1 className="mb-1 font-extralight text-sm self-start">Object Detecion Model</h1>
                <h1 className="italic font-light my-3 flex justify-center items-center">
                    <BiFolderOpen size={20} className="inline-block mr-1" />
                    {
                    detectionConfig.loadedModel?.split('/')?.pop()?.split('\\').pop() 
                        ?? 'No Model Loaded'
                    }
                </h1>
                <button
                    className="border-amber-500 text-amber-500 border
                    font-light p-2 rounded-md text-xs px-4"
                    onClick={onSetLoadedModel}
                >
                    Load YOLOv8 Model
                </button>
            </div>
            <h1 className="font-extralight text-sm mt-5">Threshold</h1>
            <input 
                type='range' 
                min={0} 
                max={1} 
                value={detectionConfig.probThreshold} 
                step={0.1}
                onChange={e => {
                    configDetection?.({
                        probThreshold: parseFloat(e.currentTarget.value)
                    })
                }}
                className="m-2 h-1 w-2/3 bg-amber-400 text-amber-500
                rounded-lg appearance-none cursor-pointer"
            />
            <h1 className="text-sm font-light">{detectionConfig.probThreshold}</h1>
            <div 
                className="border-t border-zinc-300 w-full my-3 p-2
                flex justify-center items-center py-4 transition-all"
            >
                <button 
                    className="text-md font-light bg-amber-500 px-4 py-2 
                    hover:scale-105 duration-150
                    flex flex-row justify-center items-center rounded-lg text-white"
                    onClick={onDetectClick}
                >
                    <AiOutlineAim className="mr-2" size={24} />
                    Detect
                </button>
            </div>
        </div>
        <button 
            onClick={() => {
                const prev = detectionConfig.defaultAgree
                configDetection?.({
                    defaultAgree: !prev
                })
            }} 
            className="mt-5 flex flex-row items-center mb-5"
        >
            {
            detectionConfig.defaultAgree 
                ? <MdCheckBox className="text-amber-500" size={18} />
                : <MdCheckBoxOutlineBlank className="text-amber-500" size={18} />
            }
            <h1 className="text-black font-extralight">Default Agree</h1>
        </button>
    </div>
    )
}