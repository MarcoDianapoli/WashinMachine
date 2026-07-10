export interface Paquete {
  id: string;
  nombre: string;
  precio: string;
  duracion: string;
}

export interface Vehiculo {
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
  paqueteId: string;
  paqueteNombre: string;
  fecha: string;
  hora: string;
  cliente: Cliente;
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
}
