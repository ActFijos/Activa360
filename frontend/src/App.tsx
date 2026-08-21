import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Bajas } from './pages/Bajas';
import { Activos } from './pages/Activos';
import { Asignacion } from './pages/Asignacion';
import { Transferencias } from './pages/Transferencias';
import { Reportes } from './pages/Reportes';
import { ConfiguracionGeneral } from './pages/ConfiguracionGeneral';
import { ConfiguracionUsuarios } from './pages/ConfiguracionUsuarios';
import { ConfiguracionUnidades } from './pages/ConfiguracionUnidades';
import { ConfiguracionEstados } from './pages/ConfiguracionEstados';
import { ConfiguracionTipos } from './pages/ConfiguracionTipos';
import { Ayuda } from './pages/Ayuda';
import { AsistenteIA } from './pages/AsistenteIA';
import { AgenteMcp } from './pages/AgenteMcp';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="registro" element={<Activos />} />
          <Route path="asignacion" element={<Asignacion />} />
          <Route path="transferencias" element={<Transferencias />} />
          <Route path="bajas" element={<Bajas />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="configuracion/general" element={<ConfiguracionGeneral />} />
          <Route path="configuracion/usuarios" element={<ConfiguracionUsuarios />} />
          <Route path="configuracion/unidades" element={<ConfiguracionUnidades />} />
          <Route path="configuracion/estados" element={<ConfiguracionEstados />} />
          <Route path="configuracion/tipos" element={<ConfiguracionTipos />} />
          <Route path="ayuda" element={<Ayuda />} />
          <Route path="ayuda/asistente" element={<AsistenteIA />} />
          <Route path="ayuda/agente-mcp" element={<AgenteMcp />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
