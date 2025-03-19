import { ImageAnnotation } from "@/types/basetype";
import { atom } from "jotai";

export type AnnotationsState = Record<string, ImageAnnotation>;

export const annotationAtom = atom<AnnotationsState>({});