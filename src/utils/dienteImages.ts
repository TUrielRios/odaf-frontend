// utils/dienteImages.ts

// Dientes superiores (1.1 a 2.8)
import superior11 from '../assets/dientes/superior/1.1.png';
import superior12 from '../assets/dientes/superior/1.2.png';
import superior13 from '../assets/dientes/superior/1.3.png';
import superior14 from '../assets/dientes/superior/1.4.png';
import superior15 from '../assets/dientes/superior/1.5.png';
import superior16 from '../assets/dientes/superior/1.6.png';
import superior17 from '../assets/dientes/superior/1.7.png';
import superior18 from '../assets/dientes/superior/1.8.png';
import superior21 from '../assets/dientes/superior/2.1.png';
import superior22 from '../assets/dientes/superior/2.2.png';
import superior23 from '../assets/dientes/superior/2.3.png';
import superior24 from '../assets/dientes/superior/2.4.png';
import superior25 from '../assets/dientes/superior/2.5.png';
import superior26 from '../assets/dientes/superior/2.6.png';
import superior27 from '../assets/dientes/superior/2.7.png';
import superior28 from '../assets/dientes/superior/2.8.png';

// Dientes inferiores (3.1 a 4.8)
import inferior31 from '../assets/dientes/inferior/3.1.png';
import inferior32 from '../assets/dientes/inferior/3.2.png';
import inferior33 from '../assets/dientes/inferior/3.3.png';
import inferior34 from '../assets/dientes/inferior/3.4.png';
import inferior35 from '../assets/dientes/inferior/3.5.png';
import inferior36 from '../assets/dientes/inferior/3.6.png';
import inferior37 from '../assets/dientes/inferior/3.7.png';
import inferior38 from '../assets/dientes/inferior/3.8.png';
import inferior41 from '../assets/dientes/inferior/4.1.png';
import inferior42 from '../assets/dientes/inferior/4.2.png';
import inferior43 from '../assets/dientes/inferior/4.3.png';
import inferior44 from '../assets/dientes/inferior/4.4.png';
import inferior45 from '../assets/dientes/inferior/4.5.png';
import inferior46 from '../assets/dientes/inferior/4.6.png';
import inferior47 from '../assets/dientes/inferior/4.7.png';
import inferior48 from '../assets/dientes/inferior/4.8.png';

export const dienteImages: Record<string, string | { default: string }> = {
  // Cuadrante 1 - Superior derecho
  '1.1': superior11,
  '1.2': superior12,
  '1.3': superior13,
  '1.4': superior14,
  '1.5': superior15,
  '1.6': superior16,
  '1.7': superior17,
  '1.8': superior18,
  
  // Cuadrante 2 - Superior izquierdo
  '2.1': superior21,
  '2.2': superior22,
  '2.3': superior23,
  '2.4': superior24,
  '2.5': superior25,
  '2.6': superior26,
  '2.7': superior27,
  '2.8': superior28,
  
  // Cuadrante 3 - Inferior izquierdo
  '3.1': inferior31,
  '3.2': inferior32,
  '3.3': inferior33,
  '3.4': inferior34,
  '3.5': inferior35,
  '3.6': inferior36,
  '3.7': inferior37,
  '3.8': inferior38,
  
  // Cuadrante 4 - Inferior derecho
  // Cuadrante 4 - Inferior derecho
  '4.1': inferior41,
  '4.2': inferior42,
  '4.3': inferior43,
  '4.4': inferior44,
  '4.5': inferior45,
  '4.6': inferior46,
  '4.7': inferior47,
  '4.8': inferior48,

  // Temporarios Superiores (Cuadrantes 5 y 6)
  '5.1': '/dientes/temporarios/5.1.png',
  '5.2': '/dientes/temporarios/5.2.png',
  '5.3': '/dientes/temporarios/5.3.png',
  '5.4': '/dientes/temporarios/5.4.png',
  '5.5': '/dientes/temporarios/5.5.png',
  '6.1': '/dientes/temporarios/6.1.png',
  '6.2': '/dientes/temporarios/6.2.png',
  '6.3': '/dientes/temporarios/6.3.png',
  '6.4': '/dientes/temporarios/6.4.png',
  '6.5': '/dientes/temporarios/6.5.png',

  // Temporarios Inferiores (Cuadrantes 7 y 8)
  '7.1': '/dientes/temporarios/7.1.png',
  '7.2': '/dientes/temporarios/7.2.png',
  '7.3': '/dientes/temporarios/7.3.png',
  '7.4': '/dientes/temporarios/7.4.png',
  '7.5': '/dientes/temporarios/7.5.png',
  '8.1': '/dientes/temporarios/8.1.png',
  '8.2': '/dientes/temporarios/8.2.png',
  '8.3': '/dientes/temporarios/8.3.png',
  '8.4': '/dientes/temporarios/8.4.png',
  '8.5': '/dientes/temporarios/8.5.png',
};

export const getDienteImage = (numero: string): string | null => {
  const image = dienteImages[numero];
  if (!image) return null;
  if (typeof image === 'object' && 'default' in image) {
    return image.default;
  }
  return image;
};

export const getDienteImageSrc = (numero: string): string => {
  return getDienteImage(numero) || '';
};

// Función para verificar si un diente es superior
export const esDienteSuperior = (numero: string): boolean => {
  const primerDigito = parseInt(numero.split('.')[0]);
  return [1, 2, 5, 6].includes(primerDigito);
};

// Función para verificar si un diente es inferior
export const esDienteInferior = (numero: string): boolean => {
  const primerDigito = parseInt(numero.split('.')[0]);
  return [3, 4, 7, 8].includes(primerDigito);
};

// Lista completa de todos los dientes en orden
export const TODOS_LOS_DIENTES = [
  '1.8', '1.7', '1.6', '1.5', '1.4', '1.3', '1.2', '1.1',
  '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8',
  '5.5', '5.4', '5.3', '5.2', '5.1', '6.1', '6.2', '6.3', '6.4', '6.5',
  '8.5', '8.4', '8.3', '8.2', '8.1', '7.1', '7.2', '7.3', '7.4', '7.5',
  '4.8', '4.7', '4.6', '4.5', '4.4', '4.3', '4.2', '4.1',
  '3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8'
];

export default dienteImages;