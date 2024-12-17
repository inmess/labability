import { ImageAnnotation } from "@/types/basetype";
import { atom } from "jotai";

export const annotationAtom = atom<{ [key: string]: ImageAnnotation }>({});