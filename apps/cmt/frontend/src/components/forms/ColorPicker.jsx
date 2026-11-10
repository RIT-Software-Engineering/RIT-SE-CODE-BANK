export function ColorOption({ color, setColor, hex, setShowWheel }) {
  const isRainbow = hex === "rainbow"
  return (
    <div
      className="w-8 h-8 cursor-pointer rounded-full"
      style={{
        backgroundColor: !isRainbow ? hex : undefined,
        backgroundImage: isRainbow
          ? "conic-gradient(red, orange, yellow, green, cyan, blue, violet, red)"
          : undefined,
        border: color === hex ? `4px solid color-mix(in oklab, #eee, ${hex}` : '4px solid #eee',
      }}
      onClick={() => {
        if (isRainbow) setShowWheel(showWheel => !showWheel)
        else setShowWheel(false)
        setColor(isRainbow ? "rainbow" : hex)
      }}
    />
  )
}