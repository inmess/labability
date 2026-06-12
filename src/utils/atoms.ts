import { ImageAnnotation } from "@/types/basetype";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export type AnnotationsState = Record<string, ImageAnnotation>;
export type DetectionConfig = {
	probThreshold: number;
	defaultAgree: boolean;
	loadedModel: string | null;
};

export type Language = "en" | "zh-CN";

export const defaultDetectionConfig: DetectionConfig = {
	probThreshold: 0.7,
	defaultAgree: false,
	loadedModel: null,
};

export const annotationAtom = atom<AnnotationsState>({});

export const detectionConfigAtom = atomWithStorage<DetectionConfig>(
	"labability_detection_settings",
	defaultDetectionConfig,
);

export const languageAtom = atomWithStorage<Language>("labability_language", "en");