import { ReactNode } from "react"


type SideBarProps = {
    actions: {
        onPressAction: () => void,
        icon: () => ReactNode,
        isActive?: boolean
    }[],
    indicators: {
        element: () => ReactNode,
    }[]
}

export default function SideBar(props: SideBarProps) {
    const { actions, indicators } = props
    return (
        <div 
            className="h-full w-12 flex flex-col justify-between items-center 
            border-r border-zinc-300 z-10 bg-inherit"
        >
            <div className="flex flex-col items-center">
                {actions.map((action, index) => (
                    <button
                        key={index}
                        onClick={action.onPressAction}
                        className={`w-12 h-12 flex justify-center items-center border-4 border-transparent
                            ${action.isActive ? 'border-l-amber-500' : 'hover:border-l-amber-300'}`}
                    >
                        {action.icon()}
                    </button>
                ))}
            </div>
            <div className="flex flex-col items-center justify-center pb-3">
                {indicators.map((indicator, index) => (
                    <div className="w-12 flex justify-center items-center" key={index}>
                        {indicator.element()}
                    </div>
                ))}
            </div>
        </div>
    )
}