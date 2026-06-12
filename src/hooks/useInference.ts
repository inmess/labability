import { invoke } from "@tauri-apps/api/core";
import { useAtom } from "jotai";
import { detectionConfigAtom } from "@/utils/atoms";
import { useState, useCallback } from "react";

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
	const [ detectionConfig ] = useAtom(detectionConfigAtom)

	const [ detecting, setDetecting ] = useState(false)

	const detect = useCallback(async (path: string) => {
        setDetecting(() => true);
        console.log('ready for inference, model: ', detectionConfig.loadedModel);
        
        const res: InferenceResult = await invoke('inference_yolov8', 
            {
                inFile: path,
                modelFile: detectionConfig.loadedModel
            }
        );
        setDetecting(() => false);
        
        return res;
    }, [detectionConfig.loadedModel])

	return { detecting, detect }
}
