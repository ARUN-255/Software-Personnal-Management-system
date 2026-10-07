export default function Topbar({title,subtitle,actions}){return <header className="top"><div><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div>{actions&&<div>{actions}</div>}</header>}
