export default function FormField({label,children,...p}){return <label className="field"><span>{label}</span>{children||<input {...p}/>}</label>}
