import { ImageAnnotation } from "@/types/basetype"
import { useCallback, useEffect, useMemo, useState } from "react"
import { readTextFile, exists, writeTextFile } from '@tauri-apps/plugin-fs';
import { join } from "@tauri-apps/api/path";
import { useAtom } from "jotai";
import {
	annotationAtom,
	defaultDetectionConfig,
	detectionConfigAtom,
	type DetectionConfig,
} from "@/utils/atoms";
import { open } from "@tauri-apps/plugin-dialog";

const CONFIG_FILE = "labability.workspace"
const AUTO_SAVE_DELAY_MS = 60_000

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

type LegacyWorkspaceReservedContent = WorkspaceReservedContent & {
	detection?: DetectionConfig
}

const defaultConfig: WorkspaceReservedContent = {
	imageLabelOptions: [],
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
	const [ detectionConfig, setDetectionConfig ] = useAtom(detectionConfigAtom)

	const loadConfig = async (path: string | null): Promise<LegacyWorkspaceReservedContent | null> => {
		if(!path) return null
		const configPath = await join(path, CONFIG_FILE)

		const isExist = await exists(configPath)

		if (!isExist) return {
			...defaultConfig
		} satisfies WorkspaceReservedContent

		const content = await readTextFile(configPath)
		const config = JSON.parse(content) as LegacyWorkspaceReservedContent
		return config
	}

	const isDetectionConfigDefault = useCallback((nextConfig: DetectionConfig) => {
		return nextConfig.probThreshold === defaultDetectionConfig.probThreshold
			&& nextConfig.defaultAgree === defaultDetectionConfig.defaultAgree
			&& nextConfig.loadedModel === defaultDetectionConfig.loadedModel
	}, [])

	useEffect(() => {
		if(!workspacePath) {
			setConfig(null)
			setAnnotations({})
			setSavedSnapshot(null)
			setModified(false)
			return
		}

		loadConfig(workspacePath)
			.then(config => {
				if(!config) return
				const { annotations, detection, ...configWithoutAnnotations } = config
				const workspaceContent = {
					...configWithoutAnnotations,
					annotations: annotations ?? {},
				} satisfies WorkspaceReservedContent

				setConfig({...configWithoutAnnotations})
				setAnnotations(config?.annotations ?? {})
				setSavedSnapshot(JSON.stringify(workspaceContent))
				setModified(false)

				if (detection) {
					setDetectionConfig(prev => {
						if (!isDetectionConfigDefault(prev)) return prev
						return detection
					})
				}
			})
			.catch(console.log)
	}, [isDetectionConfigDefault, setAnnotations, setDetectionConfig, workspacePath])

	const setModel = useCallback(async () => {
		const path = await open({
			multiple: false,
			directory: false,
			filters: [{
				name: '',
				extensions: ['onnx']
			}]
		})
		if(typeof path !== 'string') return
		setDetectionConfig(prev => ({
			...prev,
			loadedModel: path,
		}))
	}, [setDetectionConfig])

	const configDetection = useCallback(async ({
		probThreshold,
		defaultAgree,
		loadedModel
	}: {
		probThreshold?: number,
		defaultAgree?: boolean,
		loadedModel?: string
	}) => {
		setDetectionConfig(prev => ({
			loadedModel: loadedModel === undefined ? prev.loadedModel : loadedModel,
			probThreshold: probThreshold === undefined ? prev.probThreshold : probThreshold,
			defaultAgree: defaultAgree === undefined ? prev.defaultAgree : defaultAgree,
		}))
	}, [setDetectionConfig])

	const setClassList = useCallback((classList: { name: string, color: string }[]) => {
		setConfig(prev => prev ? ({
			...prev,
			classList
		}): null)
	}, [setConfig])

	const [ modified, setModified ] = useState(false)
	const [ savedSnapshot, setSavedSnapshot ] = useState<string | null>(null)

	const buildWorkspaceContent = useCallback((nextConfig: WorkspaceConfig | null) => {
		if(!nextConfig) return null

		return {
			...nextConfig,
			annotations,
		} satisfies WorkspaceReservedContent
	}, [annotations])

	const currentWorkspaceContent = useMemo(() => {
		return buildWorkspaceContent(config)
	}, [buildWorkspaceContent, config])

	const currentWorkspaceSnapshot = useMemo(() => {
		if(!currentWorkspaceContent) return null
		return JSON.stringify(currentWorkspaceContent)
	}, [currentWorkspaceContent])

	const saveWorkspace = useCallback(async () => {
		if(!workspacePath || !currentWorkspaceSnapshot) return
		const configPath = await join(workspacePath, CONFIG_FILE)
		await writeTextFile(configPath, currentWorkspaceSnapshot)
		setSavedSnapshot(currentWorkspaceSnapshot)
		setModified(false)
	}, [currentWorkspaceSnapshot, workspacePath])

	useEffect(() => {
		if(!workspacePath || !currentWorkspaceSnapshot || savedSnapshot === null) {
			setModified(false)
			return
		}

		setModified(currentWorkspaceSnapshot !== savedSnapshot)
	}, [currentWorkspaceSnapshot, savedSnapshot, workspacePath])

	useEffect(() => {
		if(
			!workspacePath
			|| !modified
			|| !currentWorkspaceSnapshot
			|| currentWorkspaceSnapshot === savedSnapshot
		) {
			return
		}

		const timerId = window.setTimeout(() => {
			saveWorkspace().catch(console.error)
		}, AUTO_SAVE_DELAY_MS)

		return () => {
			window.clearTimeout(timerId)
		}
	}, [currentWorkspaceSnapshot, modified, saveWorkspace, savedSnapshot, workspacePath])

	return { 
		saveWorkspace, 
		config, 
		setConfig, 
		setModel,
		configDetection,
		detectionConfig,
		modified,
		setClassList
	}
}
