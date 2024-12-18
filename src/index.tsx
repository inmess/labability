import Annotator, { AnnotatorRef } from "@/components/annotator";
import FloatMenu from "@/components/float-menu";
import SideBar from "@/components/side-bar";
import {
	ConfigPane,
	DetectPane,
	FileExplorer,
	ImageInfo
}from "@/components/tool-views";
import useImgDir from "@/hooks/useImgDir";
import useWorkConfig from "@/hooks/useWorkConfig";
import { FileEntry } from "@/types/basetype";
import { annotationAtom } from "@/utils/atoms";
import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { useAtom } from "jotai";
import { 
	useCallback, 
	useEffect, 
	useMemo, 
	useRef, 
	useState 
} from "react";
import { AiOutlineAim } from "react-icons/ai";
import { BiSave } from "react-icons/bi";
import { GoGear, GoInfo } from "react-icons/go";
import { VscFiles } from "react-icons/vsc";
import { useImageSize } from "react-image-size";
import { useEventListener } from "usehooks-ts";

const TOOLBAR_MAX_WIDTH = 500
const TOOLBAR_MIN_WIDTH = 200

type AnnotatorState = {
	files: {
		fileList: FileEntry[]
		selectedFile: FileEntry | null
		listState: {
			[key: string]: {
				viewed: boolean
				labeled: boolean
			}
		}
	},
}

export default function App() {

	const [ version, setVersion ] = useState('')

	useEffect(() => {
		getVersion().then(setVersion)
	})

	const [ detecting, setDetecting ] = useState(false)
	const [ mode, setMode ] = useState<'adjust' | 'view'>('view')
	const [ toolBarWidth, setToolBarWidth ] = useState(TOOLBAR_MIN_WIDTH)
	const [ draggingToolBar, setDraggingToolBar ] = useState(false)
	const {
		dir, 
		files,
		openImgDir,
		selectedFile,
		setSelectedFile,
		nextFile,
		prevFile,
		closeImgDir
	} = useImgDir()

	const {
		config,
		saveWorkspace,
		setConfig,
		setModel,
		configDetection
	} = useWorkConfig({
		workspacePath: dir
	})
 
	const [ dimensions ] = useImageSize(selectedFile?.src || '')

	const [ annotations, setAnnotations ] = useAtom(annotationAtom)

	const boxes = useMemo(() => annotations[selectedFile?.name || '']?.boxes || [], [annotations, selectedFile])

	const width = dimensions?.width || 0
	const height = dimensions?.height || 0

	const [ fileState, setFileState ] = useState<{
        [key: string]: {
            viewed: boolean,
            labeled: boolean
        }
    }>({})

	useEffect(() => {
		if(files.length === 0) return
		const fileState = files.reduce((acc, file) => {
			acc[file.name] = {
				viewed: false,
				labeled: false
			}
			return acc
		}, {} as {
			[key: string]: {
				viewed: boolean,
				labeled: boolean
			}
		})

		setFileState(fileState)
	}, [files])

	const state = useMemo<AnnotatorState>(() => ({
		files: {
			fileList: files,
			selectedFile,
			listState: fileState
		}
	}), [files, fileState, selectedFile])

	const toolBarRef = useRef<HTMLDivElement>(null)
	const annotatorContainerRef = useRef<HTMLDivElement>(null)
	const annotatorRef = useRef<AnnotatorRef>(null)

	const inference = useCallback(async (threshold = 0) => {

		if (!config) return console.log('no config')

		if (!config.detection) return console.log('no model file found')
		
		if (!selectedFile) return console.log('no selected file')

		setDetecting(() => true)

		const res : {
			bbox: {
				x1: number,
				y1: number,
				x2: number,
				y2: number
			},
			class: number,
			prob: number
		}[] = await invoke('inference_yolov8', {
			model: config?.detection.loadedModel,
			imagePath: selectedFile?.path
		})

		const currentMaxId = boxes.reduce((acc, box) => box.boxId > acc ? box.boxId : acc, 0)

		const new_boxes = res.filter(detection => {
			return detection.prob > threshold
		}).map((detection, idx) => ({
			top: detection.bbox.y1,
			left: detection.bbox.x1,
			width: detection.bbox.x2 - detection.bbox.x1,
			height: detection.bbox.y2 - detection.bbox.y1,
			label: `Dtc${detection.class}_${idx}_${(detection.prob * 100).toFixed(0)}`,
			boxId: currentMaxId + idx + 1
		}))

		setAnnotations({
			...annotations,
			[selectedFile.name]: {
				...annotations[selectedFile.name],
				boxes: [
					...boxes,
					...new_boxes
				]
			}
		})
		console.log(res);
		setDetecting(() => false)
	}, [selectedFile, config, boxes])

	useEventListener('mousemove', e => {
		if (!draggingToolBar) return
		// plus 1 to keep hover effect
		let newWidth = e.clientX - toolBarRef.current?.offsetLeft! + 1
		newWidth = newWidth < TOOLBAR_MIN_WIDTH ? TOOLBAR_MIN_WIDTH : newWidth
		newWidth = newWidth > TOOLBAR_MAX_WIDTH ? TOOLBAR_MAX_WIDTH : newWidth
		setToolBarWidth(newWidth)
	})

	useEventListener('mouseup', () => {
		setDraggingToolBar(false)
	})

	useEventListener('keydown', e => {
		if(e.key === 'ArrowDown') nextFile()
		if(e.key === 'ArrowUp') prevFile()
		if(e.key === 'Alt') {
			setMode('adjust')
		}
	})

	useEventListener('keyup', e => {
		if(e.key === 'Alt') {
			setMode('view')
		}
	})

	const toolBarViews = {
		'file-explorer': (state: AnnotatorState) => (
			<FileExplorer 
				files={state.files.fileList}
				selected={state.files.selectedFile} 
				onChangeSelection={fe => setSelectedFile(fe)}
				elemWidth={toolBarWidth}
				boxes={boxes}
				onBoxClick={box => {
					if(!annotatorRef.current) console.log('annotator not ready');
					
					annotatorRef.current?.zoomToBox(box)
				}}
				onBoxLabelEdit={(boxId, value) => {
					if(!selectedFile) return
					const next = boxes.map(b => b.boxId === boxId ? {
						...b,
						label: value
					} : b)
					setAnnotations({
						...annotations,
						[selectedFile.name]: {
							...annotations[selectedFile.name],
							boxes: next,
						}
					})
				}}
			/>
		),
		'image-info': () => (
			<ImageInfo 
				elemWidth={toolBarWidth}
				meta={{width, height}}
				file={selectedFile}
			/>
		),
		'config': () => (
			<ConfigPane 
				elemWidth={toolBarWidth}
				config={config}
				setConfig={setConfig}
				setModel={setModel}
			/>
		),
		'detect': () => (
			<DetectPane
				elemWidth={toolBarWidth}
				detectionConfig={config?.detection}
				configDetection={configDetection}
				onDetect={inference}
				onSetLoadedModel={setModel}
			/>
		)
	}

	const [ activated, setActivated ] = useState<keyof typeof toolBarViews | null>(null)

	const onToolBarAction = useCallback((action: keyof typeof toolBarViews) => {
		if(activated === action) return setActivated(null)
		setActivated(action)
	}, [activated])

	const siderActions = [
		{
			onPressAction: () => onToolBarAction('file-explorer'),
			isActive: activated === 'file-explorer',
			icon: () => <VscFiles size={24} />
		},
		{
			onPressAction: () => onToolBarAction('image-info'),
			isActive: activated === 'image-info',
			icon: () => <GoInfo size={25} />
		},
		{
			onPressAction: () => onToolBarAction('config'),
			isActive: activated === 'config',
			icon: () => <GoGear size={24} />
		},
		{
			onPressAction: () => onToolBarAction('detect'),
			isActive: activated === 'detect',
			icon: () => <AiOutlineAim size={24} />
		},
		{
			onPressAction: saveWorkspace,
			isActive: false,
			icon: () => <BiSave size={24} />
		}
	]

	return (
	<main 
		className={
			`flex flex-1 flex-row justify-start items-center 
			${draggingToolBar ? 'cursor-col-resize' : ''} overflow-hidden
			overscroll-none
			h-screen w-screen bg-zinc-100 select-none`
		}
	>
		{ 
		detecting 
		&& <div 
			className="absolute top-0 left-0 w-screen h-screen 
			bg-gray-500/70 bg-opacity-50 flex justify-center items-center z-50"
		>
			<h1 className="text-white">Detecting...</h1>
		</div>
		}
		<SideBar
			actions={siderActions}
			indicators={[
				{
					element: () => dir ? (
						<div 
							className="flex flex-col justify-center items-center
							hover:bg-gray-200 hover:cursor-pointer w-full py-2"
							onClick={closeImgDir}
						>
							<h1 className="font-normal text-xs">Close</h1>
							<h1 className="font-normal text-xs">Folder</h1>
						</div>
					): <></>
				},
				{
					element: () => (
						<div className="flex flex-col">
							<h1 className="font-normal text-xs">Ver.</h1>
							<h1 className="italic font-normal text-xs">{version}</h1>
						</div>
					)
				}
			]}
		/>
		{
			activated && 
			<div 
				ref={toolBarRef} 
				className="h-full flex flex-row justify-start items-center z-10 bg-inherit"
				style={{width: toolBarWidth}}
			>
				<div className="flex-1 h-full" style={{width: toolBarWidth - 4}}>
				{activated && toolBarViews[activated](state)}
				</div>
				<div
					onMouseDown={() => setDraggingToolBar(true)} 
					className={
						`h-full w-1 delay-150 duration-300
						hover:cursor-col-resize hover:bg-gray-400 z-50
						${draggingToolBar && 'bg-gray-400'}`
					}
				/>
			</div>
		}
		<div 
			className="flex flex-1 flex-col justify-center items-center 
			w-full h-full relative bg-gray-300"
			ref={annotatorContainerRef}
		>
			<FloatMenu 
				canvasMode={mode} 
				onToggleCanvasMode={() => setMode(a => a === 'view' ? 'adjust': 'view')} 
				onFitScreen={() => annotatorRef.current?.resizeContent()}
			/>
			{ !dir && <>
				<h1>Welcome to Labability v2</h1>
				<button onClick={async () => {
					await openImgDir()
					setActivated('file-explorer')
				}}>Open Image Directory</button>
			</>}
			{
				selectedFile && <Annotator
					ref={annotatorRef}
					image={selectedFile} 
					containerRef={annotatorContainerRef}
					mode={mode}
					imageInfo={{
						width, height
					}}
				/>
			}
		</div>
	</main>
	)
}
