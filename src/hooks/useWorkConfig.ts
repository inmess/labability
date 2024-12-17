import { ImageAnnotation } from "@/types/basetype"
import { useCallback, useEffect, useState } from "react"
import { readTextFile, exists, writeTextFile } from '@tauri-apps/plugin-fs';
import { join } from "@tauri-apps/api/path";
import { useAtom } from "jotai";
import { annotationAtom } from "@/utils/atoms";
import { open } from "@tauri-apps/plugin-dialog";

const CONFIG_FILE = "labability.workspace"

export type WorkspaceConfig = {
	loadedModel: string | null,
	imageLabelOptions: {
		labelTitle: string,
		labelOptions: string[]
	}[]
}

type WorkspaceReservedContent = {
	annotations: { [key: string]: ImageAnnotation }	
} & WorkspaceConfig

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
		// try {
		const isExist = await exists(configPath)
		// } catch (error) {
		if (!isExist) return {
				loadedModel: null,
				imageLabelOptions: [],
				annotations: {}
			} satisfies WorkspaceReservedContent
		// }
		const content = await readTextFile(configPath)
		const config = JSON.parse(content) as WorkspaceReservedContent
		return config
	}

	useEffect(() => {
		loadConfig(workspacePath)
			.then(config => {
				if(!config) return
				setConfig(config)
				setAnnotations(config.annotations)
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
		setConfig(prev => ({
			...prev,
			loadedModel: path,
			imageLabelOptions: prev?.imageLabelOptions || []
		}))

	}, [config, setConfig])

	const saveWorkspace = useCallback(async () => {
		if(!workspacePath) return
		const prevConfig = await loadConfig(workspacePath)
		const content = {
			...prevConfig,
			...config,
			annotations
		}
		const configPath = await join(workspacePath, CONFIG_FILE)
		await writeTextFile(configPath, JSON.stringify(content))
	}, [workspacePath, annotations])

	return { saveWorkspace, config, setConfig, setModel }
}
