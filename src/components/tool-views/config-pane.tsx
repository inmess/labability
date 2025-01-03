import { LabelColor, WorkspaceConfig } from "@/hooks/useWorkConfig"
// import Input from "@/components/common/input"
import { BiFolderOpen } from "react-icons/bi"

type ConfigPaneProps = {
    config: WorkspaceConfig | null
    setConfig: (config: WorkspaceConfig) => void
    setModel: () => void
    elemWidth: number
}

// const LabelFieldsConfig = (props: {
//     labelName: string
//     labelFields: string[]
//     onChangeLabelName: (value: string) => void
//     onChangeLabelFields: (value: string[]) => void
// }) => {
//     const {
//         labelName, 
//         labelFields, 
//         onChangeLabelName, 
//         onChangeLabelFields
//     } = props
//     return (
//         <div className="flex flex-col w-full my-1 rounded-xl border border-gray-500 p-4">
//             <Input 
//                 className="font-semibold p-0 text-xl mb-3
//                 border-black border-b focus:ring-0
//                 focus:border-b py-1 rounded-none bg-transparent"
//                 placeholder="Label Title"
//                 value={labelName} 
//                 onChange={onChangeLabelName} 
//             />
//             {labelFields.map((field, index) => (
//                 <div
//                     key={index}
//                     className="flex flex-row justify-between items-center"
//                 >
//                     <div className="rounded-full w-2 h-2 border bg-amber-300 border-gray-500 mr-3" />
//                     <Input 
//                         value={field}
//                         placeholder="Label Option"
//                         onChange={(value) => {
//                             const newFields = [...labelFields]
//                             newFields[index] = value
//                             onChangeLabelFields(newFields)
//                         }}
//                     />
//                 </div>
//             ))}
//             <button
//                 onClick={() => {
//                     onChangeLabelFields([...labelFields, ''])
//                 }}
//             >Add Field</button>
//         </div>
//     )
// }

export default function ConfigPane(props: ConfigPaneProps) {
    const { 
        config, 
        setConfig,
        elemWidth,
        setModel
    } = props

    if(!config) return (
        <div className="h-full w-full flex flex-col justify-center items-center">
            <h1 className="italic font-light text-gray-500">No Workspace Loaded</h1>
        </div>
    )

    return (
        <div className="h-full flex flex-col bg-zinc-100 overflow-y-scroll" style={{width: elemWidth}}>
            <div className="p-4 border-b border-zinc-300">
                <h1 className="text-lg font-extralight">Configuration</h1>
            </div>
            <div className="p-2 pt-0 flex flex-col gap-2">
                <div className="flex flex-col justify-start items-start border-b border-zinc-300 py-2">
                    <h1 className="mb-1 font-extralight text-sm">Box stroke color</h1>
                    <div className="flex flex-row justify-start items-center">
                        {Object.keys(LabelColor).map((color, idx) => (
                            <button 
                                key={idx}
                                className={`
                                    rounded-full w-4 h-4 border border-gray-500 mx-1
                                    ${
                                        config.boxOptions.color === LabelColor[color as keyof typeof LabelColor] 
                                        && ' outline outline-1 outline-blue-600'
                                    }
                                `}
                                style={{backgroundColor: LabelColor[color as keyof typeof LabelColor]}}
                                onClick={() => {
                                    setConfig({
                                        ...config,
                                        boxOptions: {
                                            color: LabelColor[color as keyof typeof LabelColor]
                                        }
                                    })
                                }}
                            />
                        ))}
                    </div>
                </div>
                <div 
                    className="flex flex-col justify-center items-center border-b border-zinc-300 p-2"
                >
                    <h1 className="mb-1 font-extralight text-sm self-start">Object Detecion Model</h1>
                    <h1 className="italic font-light my-3 flex justify-center items-center">
                        <BiFolderOpen size={20} className="inline-block mr-1" />
                        {
                        config.detection.loadedModel?.split('/')?.pop()?.split('\\').pop() 
                            ?? 'No Model Loaded'
                        }
                    </h1>
                    <button
                        className="border-amber-500 text-amber-500 
                        border-2 hover:border-amber-600 hover:text-amber-600
                        font-light p-2 rounded-md text-xs"
                        onClick={setModel}
                    >
                        Load YOLOv8 Model
                    </button>
                </div>
                {/* <div className="flex flex-col justify-between items-center">
                    {
                        config.imageLabelOptions.map(({labelTitle, labelOptions}, idx) => (
                            <LabelFieldsConfig 
                                key={idx}
                                labelName={labelTitle}
                                labelFields={labelOptions}
                                onChangeLabelName={(value) => {
                                    setConfig({
                                        ...config,
                                        imageLabelOptions: config.imageLabelOptions.map((label, index) => {
                                            if(index === idx) {
                                                return {
                                                    labelTitle: value,
                                                    labelOptions: label.labelOptions
                                                }
                                            }
                                            return label
                                        })
                                    })
                                }}
                                onChangeLabelFields={(value) => {
                                    setConfig({
                                        ...config,
                                        imageLabelOptions: config.imageLabelOptions.map((label, index) => {
                                            if(index === idx) {
                                                return {
                                                    labelTitle: label.labelTitle,
                                                    labelOptions: value
                                                }
                                            }
                                            return label
                                        })
                                    })
                                }}
                            />
                        ))
                    }
                    <button
                        onClick={() => {
                            setConfig({
                                ...config,
                                imageLabelOptions: [
                                    ...config.imageLabelOptions,
                                    {
                                        labelTitle: '',
                                        labelOptions: ['']
                                    }
                                ]
                            })
                        }}
                    >Add Label</button>
                </div> */}
            </div>
        </div>
    )

}

