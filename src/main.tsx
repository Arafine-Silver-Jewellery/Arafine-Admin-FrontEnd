import { createRoot } from 'react-dom/client'
import './styles/theme.css'
import './styles/ui-kit.css'
import './styles/responsive.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(<App />)
