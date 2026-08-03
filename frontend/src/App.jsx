import { BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
//import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'


function App() {


  return (
    <Router>
      <Routes>
        {/* REDIRIGIR LA RUTA RAIZ ALA RUTA DE LOGIN*/}
        <Route path='/' element={<Navigate to="/login"/>} />

        {/* RUTA PARA LA PAGINA DE LOGIN */}
        <Route path='/login' element={<Login/>} />

        {/* RUTA PARA EL DASHBOARD DESPUES DE LOGUEARSE */}
        <Route path='/dashboard' element={<Dashboard/>} />
      </Routes>
    </Router>
  )
}

export default App
