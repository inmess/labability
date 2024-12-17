import { AiOutlineEye } from "react-icons/ai";
import { PiRectangleDashedDuotone } from "react-icons/pi";
import { TbTopologyRing3 } from "react-icons/tb";

type FloatMenuProps = {
    canvasMode: 'adjust' | 'view'
    onToggleCanvasMode?: () => void
    onFitScreen?: () => void
}

export default function FloatMenu(props: FloatMenuProps) {
    const { 
        canvasMode,
        onToggleCanvasMode,
        onFitScreen
    } = props

    return (
    <div 
        className="absolute top-3 left-3 p-1 py-2
        rounded-full bg-white/20 hover:bg-white/80
        flex flex-col items-center justify-center
         shadow-sm z-10"
    >
        <FloatMenuItem onClick={onToggleCanvasMode}>
            {
                canvasMode === 'adjust' 
                    ? <TbTopologyRing3 size={24}/> 
                    : <AiOutlineEye size={24} />
            }
        </FloatMenuItem>
        <div className="h-[1px] bg-gray-400 w-3/5 my-1" />
        <FloatMenuItem onClick={onFitScreen}>
            <PiRectangleDashedDuotone size={22} />
        </FloatMenuItem>
    </div>
    )
}

const FloatMenuItem = ({
    onClick,
    children,
    className,
}: {
    onClick?: () => void,
    children: React.ReactNode,
    className?: string
}) => (
    <div 
        className={`w-8 h-8 flex justify-center items-center rounded-full
        text-black/50 hover:text-black/90 hover:cursor-pointer
        ${className}`}
        onClick={onClick}
    >
        {children}
    </div>
)