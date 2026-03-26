export function GuideTooltip({ text }: { text: string }) {
  return (
    <span className="relative group inline-flex items-center ml-1">
      <span className="cursor-help text-xs text-slate-400 border border-slate-300 rounded-full w-4 h-4 inline-flex items-center justify-center leading-none">
        ?
      </span>
      <span className="absolute left-5 top-0 z-10 hidden group-hover:block w-52 text-xs bg-slate-800 text-white rounded p-2 shadow-lg leading-relaxed whitespace-normal">
        {text}
      </span>
    </span>
  )
}
