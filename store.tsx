import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Cliente, Cita, Vehiculo } from '@/types';
import { loadPersistedData, savePersistedData } from '@/lib/storage';

export type TamanoVehiculo = 'chico' | 'mediano' | 'grande' | 'moto' | 'trailer';

export interface PaqueteConTamano {
  id: string;
  nombre: string;
  precio: string;
  duracion: string;
  tamano: TamanoVehiculo;
}

const PAQUETES_POR_TAMANO: Record<TamanoVehiculo, PaqueteConTamano[]> = {
  chico: [
    { id: 'c1', nombre: 'Lavado Exterior', precio: '$120', duracion: '20 min', tamano: 'chico' },
    { id: 'c2', nombre: 'Lavado Completo', precio: '$200', duracion: '40 min', tamano: 'chico' },
    { id: 'c3', nombre: 'Lavado + Aspirado', precio: '$280', duracion: '1 hr', tamano: 'chico' },
  ],
  mediano: [
    { id: 'm1', nombre: 'Lavado Exterior', precio: '$150', duracion: '25 min', tamano: 'mediano' },
    { id: 'm2', nombre: 'Lavado Completo', precio: '$260', duracion: '50 min', tamano: 'mediano' },
    { id: 'm3', nombre: 'Lavado + Aspirado', precio: '$350', duracion: '1.5 hrs', tamano: 'mediano' },
  ],
  grande: [
    { id: 'g1', nombre: 'Lavado Exterior', precio: '$180', duracion: '30 min', tamano: 'grande' },
    { id: 'g2', nombre: 'Lavado Completo', precio: '$320', duracion: '1 hr', tamano: 'grande' },
    { id: 'g3', nombre: 'Lavado + Aspirado', precio: '$420', duracion: '2 hrs', tamano: 'grande' },
  ],
  moto: [
    { id: 'mc1', nombre: 'Lavado Básico', precio: '$80', duracion: '15 min', tamano: 'moto' },
    { id: 'mc2', nombre: 'Lavado Completo', precio: '$130', duracion: '30 min', tamano: 'moto' },
    { id: 'mc3', nombre: 'Lavado + Encerado', precio: '$200', duracion: '45 min', tamano: 'moto' },
  ],
  trailer: [
    { id: 't1', nombre: 'Lavado Exterior', precio: '$250', duracion: '40 min', tamano: 'trailer' },
    { id: 't2', nombre: 'Lavado Completo', precio: '$400', duracion: '1.5 hrs', tamano: 'trailer' },
    { id: 't3', nombre: 'Lavado + Sanitización', precio: '$550', duracion: '2.5 hrs', tamano: 'trailer' },
  ],
};

interface PersistedData {
  cliente: Cliente | null;
  citas: Cita[];
  vehicleTypeLabel: string | null;
  tamanoVehiculo: TamanoVehiculo;
  tema: 'claro' | 'oscuro';
}

function vehicleTypeToTamano(type: string | null): TamanoVehiculo {
  if (!type) return 'mediano';
  const t = type.toLowerCase();
  if (/motorcycle/.test(t)) return 'moto';
  if (/trailer/.test(t)) return 'trailer';
  if (/sedan|hatchback|coupe|convertible|wagon/.test(t)) return 'chico';
  if (/suv|crossover/.test(t)) return 'mediano';
  return 'grande';
}

interface AppState {
  tamanoVehiculo: TamanoVehiculo;
  vehicleTypeLabel: string | null;
  setTamanoVehiculo: (type: string | null) => void;
  paquetes: PaqueteConTamano[];
  cliente: Cliente | null;
  setCliente: (c: Cliente) => void;
  citas: Cita[];
  agregarCita: (cita: Cita) => void;
  cancelarCita: (id: string) => void;
  eliminarCita: (id: string) => void;
  toastMessage: string | null;
  showToast: (message: string) => void;
  tema: 'claro' | 'oscuro';
  toggleTema: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [tamanoVehiculo, setTamano] = useState<TamanoVehiculo>('mediano');
  const [vehicleTypeLabel, setVehicleTypeLabel] = useState<string | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [tema, setTema] = useState<'claro' | 'oscuro'>('claro');
  const loaded = useRef(false);

  useEffect(() => {
    loadPersistedData<PersistedData>().then((d) => {
      if (!d) return;
      if (d.cliente) setCliente(d.cliente);
      if (d.citas) setCitas(d.citas);
      if (d.vehicleTypeLabel) setVehicleTypeLabel(d.vehicleTypeLabel);
      if (d.tamanoVehiculo) setTamano(d.tamanoVehiculo);
      if (d.tema) setTema(d.tema);
      loaded.current = true;
    });
  }, []);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const showToast = (message: string) => {
    setToastMessage(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), 2000);
  };

  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!loaded.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      savePersistedData({ cliente, citas, vehicleTypeLabel, tamanoVehiculo, tema });
      // showToast('Datos guardados correctamente');
    }, 300);
  }, [cliente, citas, vehicleTypeLabel, tamanoVehiculo, tema]);

  const setTamanoVehiculo = (type: string | null) => {
    setVehicleTypeLabel(type);
    setTamano(vehicleTypeToTamano(type));
  };

  const agregarCita = (cita: Cita) => {
    setCitas((prev) => [...prev, cita]);
  };

  const cancelarCita = (id: string) => {
    setCitas((prev) => prev.map((c) => (c.id === id ? { ...c, estado: 'cancelada' as const } : c)));
  };

  const eliminarCita = (id: string) => {
    setCitas((prev) => prev.filter((c) => c.id !== id));
  };

  const paquetes = PAQUETES_POR_TAMANO[tamanoVehiculo];

  const toggleTema = () => {
    setTema(prev => prev === 'claro' ? 'oscuro' : 'claro');
  };

  return (
    <AppContext.Provider value={{ tamanoVehiculo, vehicleTypeLabel, setTamanoVehiculo, paquetes, cliente, setCliente, citas, agregarCita, cancelarCita, eliminarCita, toastMessage, showToast, tema, toggleTema }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within <AppProvider>');
  return ctx;
}
