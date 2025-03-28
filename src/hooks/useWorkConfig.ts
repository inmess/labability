import { ImageAnnotation } from "@/types/basetype"
import { useCallback, useEffect, useState } from "react"
import { readTextFile, exists, writeTextFile } from '@tauri-apps/plugin-fs';
import { join } from "@tauri-apps/api/path";
import { useAtom } from "jotai";
import { annotationAtom } from "@/utils/atoms";
import { open } from "@tauri-apps/plugin-dialog";
import { merge } from "ts-deepmerge";
import { useInterval } from "usehooks-ts";

const CONFIG_FILE = "labability.workspace"

export enum LabelColor {
	AMBER = 'rgba(245, 158, 12, 1)',
	RED = 'rgba(255, 0, 0, 1)',
}

export const LabelTextColor = {
	[LabelColor.AMBER]: 'black',
	[LabelColor.RED]: 'white'
}

export type WorkspaceConfig = {
	imageLabelOptions: {
		labelTitle: string,
		labelOptions: string[]
	}[],
	detection: {
		probThreshold: number,
		defaultAgree: boolean,
		loadedModel: string | null,
	},
	// boxOptions: {
	// 	color: LabelColor,
	// },
	classList: {
		name: string,
		color: string,
	}[]
}

type WorkspaceReservedContent = {
	annotations: { [key: string]: ImageAnnotation }	
} & WorkspaceConfig

const defaultConfig: WorkspaceReservedContent = {
	imageLabelOptions: [],
	detection: {
		probThreshold: 0.7,
		defaultAgree: false,
		loadedModel: null
	},
	// boxOptions: {
	// 	color: LabelColor.AMBER
	// },
	annotations: {},
	classList: [{
		name: 'class_0',
		color: LabelColor.AMBER
	}]
}

type WorkConfigOptions = {
	workspacePath: string | null
}

export default function useWorkConfig(options: WorkConfigOptions) {
	const { workspacePath } = options

	const [ config, setConfig ] = useState<WorkspaceConfig | null>(null)

	const [ annotations, setAnnotations ] = useAtom(annotationAtom)

	const loadConfig = async (path: string | null): Promise<WorkspaceReservedContent | null> => {
		if(!path) return null
		const configPath = await join(path, CONFIG_FILE)

		const isExist = await exists(configPath)

		if (!isExist) return {
			...defaultConfig
		} satisfies WorkspaceReservedContent

		const content = await readTextFile(configPath)
		const config = JSON.parse(content) as WorkspaceReservedContent
		return config
	}

	useEffect(() => {
		loadConfig(workspacePath)
			.then(config => {
				if(!config) return
				const { annotations, ...configWithoutAnnotations } = config
				setConfig({...configWithoutAnnotations})
				setAnnotations(config?.annotations ?? {})
			})
			.catch(console.log)
	}, [workspacePath])

	const setModel = useCallback(async () => {
		const path = await open({
			multiple: false,
			directory: false,
			filters: [{
				name: '',
				extensions: ['onnx']
			}]
		})
		if(path === null) return
		setConfig(prev => prev ? {
			...prev,
			detection: {
				...prev.detection,
				loadedModel: path,
			},
		}: null)
	}, [config, setConfig])

	const configDetection = useCallback(async ({
		probThreshold,
		defaultAgree,
		loadedModel
	}: {
		probThreshold?: number,
		defaultAgree?: boolean,
		loadedModel?: string
	}) => {
		setConfig(prev => prev ? ({
			...prev,
			detection: {
				loadedModel : loadedModel || prev.detection.loadedModel,
				probThreshold: probThreshold === undefined 
					? prev.detection.probThreshold
					: probThreshold,
				defaultAgree: defaultAgree === undefined
					? prev.detection.defaultAgree
					: defaultAgree
			}
		}): null)
	}, [setConfig])

	const setClassList = useCallback((classList: { name: string, color: string }[]) => {
		setConfig(prev => prev ? ({
			...prev,
			classList
		}): null)
	}, [setConfig])

	const [ modified, setModified ] = useState(false)

	const saveWorkspace = useCallback(async () => {
		if(!workspacePath) return
		const prevConfig = await loadConfig(workspacePath)
		if(!prevConfig || !config) return
		const content = merge.withOptions({
			mergeArrays: false
		}, prevConfig, config, { annotations }) satisfies WorkspaceReservedContent
		const configPath = await join(workspacePath, CONFIG_FILE)
		await writeTextFile(configPath, JSON.stringify(content))
		setModified(false)
	}, [workspacePath, annotations, config, loadConfig])



	const checkModified = useCallback(async () => {
		if(!workspacePath) return false
		const prevConfig = await loadConfig(workspacePath)
		if(!prevConfig && !config) return false
		return JSON.stringify(prevConfig) !== JSON.stringify(merge.withOptions({
			mergeArrays: false
		}, config ?? {}, { annotations }))
		
	}, [workspacePath, config, annotations])

	useInterval(() => {
		checkModified().then(m => {
			if(m !== modified) {
				setModified(modified)
			}
		})
	}, workspacePath ? 1000 : null)

	return { 
		saveWorkspace, 
		config, 
		setConfig, 
		setModel,
		configDetection,
		modified,
		setClassList
	}
}
