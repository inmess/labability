import { confirm } from "@tauri-apps/plugin-dialog";
import { useCallback, useEffect, useState } from "react";
import { MdCheckBox, MdCheckBoxOutlineBlank } from "react-icons/md";

interface DetectPaneProps {
    elemWidth: number;
    loadedModel: string;
    onDetect: (threshold?: number) => void;
    onSetLoadedModel: () => void;
}

export default function DetectPane(props: DetectPaneProps) {
    const { 
        elemWidth,
        loadedModel,
        onDetect,
        onSetLoadedModel
    } = props;

    const [ defaultAgree, setDefaultAgree ] = useState(false)
    const [ threshold, setThreshold ] = useState(0.7)

    const [ inputThreshold, setInputThreshold ] = useState('')

    useEffect(() => {
        setInputThreshold(threshold.toString())
    }, [threshold])

    const onDetectClick = useCallback(async () => {
        if(defaultAgree) return onDetect(threshold)
        const agree = await confirm(
            'Are you sure to detect? It may takes a while.', 
            { title: 'Confirm Detection' }
        )
        if(!agree) return;
        onDetect(threshold)
    }, [defaultAgree, onDetect, threshold])

    return (
    <div className="h-full flex flex-col justify-start items-center bg-zinc-100 overflow-y-scroll p-1" style={{width: elemWidth}}>
        <h1 className="text-sm font-extralight w-full pl-2 mb-2 text-white bg-amber-500">DETECT</h1>
        <div className="h-full w-full flex flex-col justify-center items-center">
            <div className="
                rounded-lg border border-amber-400 w-full p-2
                flex flex-col justify-center items-center
            ">
                <h1 className="font-bold text-amber-600">Loaded Model</h1>
                <h1 className="underline font-semibold">{loadedModel.split('/')?.pop()?.split('\\').pop()}</h1>
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
                value={threshold} 
                step={0.01}
                style={{
                }}
                onChange={e => setThreshold(parseFloat(e.target.value))}
                className=" w-2/3 bg-amber-400 text-amber-500
                rounded-lg appearance-none cursor-pointer"
            />
            <form onSubmit={e => {
                e.preventDefault()
                if(isNaN(parseFloat(inputThreshold))) return
                if(parseFloat(inputThreshold) > 1) return setThreshold(1)
                if(parseFloat(inputThreshold) < 0) return setThreshold(0)
                setThreshold(parseFloat(inputThreshold))
            }}>
                <input
                    id='threshold'
                    value={inputThreshold}
                    onChange={e => setInputThreshold(e.target.value)}
                    className="appearance-none text-center align-middle bg-transparent focus:ring-0 focus:outline-none"
                />
            </form>
        </div>
        <button 
            onClick={() => setDefaultAgree(a => !a)} 
            className="mt-5 flex flex-row items-center mb-5"
        >
            {
            defaultAgree 
                ? <MdCheckBox className="text-amber-500" size={25} />
                : <MdCheckBoxOutlineBlank className="text-amber-700" size={25} />
            }
            <h1 className="text-black font-light">Default Agree</h1>
        </button>
    </div>
    )
}