import { AiOutlineClose } from 'react-icons/ai'

type ModalProps = {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
    width: string
    height: string
    style?: React.CSSProperties
}

export default function Modal(props: ModalProps) {
    const { 
        isOpen, 
        onClose, 
        title, 
        children, 
        width, 
        height, 
        style 
    } = props

    return (
        <div 
            id="modal"
            className={`fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-50 z-50 ${isOpen ? '' : 'hidden'}`}
        >
            <div 
                className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white z-50 shadow-lg rounded-lg`}
                style={{ width: width, height: height, ...style }}
            >
                <div 
                    className="flex flex-row justify-between items-center p-2 border-b"
                >
                    <h1 className="text-lg font-light">{title}</h1>
                    <button 
                        onClick={onClose}
                        className="text-gray-500"
                    >
                        <AiOutlineClose size={24} />
                    </button>
                </div>
                <div className="p-2">
                    {children}
                </div>
            </div>
        </div>
    )
}