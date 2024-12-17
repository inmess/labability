import { invoke } from "@tauri-apps/api/core";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { useState, useCallback } from "react";

export const modelAtom = atomWithStorage(
	"model_path_loaded",
	""
)

type InferenceResult = {
    bbox: {
        x1: number;
        x2: number;
        y1: number;
        y2: number;
    },
    label: string;
    prod: number;
}[]

export function useInference() {
	const [ modelPath ] = useAtom(modelAtom)

	const [ detecting, setDetecting ] = useState(false)

	const detect = useCallback(async (path: string) => {
        setDetecting(() => true);
        console.log('ready for inference, model: ', modelPath);
        
        const res: InferenceResult = await invoke('inference_yolov8', 
            {
                inFile: path,
                modelFile: modelPath
            }
        );
        setDetecting(() => false);
        
        return res;
    }, [modelPath])

	return { detecting, detect }
}
