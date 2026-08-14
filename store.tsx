import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppStateStatus, AppState as RNAppState, Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { io, Socket } from 'socket.io-client';
import type { Cliente, Cita, Vehiculo, AuthUser } from '@/types';
import { loadPersistedData, savePersistedData, getPersistedToken, setPersistedToken } from '@/lib/storage';
import {
  presentIncomingNotification,
  requestNotificationPermissions,
  resetNotificationTracking,
  startForegroundMonitoring,
  stopForegroundMonitoring,
  syncServerNotifications,
} from '@/lib/notifications';
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
  getPaymentStatusApi,
  ApiVehicle,
  ApiAppointment,
  ApiNotification,
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
  
  if (t.includes('motorcycle') || t.includes('moto')) return 'moto';
  if (t.includes('trailer')) return 'trailer';
  
  if (t.includes('large suv') || t.includes('pickup') || t.includes('minivan') || t.includes('van') || t.includes('truck') || t.includes('grande')) return 'grande';
  if (t.includes('suv') || t.includes('crossover') || t.includes('medium') || t.includes('mediano')) return 'mediano';
  if (t.includes('sedan') || t.includes('hatchback') || t.includes('coupe') || t.includes('convertible') || t.includes('wagon') || t.includes('small') || t.includes('chico')) return 'chico';
  
  return 'mediano';
}

function mapApiRole(role?: string): AuthUser['rol'] {
  if (role === 'washer') return 'lavador';
  if (role === 'admin') return 'admin';
  return 'cliente';
}

function mapApiUser(
  user: {
    _id?: string;
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    phone?: string;
    pickupPerson?: string;
    address?: string;
    notes?: string;
  },
  fallback: { id?: string; name?: string; email?: string; phone?: string } = {},
): AuthUser {
  return {
    id: user._id || user.id || fallback.id || `user_${Date.now()}`,
    email: user.email || fallback.email || '',
    nombre: user.name || fallback.name || 'Cliente',
    rol: mapApiRole(user.role),
    telefono: user.phone || fallback.phone,
    pickupPerson: user.pickupPerson,
    direccion: user.address,
    notas: user.notes,
  };
}

export function getVehicleTypeDisplay(type?: string | null): string {
  if (!type) return '';
  const t = type.toLowerCase();
  if (t.includes('small') || t.includes('sedan') || t.includes('hatchback') || t.includes('coupe')) return 'Sedán / Chico';
  if (t.includes('medium') || t.includes('suv') || t.includes('crossover')) return 'SUV / Mediano';
  if (t.includes('large') || t.includes('pickup') || t.includes('minivan') || t.includes('van') || t.includes('camioneta')) return 'Camioneta / Grande';
  if (t.includes('motorcycle') || t.includes('moto')) return 'Motocicleta';
  if (t.includes('trailer')) return 'Tráiler / Pesado';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function mapApiVehicleToVehiculo(v: ApiVehicle): Vehiculo {
  return {
    _id: v._id,
    placa: v.plate || '',
    marca: v.make || '',
    modelo: v.model || '',
    color: v.color || '',
    anio: v.year || '',
    imagenUri: v.imageUri || undefined,
    tipoVehiculo: getVehicleTypeDisplay(v.vehicleType),
  };
}

function mapApiAppointmentToCita(a: ApiAppointment): Cita {
  let estado: Cita['estado'] = 'pendiente';
  if (a.status === 'confirmed') estado = 'confirmada';
  else if (a.status === 'in_progress') estado = 'en_proceso';
  else if (a.status === 'ready_for_pickup') estado = 'listo_entrega';
  else if (a.status === 'completed') estado = 'completada';
  else if (a.status === 'cancelled') estado = 'cancelada';

  const clientName = a.client?.name || a.customer?.name || '';
  const clientPhone = a.client?.phone || a.customer?.phone || '';

  const vehicle: Vehiculo | undefined = a.vehicle ? {
    placa: a.vehicle.plate || '',
    marca: a.vehicle.make || '',
    modelo: a.vehicle.model || '',
    color: a.vehicle.color || '',
    anio: a.vehicle.year || '',
    tipoVehiculo: getVehicleTypeDisplay(a.vehicle.vehicleType),
  } : undefined;

  return {
    id: a._id,
    code: a.code,
    paqueteId: a.packageId,
    paqueteNombre: a.packageName || 'Lavado',
    fecha: a.date,
    hora: a.time,
    precio: a.price,
    duracion: a.packageDuration,
    estado,
    cliente: {
      nombre: clientName,
      telefono: clientPhone,
      vehiculo: vehicle,
      vehiculos: vehicle ? [vehicle] : [],
      personaRecoge: a.customer?.pickupPerson || '',
      notas: a.notes,
    },
    paid: a.paid,
    paymentMethod: a.paymentMethod,
    mpPaymentId: a.mpPaymentId,
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

  paymentsEnabled: boolean;
  checkPaymentsEnabled: () => Promise<void>;
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
  const [paymentsEnabled, setPaymentsEnabled] = useState<boolean>(false);
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

  const syncVehicles = async (profile: AuthUser | null = authUser) => {
    if (!getApiToken()) return;
    try {
      const list = await getVehiclesApi();
      const vehiculosMapped = list.map(mapApiVehicleToVehiculo);
      setCliente((prev) => ({
        nombre: profile?.nombre || prev?.nombre || 'Cliente',
        telefono: profile?.telefono || prev?.telefono || '',
        vehiculos: vehiculosMapped,
        personaRecoge: profile?.pickupPerson || prev?.personaRecoge || '',
        direccion: profile?.direccion || prev?.direccion || '',
        notas: profile?.notas || prev?.notas || '',
      }));
    } catch {}
  };

  const syncAppointments = async () => {
    if (!getApiToken()) return;
    try {
      const list = await getAppointmentsApi();
      const mapped = list.map(mapApiAppointmentToCita);
      setCitas(mapped);
    } catch {}
  };

  const checkPaymentsEnabled = async () => {
    try {
      const res = await getPaymentStatusApi();
      setPaymentsEnabled(res.enabled);
    } catch {
      setPaymentsEnabled(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    requestNotificationPermissions();
    checkPaymentsEnabled();

    (async () => {
      try {
        const savedToken = await getPersistedToken();
        const d = await loadPersistedData<PersistedData>();

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
        }

        const validToken = savedToken;
        if (validToken) {
          setApiToken(validToken);
          setToken(validToken);
          try {
            const user = await getMeApi();
            const mappedUser = mapApiUser(user);
            setAuthUser(mappedUser);
            await syncVehicles(mappedUser);
            await syncAppointments();
          } catch (err) {
            // Token expired or invalid
            await setPersistedToken(null);
            setToken(null);
            setAuthUser(null);
          }
        }
      } catch {}

      loaded.current = true;
      setIsAuthChecking(false);
    })();
  }, []);

  useEffect(() => {
    if (!authUser || !token || authUser.rol !== 'cliente') return;

    syncServerNotifications().catch(() => {});
    startForegroundMonitoring().catch(() => {});
  }, [authUser?.id, authUser?.rol, token]);

  // ── TIEMPO REAL: WebSockets (Socket.io) y Polling Continuo ─────────────────
  useEffect(() => {
    const currentToken = token || getApiToken();
    if (!currentToken || !authUser) return;

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

    socket.on('notification:new', (notification: ApiNotification) => {
      presentIncomingNotification(notification).catch(() => {});
    });

    const interval = setInterval(() => {
      syncAppointments();
      if (authUser.rol === 'cliente') {
        syncServerNotifications().catch(() => {});
      }
    }, 30_000);

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [authUser?.id, token]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = (message: string) => {
    if (!message || typeof message !== 'string' || !message.trim()) return;
    setToastMessage(message.trim());
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), 2500);
  };

  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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
        authToken: null,
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

    if (keepSession && res.token) {
      await setPersistedToken(res.token);
    } else {
      await setPersistedToken(null);
    }

    setApiToken(res.token);
    setToken(res.token);
    const fullUser = await getMeApi().catch(() => res.user);
    const mappedUser = mapApiUser(fullUser, {
      id: res.user?._id || res.user?.id,
      email: emailStr,
      name: res.user?.name,
      phone: res.user?.phone,
    });
    setAuthUser(mappedUser);
    setMantenerSesion(keepSession);

    await savePersistedData({
      cliente,
      citas,
      vehicleTypeLabel,
      tamanoVehiculo,
      tema,
      authUser: mappedUser,
      authToken: null,
      mantenerSesion: keepSession,
    });

    await syncVehicles(mappedUser);
    await syncAppointments();
    return mappedUser;
  };

  const registerWithEmail = async (nameStr: string, emailStr: string, passStr: string, phoneStr?: string): Promise<AuthUser> => {
    const res = await registerApi(nameStr, emailStr, passStr, phoneStr);

    if (res.token) {
      await setPersistedToken(res.token);
    }

    setApiToken(res.token);
    setToken(res.token);
    const fullUser = await getMeApi().catch(() => res.user);
    const mappedUser = mapApiUser(fullUser, {
      id: res.user?._id || res.user?.id,
      email: emailStr,
      name: nameStr,
      phone: phoneStr,
    });
    setAuthUser(mappedUser);

    await savePersistedData({
      cliente,
      citas,
      vehicleTypeLabel,
      tamanoVehiculo,
      tema,
      authUser: mappedUser,
      authToken: null,
      mantenerSesion: true,
    });

    await syncVehicles(mappedUser);
    await syncAppointments();
    return mappedUser;
  };

  const loginWithGoogle = async (credential: string): Promise<AuthUser> => {
    const res = await googleLoginApi(credential);

    if (res.token) {
      await setPersistedToken(res.token);
    }

    setApiToken(res.token);
    setToken(res.token);
    const fullUser = await getMeApi().catch(() => res.user);
    const mappedUser = mapApiUser(fullUser, {
      id: res.user?._id || res.user?.id,
      email: res.user?.email,
      name: res.user?.name || 'Usuario',
      phone: res.user?.phone,
    });
    setAuthUser(mappedUser);

    await savePersistedData({
      cliente,
      citas,
      vehicleTypeLabel,
      tamanoVehiculo,
      tema,
      authUser: mappedUser,
      authToken: null,
      mantenerSesion: true,
    });

    await syncVehicles(mappedUser);
    await syncAppointments();
    return mappedUser;
  };

  const logout = async () => {
    try {
      if (getApiToken()) {
        await logoutApi();
      }
    } catch {}
    
    try {
      if (GoogleSignin.hasPreviousSignIn()) {
        await GoogleSignin.signOut();
      }
    } catch (e) {
      console.log('Error signing out of Google:', e);
    }

    await stopForegroundMonitoring().catch(() => {});
    await setPersistedToken(null);
    setApiToken(null);
    await resetNotificationTracking().catch(() => {});
    setToken(null);
    setAuthUser(null);
    setCliente(null);
    await savePersistedData({
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
        personaRecoge: prev?.personaRecoge || '',
        direccion: prev?.direccion,
        notas: prev?.notas,
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
        personaRecoge: prev?.personaRecoge || '',
        direccion: prev?.direccion,
        notas: prev?.notas,
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
    if (!getApiToken()) {
      showToast('Tu sesión no es válida. Inicia sesión nuevamente.');
      return;
    }
    try {
      await updateAppointmentStatusApi(id, 'cancelled');
      await syncAppointments();
      showToast('Cita cancelada');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo cancelar la cita.');
    }
  };

  const eliminarCita = (id: string) => {
    setCitas((prev) => prev.filter((c) => c.id !== id));
    showToast('Cita eliminada');
  };

  const tomarCita = async (id: string) => {
    if (!getApiToken()) {
      showToast('Tu sesión no es válida. Inicia sesión nuevamente.');
      return;
    }
    try {
      await updateAppointmentStatusApi(id, 'in_progress');
      await syncAppointments();
      showToast('Cita en proceso');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo tomar la cita.');
    }
  };

  const terminarCita = async (id: string) => {
    if (!getApiToken()) {
      showToast('Tu sesión no es válida. Inicia sesión nuevamente.');
      return;
    }
    try {
      await updateAppointmentStatusApi(id, 'ready_for_pickup');
      await syncAppointments();
      showToast('Auto listo para entrega');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo terminar la cita.');
    }
  };

  const entregarCita = async (id: string) => {
    if (!getApiToken()) {
      showToast('Tu sesión no es válida. Inicia sesión nuevamente.');
      return;
    }
    try {
      await updateAppointmentStatusApi(id, 'completed');
      await syncAppointments();
      showToast('Cita completada y entregada');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo entregar la cita.');
    }
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
        paymentsEnabled,
        checkPaymentsEnabled,
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
