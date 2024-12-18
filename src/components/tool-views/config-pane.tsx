import { WorkspaceConfig } from "@/hooks/useWorkConfig"
import Input from "@/components/common/input"

type ConfigPaneProps = {
    config: WorkspaceConfig | null
    setConfig: (config: WorkspaceConfig) => void
    setModel: () => void
    elemWidth: number
}

const LabelFieldsConfig = (props: {
    labelName: string
    labelFields: string[]
    onChangeLabelName: (value: string) => void
    onChangeLabelFields: (value: string[]) => void
    // onAddLabelField: (value: string) => void
}) => {

    const {
        labelName, 
        labelFields, 
        onChangeLabelName, 
        onChangeLabelFields
    } = props


    return (
        <div className="flex flex-col w-full my-1 rounded-xl border border-gray-500 p-4">
            <Input 
                className="font-semibold p-0 text-xl mb-3
                border-black border-b focus:ring-0
                focus:border-b py-1 rounded-none bg-transparent"
                placeholder="Label Title"
                value={labelName} 
                onChange={onChangeLabelName} 
            />
            {labelFields.map((field, index) => (
                <div
                    key={index}
                    className="flex flex-row justify-between items-center"
                >
                    <div className="rounded-full w-2 h-2 border bg-amber-300 border-gray-500 mr-3" />
                    <Input 
                        value={field}
                        placeholder="Label Option"
                        onChange={(value) => {
                            const newFields = [...labelFields]
                            newFields[index] = value
                            onChangeLabelFields(newFields)
                        }}
                    />
                </div>
            ))}
            <button
                onClick={() => {
                    onChangeLabelFields([...labelFields, ''])
                }}
            >Add Field</button>
        </div>
    )
}

export default function ConfigPane(props: ConfigPaneProps) {
    const { 
        config, 
        setConfig,
        elemWidth,
        setModel
    } = props

    if(!config) return (
        <div>
            <h1>No Workspace Loaded</h1>
        </div>
    )

    return (
        <div className="h-full flex flex-col bg-zinc-100 overflow-y-scroll" style={{width: elemWidth}}>
            <div className="p-4 border-b border-zinc-300">
                <h1 className="text-lg font-extralight">Configuration</h1>
            </div>
            <div className="p-2 flex flex-col gap-2">
                <div className="flex flex-col justify-between items-center">
                    <h1>
                        {
                        config.detection.loadedModel?.split('/')?.pop()?.split('\\').pop() 
                            ?? 'No Model Loaded'
                        }
                    </h1>
                    <button
                        className="border-amber-500 text-amber-500 
                        border-2 active:border-amber-400 active:text-amber-400
                        font-light p-2 rounded-xl"
                        onClick={setModel}
                    >Load YOLOv8 Model</button>
                </div>
                <div className="flex flex-col justify-between items-center">
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
                </div>
            </div>
        </div>
    )

}

