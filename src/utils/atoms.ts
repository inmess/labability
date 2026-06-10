import { ImageAnnotation } from "@/types/basetype";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export type AnnotationsState = Record<string, ImageAnnotation>;

export type Language = "en" | "zh-CN";

export const annotationAtom = atom<AnnotationsState>({});

export const languageAtom = atomWithStorage<Language>("labability_language", "en");