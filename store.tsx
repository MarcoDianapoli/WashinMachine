import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Cliente, Cita, Vehiculo, AuthUser } from '@/types';
import { loadPersistedData, savePersistedData } from '@/lib/storage';
import { requestNotificationPermissions, triggerLocalNotification } from '@/lib/notifications';
import {
  setApiToken,
  getApiToken,
  loginApi,
  registerApi,
  googleLoginApi,
  getMeApi,
  updateMeApi,
  logoutApi,
  getVehiclesApi,
  addVehicleApi,
  updateVehicleApi,
  deleteVehicleApi,
  getSettingsApi,
  getAppointmentsApi,
  createAppointmentApi,
  updateAppointmentStatusApi,
  ApiVehicle,
  ApiAppointment,
  CreateAppointmentInput,
  API_BASE_URL,
} from '@/lib/api';

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
  authUser?: AuthUser | null;
  authToken?: string | null;
  mantenerSesion?: boolean;
}

function vehicleTypeToTamano(type: string | null): TamanoVehiculo {
  if (!type) return 'mediano';
  const t = type.toLowerCase();
  if (/motorcycle|moto/.test(t)) return 'moto';
  if (/trailer/.test(t)) return 'trailer';
  if (/small|chico|sedan|hatchback|coupe|convertible|wagon/.test(t)) return 'chico';
  if (/medium|mediano|suv|crossover/.test(t)) return 'mediano';
  return 'grande';
}

function mapApiVehicleToVehiculo(v: ApiVehicle): Vehiculo {
  let tipo = 'Mediano';
  if (v.vehicleType === 'small') tipo = 'Sedán / Chico';
  else if (v.vehicleType === 'medium') tipo = 'SUV / Mediano';
  else if (v.vehicleType === 'large') tipo = 'Camioneta / Grande';
  else if (v.vehicleType === 'motorcycle') tipo = 'Motocicleta';
  else if (v.vehicleType === 'trailer') tipo = 'Tráiler / Pesado';

  return {
    _id: v._id,
    placa: v.plate || '',
    marca: v.make || '',
    modelo: v.model || '',
    color: v.color || '',
    anio: v.year || '',
    imagenUri: v.imageUri || undefined,
    tipoVehiculo: tipo,
  };
}

function mapApiAppointmentToCita(a: ApiAppointment): Cita {
  let estado: Cita['estado'] = 'pendiente';
  if (a.status === 'confirmed') estado = 'confirmada';
  else if (a.status === 'in_progress') estado = 'en_proceso';
  else if (a.status === 'ready_for_pickup') estado = 'listo_entrega';
  else if (a.status === 'completed') estado = 'completada';
  else if (a.status === 'cancelled') estado = 'cancelada';

  return {
    id: a._id,
    code: a.code,
    paqueteId: a.packageId,
    paqueteNombre: a.packageName || 'Lavado',
    fecha: a.date,
    hora: a.time,
    estado,
    cliente: {
      nombre: a.client?.name || 'Cliente',
      telefono: a.client?.phone || '',
      vehiculo: a.vehicle ? [{
        placa: a.vehicle.plate || '',
        marca: a.vehicle.make || '',
        modelo: a.vehicle.model || '',
        color: a.vehicle.color || '',
        anio: a.vehicle.year || '',
        tipoVehiculo: a.vehicle.vehicleType || '',
      }] : [],
      personaRecoge: a.notes || '',
    },
  };
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
  authUser: AuthUser | null;
  token: string | null;
  isAuthChecking: boolean;

  // Real API Authentication
  loginWithEmail: (email: string, password: string, mantenerSesion?: boolean) => Promise<AuthUser>;
  registerWithEmail: (name: string, email: string, password: string, phone?: string) => Promise<AuthUser>;
  loginWithGoogle: (credential: string) => Promise<AuthUser>;
  loginLavador: (codigo: string) => boolean;
  logout: () => Promise<void>;
  actualizarPerfil: (datos: { name?: string; phone?: string; pickupPerson?: string; address?: string; notes?: string }) => Promise<void>;
  actualizarPerfilLavador: (datos: { telefono?: string; fotoPerfil?: string }) => void;

  // Real API Garage & Appointments
  syncVehicles: () => Promise<void>;
  addVehicleApiCall: (vehicle: { plate?: string; make: string; model?: string; color?: string; year?: string; vehicleType?: any; imageUri?: string }) => Promise<void>;
  updateVehicleApiCall: (vehicleId: string, vehicle: Partial<ApiVehicle>) => Promise<void>;
  deleteVehicleApiCall: (vehicleId: string) => Promise<void>;
  syncAppointments: () => Promise<void>;
  crearCitaApiCall: (input: CreateAppointmentInput) => Promise<ApiAppointment>;

  tomarCita: (id: string) => void;
  terminarCita: (id: string) => void;
  entregarCita: (id: string) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [tamanoVehiculo, setTamano] = useState<TamanoVehiculo>('mediano');
  const [vehicleTypeLabel, setVehicleTypeLabel] = useState<string | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [tema, setTema] = useState<'claro' | 'oscuro'>('claro');
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [mantenerSesion, setMantenerSesion] = useState<boolean>(true);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const loaded = useRef(false);
  const previousCitasRef = useRef<Map<string, string>>(new Map());

  const [paquetesCatalog, setPaquetesCatalog] = useState<Record<TamanoVehiculo, PaqueteConTamano[]> | null>(null);

  const fetchSettings = async () => {
    try {
      const settings = await getSettingsApi();
      if (settings?.catalog) {
        const catMap: Record<TamanoVehiculo, PaqueteConTamano[]> = {
          chico: [],
          mediano: [],
          grande: [],
          moto: [],
          trailer: [],
        };

        const mapKeyToTamano = (key: string): TamanoVehiculo => {
          if (key === 'small') return 'chico';
          if (key === 'medium') return 'mediano';
          if (key === 'large') return 'grande';
          if (key === 'motorcycle') return 'moto';
          if (key === 'trailer') return 'trailer';
          return 'mediano';
        };

        Object.keys(settings.catalog).forEach((catKey) => {
          const tamano = mapKeyToTamano(catKey);
          const items = settings.catalog[catKey];
          if (Array.isArray(items)) {
            catMap[tamano] = items.map((item) => ({
              id: item.id,
              nombre: item.name,
              precio: typeof item.price === 'number' ? `$${item.price}` : String(item.price),
              duracion: item.durationMinutes ? `${item.durationMinutes} min` : '30 min',
              tamano,
            }));
          }
        });

        if (Object.values(catMap).some((arr) => arr.length > 0)) {
          setPaquetesCatalog((prev) => ({ ...PAQUETES_POR_TAMANO, ...catMap }));
        }
      }
    } catch {}
  };

  const syncVehicles = async () => {
    if (!getApiToken()) return;
    try {
      const list = await getVehiclesApi();
      const vehiculosMapped = list.map(mapApiVehicleToVehiculo);
      setCliente((prev) => ({
        nombre: prev?.nombre || authUser?.nombre || 'Cliente',
        telefono: prev?.telefono || authUser?.telefono || '',
        vehiculos: vehiculosMapped,
        personaRecoge: prev?.personaRecoge || '',
        direccion: prev?.direccion || '',
        notas: prev?.notas || '',
      }));
    } catch {}
  };

  const checkStatusChangesAndNotify = (newList: Cita[]) => {
    newList.forEach((c) => {
      const prevStatus = previousCitasRef.current.get(c.id);
      if (prevStatus && prevStatus !== c.estado) {
        if (c.estado === 'listo_entrega') {
          triggerLocalNotification('Monkey Auto Spa ✨', '¡Tu vehículo está listo para entrega! Puedes pasar a recogerlo.');
        } else if (c.estado === 'en_proceso') {
          triggerLocalNotification('Monkey Auto Spa 🧼', 'Tu servicio de lavado ha comenzado.');
        } else if (c.estado === 'completada') {
          triggerLocalNotification('Monkey Auto Spa 🚗', '¡Auto entregado exitosamente!');
        }
      }
      previousCitasRef.current.set(c.id, c.estado);
    });
  };

  const syncAppointments = async () => {
    if (!getApiToken()) return;
    try {
      const list = await getAppointmentsApi();
      const mapped = list.map(mapApiAppointmentToCita);
      checkStatusChangesAndNotify(mapped);
      setCitas(mapped);
    } catch {}
  };

  useEffect(() => {
    fetchSettings();
    requestNotificationPermissions();

    loadPersistedData<PersistedData>().then(async (d) => {
      if (d) {
        if (d.cliente) {
          const c = d.cliente;
          if (!c.vehiculos) {
            c.vehiculos = c.vehiculo && c.vehiculo.modelo ? [c.vehiculo] : [];
          }
          setCliente(c);
        }
        if (d.citas) setCitas(d.citas);
        if (d.vehicleTypeLabel) setVehicleTypeLabel(d.vehicleTypeLabel);
        if (d.tamanoVehiculo) setTamano(d.tamanoVehiculo);
        if (d.tema) setTema(d.tema);
        if (d.mantenerSesion !== undefined) setMantenerSesion(d.mantenerSesion);

        const savedToken = d.authToken || null;
        if (savedToken) {
          setApiToken(savedToken);
          setToken(savedToken);
          try {
            const user = await getMeApi();
            const mappedUser: AuthUser = {
              id: user._id,
              email: user.email,
              nombre: user.name,
              rol: user.role === 'client' ? 'cliente' : user.role,
              telefono: user.phone,
              pickupPerson: user.pickupPerson,
              direccion: user.address,
              notas: user.notes,
            };
            setAuthUser(mappedUser);
            await syncVehicles();
            await syncAppointments();
          } catch (err) {
            setApiToken(null);
            setToken(null);
            setAuthUser(null);
          }
        } else if (d.authUser) {
          setAuthUser(d.authUser);
        }
      }
      loaded.current = true;
      setIsAuthChecking(false);
    });
  }, []);

  // ── TIEMPO REAL: WebSockets (Socket.io) y Polling Continuo ─────────────────
  useEffect(() => {
    const currentToken = token || getApiToken();
    if (!currentToken || !authUser) return;

    // 1. Conexión WebSocket en tiempo real con Socket.io
    const socket: Socket = io(`${API_BASE_URL}/realtime`, {
      auth: { token: currentToken },
      transports: ['websocket', 'polling'],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      syncAppointments();
    });

    socket.on('appointments:changed', () => {
      syncAppointments();
    });

    socket.on('appointments:status', () => {
      syncAppointments();
    });

    // 2. Polling de respaldo cada 6 segundos para garantizar actualización fluida
    const interval = setInterval(() => {
      syncAppointments();
    }, 6000);

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [authUser?.id, token]);

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
      savePersistedData({
        cliente,
        citas,
        vehicleTypeLabel,
        tamanoVehiculo,
        tema,
        authUser,
        authToken: token,
        mantenerSesion,
      });
    }, 300);
  }, [cliente, citas, vehicleTypeLabel, tamanoVehiculo, tema, authUser, token, mantenerSesion]);

  const setTamanoVehiculo = (type: string | null) => {
    setVehicleTypeLabel(type);
    setTamano(vehicleTypeToTamano(type));
  };

  const loginWithEmail = async (emailStr: string, passStr: string, keepSession = true): Promise<AuthUser> => {
    const res = await loginApi(emailStr, passStr);
    const mappedUser: AuthUser = {
      id: res.user._id,
      email: res.user.email,
      nombre: res.user.name,
      rol: res.user.role === 'client' ? 'cliente' : res.user.role,
      telefono: res.user.phone,
      pickupPerson: res.user.pickupPerson,
      direccion: res.user.address,
      notas: res.user.notes,
    };
    setApiToken(res.token);
    setToken(res.token);
    setAuthUser(mappedUser);
    setMantenerSesion(keepSession);

    if (!keepSession) {
      savePersistedData({
        cliente,
        citas,
        vehicleTypeLabel,
        tamanoVehiculo,
        tema,
        authUser: mappedUser,
        authToken: null,
        mantenerSesion: false,
      });
    }

    await syncVehicles();
    await syncAppointments();
    return mappedUser;
  };

  const registerWithEmail = async (nameStr: string, emailStr: string, passStr: string, phoneStr?: string): Promise<AuthUser> => {
    const res = await registerApi(nameStr, emailStr, passStr, phoneStr);
    const mappedUser: AuthUser = {
      id: res.user._id,
      email: res.user.email,
      nombre: res.user.name,
      rol: 'cliente',
      telefono: res.user.phone,
    };
    setApiToken(res.token);
    setToken(res.token);
    setAuthUser(mappedUser);
    await syncVehicles();
    await syncAppointments();
    return mappedUser;
  };

  const loginWithGoogle = async (credential: string): Promise<AuthUser> => {
    const res = await googleLoginApi(credential);
    const mappedUser: AuthUser = {
      id: res.user._id,
      email: res.user.email,
      nombre: res.user.name,
      rol: res.user.role === 'client' ? 'cliente' : res.user.role,
      telefono: res.user.phone,
    };
    setApiToken(res.token);
    setToken(res.token);
    setAuthUser(mappedUser);
    await syncVehicles();
    await syncAppointments();
    return mappedUser;
  };

  const loginLavador = (codigo: string) => {
    if (codigo.toLowerCase().startsWith('lavador')) {
      setAuthUser({
        id: `lav_${Date.now()}`,
        email: 'lavador@monkey.com',
        rol: 'lavador',
        nombre: 'Lavador',
      });
      return true;
    }
    return false;
  };

  const logout = async () => {
    try {
      if (getApiToken()) {
        await logoutApi();
      }
    } catch {}
    setApiToken(null);
    setToken(null);
    setAuthUser(null);
    setCliente(null);
    savePersistedData({
      cliente: null,
      citas: [],
      vehicleTypeLabel: null,
      tamanoVehiculo: 'mediano',
      tema: 'claro',
      authUser: null,
      authToken: null,
      mantenerSesion: true,
    });
  };

  const actualizarPerfil = async (datos: { name?: string; phone?: string; pickupPerson?: string; address?: string; notes?: string }) => {
    if (getApiToken()) {
      const user = await updateMeApi(datos);
      setAuthUser((prev) => prev ? {
        ...prev,
        nombre: user.name,
        telefono: user.phone,
        pickupPerson: user.pickupPerson,
        direccion: user.address,
        notas: user.notes,
      } : null);
    } else {
      setAuthUser((prev) => prev ? { ...prev, ...datos, nombre: datos.name || prev.nombre, telefono: datos.phone || prev.telefono } : null);
    }
  };

  const actualizarPerfilLavador = (datos: { telefono?: string; fotoPerfil?: string }) => {
    setAuthUser((prev) => (prev ? { ...prev, ...datos } : null));
  };

  const addVehicleApiCall = async (vehicle: { plate?: string; make: string; model?: string; color?: string; year?: string; vehicleType?: any; imageUri?: string }) => {
    if (getApiToken()) {
      await addVehicleApi(vehicle);
      await syncVehicles();
    } else {
      const v: Vehiculo = {
        _id: `v_${Date.now()}`,
        marca: vehicle.make,
        modelo: vehicle.model || '',
        placa: vehicle.plate || '',
        color: vehicle.color || '',
        anio: vehicle.year || '',
        imagenUri: vehicle.imageUri,
      };
      setCliente((prev) => ({
        nombre: prev?.nombre || 'Cliente',
        telefono: prev?.telefono || '',
        vehiculos: [...(prev?.vehiculos || []), v],
      }));
    }
  };

  const updateVehicleApiCall = async (vehicleId: string, vehicle: Partial<ApiVehicle>) => {
    if (getApiToken()) {
      await updateVehicleApi(vehicleId, vehicle);
      await syncVehicles();
    }
  };

  const deleteVehicleApiCall = async (vehicleId: string) => {
    if (getApiToken()) {
      await deleteVehicleApi(vehicleId);
      await syncVehicles();
    } else {
      setCliente((prev) => ({
        nombre: prev?.nombre || '',
        telefono: prev?.telefono || '',
        vehiculos: (prev?.vehiculos || []).filter((v) => v._id !== vehicleId),
      }));
    }
  };

  const crearCitaApiCall = async (input: CreateAppointmentInput): Promise<ApiAppointment> => {
    const res = await createAppointmentApi(input);
    await syncAppointments();
    return res;
  };

  const agregarCita = (nueva: Cita) => {
    setCitas((prev) => [nueva, ...prev]);
  };

  const cancelarCita = async (id: string) => {
    if (getApiToken()) {
      try {
        await updateAppointmentStatusApi(id, 'cancelled');
        await syncAppointments();
        showToast('Cita cancelada');
        return;
      } catch {}
    }
    setCitas((prev) => prev.map((c) => (c.id === id ? { ...c, estado: 'cancelada' } : c)));
    showToast('Cita cancelada');
  };

  const eliminarCita = (id: string) => {
    setCitas((prev) => prev.filter((c) => c.id !== id));
    showToast('Cita eliminada');
  };

  const tomarCita = async (id: string) => {
    if (getApiToken()) {
      try {
        await updateAppointmentStatusApi(id, 'in_progress');
        await syncAppointments();
        showToast('Cita en proceso');
        return;
      } catch {}
    }
    setCitas((prev) => prev.map((c) => (c.id === id ? { ...c, estado: 'en_proceso' } : c)));
    showToast('Cita tomada');
  };

  const terminarCita = async (id: string) => {
    if (getApiToken()) {
      try {
        await updateAppointmentStatusApi(id, 'ready_for_pickup');
        await syncAppointments();
        showToast('Auto listo para entrega');
        return;
      } catch {}
    }
    setCitas((prev) => prev.map((c) => (c.id === id ? { ...c, estado: 'listo_entrega' } : c)));
    showToast('Auto listo para entregarse');
  };

  const entregarCita = async (id: string) => {
    if (getApiToken()) {
      try {
        await updateAppointmentStatusApi(id, 'completed');
        await syncAppointments();
        showToast('Cita completada y entregada');
        return;
      } catch {}
    }
    setCitas((prev) => prev.map((c) => (c.id === id ? { ...c, estado: 'completada' } : c)));
    showToast('Auto entregado al cliente');
  };

  const activeCatalog = paquetesCatalog || PAQUETES_POR_TAMANO;
  const paquetes = activeCatalog[tamanoVehiculo] || activeCatalog['mediano'] || PAQUETES_POR_TAMANO['mediano'];

  return (
    <AppContext.Provider
      value={{
        tamanoVehiculo,
        vehicleTypeLabel,
        setTamanoVehiculo,
        paquetes,
        cliente,
        setCliente,
        citas,
        agregarCita,
        cancelarCita,
        eliminarCita,
        toastMessage,
        showToast,
        tema,
        toggleTema: () => setTema((t) => (t === 'claro' ? 'oscuro' : 'claro')),
        authUser,
        token,
        isAuthChecking,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginLavador,
        logout,
        actualizarPerfil,
        actualizarPerfilLavador,
        syncVehicles,
        addVehicleApiCall,
        updateVehicleApiCall,
        deleteVehicleApiCall,
        syncAppointments,
        crearCitaApiCall,
        tomarCita,
        terminarCita,
        entregarCita,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe ser usado dentro de AppProvider');
  }
  return context;
}
