export interface Paquete {
  id: string;
  nombre: string;
  precio: string;
  duracion: string;
}

export interface Vehiculo {
  _id?: string;
  placa: string;
  marca: string;
  modelo: string;
  color: string;
  anio?: string;
  imagenUri?: string;
  tipoVehiculo?: string;
}

export interface Cliente {
  nombre: string;
  telefono: string;
  vehiculo?: Vehiculo; // Retenido por retrocompatibilidad temporal
  vehiculos: Vehiculo[]; // Múltiples vehículos (hasta 3)
  personaRecoge: string;
  direccion?: string;
  notas?: string;
}

export interface Horario {
  id: string;
  hora: string;
  disponible: boolean;
}

export interface Cita {
  id: string;
  code?: string;
  paqueteId: string;
  paqueteNombre: string;
  fecha: string;
  hora: string;
  precio?: number;
  duracion?: string;
  cliente: Cliente;
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'en_proceso' | 'listo_entrega';
  washerName?: string;
  paid?: boolean;
  paymentMethod?: string;
  mpPaymentId?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  rol: 'admin' | 'lavador' | 'cliente';
  nombre: string;
  telefono?: string;
  fotoPerfil?: string;
  pickupPerson?: string;
  direccion?: string;
  notas?: string;
}
