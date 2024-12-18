import { confirm } from "@tauri-apps/plugin-dialog";
import { useCallback, useEffect, useState } from "react";
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
        <div className="h-full" style={{width: elemWidth}}>
            <h1 className="">No Detection Config</h1>
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
            <div className="
                rounded-lg border border-amber-400 w-full p-2
                flex flex-col justify-center items-center
            ">
                <h1 className="font-bold text-amber-600">Loaded Model</h1>
                <h1 className="underline font-semibold">{detectionConfig.loadedModel?.split('/')?.pop()?.split('\\').pop()}</h1>
                <button className="mt-2 bg-amber-500 text-white font-extralight px-4 p-2 rounded-xl" onClick={onSetLoadedModel}>Select Model</button>
            </div>
            <button 
                className="mt-5 border border-amber-500 p-3 px-6 rounded-xl" 
                onClick={onDetectClick}
            >Detect</button>
            <h1 className="text-amber-500 font-extralight mt-5">Threshold</h1>
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
                className=" w-2/3 bg-amber-400 text-amber-500
                rounded-lg appearance-none cursor-pointer"
            />
            <h1>{detectionConfig.probThreshold}</h1>
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
                ? <MdCheckBox className="text-amber-500" size={25} />
                : <MdCheckBoxOutlineBlank className="text-amber-700" size={25} />
            }
            <h1 className="text-black font-light">Default Agree</h1>
        </button>
    </div>
    )
}