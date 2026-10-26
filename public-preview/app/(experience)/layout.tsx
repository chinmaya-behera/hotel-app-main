import {DemoProvider} from '../../experience/lib/store';
import '../../experience/experience.css';
export default function Layout({children}:{children:React.ReactNode}){return <DemoProvider>{children}</DemoProvider>;}
