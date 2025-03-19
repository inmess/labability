
type InputProps = {
    onChange: (value: string) => void,
    value: string,
    placeholder?: string,
    className?: string,
    disabled?: boolean
    onFocus?: () => void
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>
}

export default function Input(props: InputProps) {
    const { onChange, value, placeholder, className, inputProps } = props
    return (
            <input 
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                
                className={
                    `p-1 px-2 my-1 border-zinc-300 rounded-lg 
                    w-full text-sm font-light outline-none border-0
                    focus:outline-0 focus:border-0 focus:ring-1
                    focus:ring-amber-500
                    ${className}`
                }
                {...inputProps}
            />
    )
}