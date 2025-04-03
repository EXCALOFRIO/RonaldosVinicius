# Calculadora de Tasa de Alcoholemia Estimada

Esta es una aplicación web interactiva construida con React, Next.js (`"use client"`), TypeScript y `shadcn/ui` para estimar la Concentración de Alcohol en Sangre (BAC) o Aire Espirado (BrAC) a lo largo del tiempo. La estimación se basa en factores personales (sexo, peso) y las bebidas consumidas (tipo, cantidad, graduación, tiempo de consumo, tiempo de inicio/espera).

Utiliza `Recharts` para visualizar la curva de alcoholemia estimada y proporciona métricas clave como el pico máximo, el tiempo por encima del límite legal y el tiempo estimado para volver a ~0.00.

**(Opcional: Inserta aquí una captura de pantalla de la aplicación)**
<!-- ![Captura de pantalla de la Calculadora de Alcoholemia](./screenshot.png) -->

**(Opcional: Añade un enlace a una demo en vivo si está disponible)**
<!-- *   **Demo en Vivo:** [Enlace a tu demo desplegada] -->

## ✨ Características Principales

*   **Factores Personales:** Introduce sexo biológico y peso corporal.
*   **Gestión de Bebidas:**
    *   Añade múltiples bebidas (cerveza, vino, destilados).
    *   Elimina bebidas fácilmente.
    *   Selecciona presets comunes (tercio, copa, cubata, etc.) o introduce valores personalizados.
    *   Especifica volumen (ml) y porcentaje de alcohol (% ABV).
*   **Control Temporal Detallado:**
    *   Define la duración del consumo para cada bebida (desde "Hidalgo" hasta personalizado).
    *   Ajusta el minuto de inicio para la *primera* bebida.
    *   Define el tiempo de *espera* (en minutos) después de *terminar* la bebida anterior para las bebidas *siguientes*.
    *   Visualiza los tiempos de inicio y fin calculados para cada bebida.
*   **Cálculo y Simulación:**
    *   Utiliza una variación de la fórmula de Widmark para calcular el BAC potencial.
    *   Simula la absorción del alcohol basada en la duración del consumo.
    *   Simula la eliminación del alcohol a una tasa promedio constante (`0.15 g/L/h`).
*   **Visualización de Resultados:**
    *   Gráfico interactivo (usando `Recharts`) que muestra la curva de alcoholemia estimada a lo largo del tiempo.
    *   Tooltip en el gráfico para ver valores específicos en puntos de tiempo.
    *   Línea de referencia para el límite legal estándar.
*   **Métricas Clave:**
    *   Pico máximo de alcoholemia y cuándo se alcanza.
    *   Tiempo total estimado por encima del límite legal.
    *   Tiempo total estimado hasta que la alcoholemia vuelva cerca de cero.
*   **Unidades Configurables:** Cambia entre Tasa de Alcohol en Sangre (g/L) y Tasa de Alcohol en Aire Espirado (mg/L).
*   **Interfaz Moderna:** Construida con `shadcn/ui` y `Tailwind CSS` para una apariencia limpia y responsiva.
*   **Iconografía Clara:** Uso de `lucide-react` para iconos intuitivos.

## 🛠️ Stack Tecnológico

*   **Framework:** Next.js (App Router - `"use client"`)
*   **Lenguaje:** TypeScript
*   **Librería UI:** React
*   **Componentes UI:** `shadcn/ui`
*   **Estilos:** Tailwind CSS
*   **Gráficos:** `Recharts`
*   **Iconos:** `lucide-react`

## ⚙️ Cómo Funciona (Simplificado)

1.  **Recopilación de Datos:** Se toman el peso, sexo, y los detalles de cada bebida (cantidad, %, duración, inicio/espera).
2.  **Cálculo de Alcohol:** Para cada bebida, se calcula la masa total de etanol en gramos.
3.  **Factor de Distribución:** Se aplica el factor de Widmark (`r`) según el sexo para estimar el agua corporal total.
4.  **Simulación Temporal:**
    *   La simulación avanza en pasos de tiempo discretos (`SIMULATION_TIME_STEP`).
    *   En cada paso, se calcula cuánto alcohol se ha *absorbido* hasta ese momento, considerando la duración del consumo de cada bebida.
    *   Se calcula el BAC *potencial* basado en el alcohol absorbido y el agua corporal.
    *   Se calcula cuánto alcohol se ha *eliminado* hasta ese momento, asumiendo una tasa de eliminación constante (`ELIMINATION_RATE_PER_MINUTE`) que comienza aproximadamente a mitad de la absorción de cada bebida (esto es una simplificación).
    *   El BAC neto en cada paso es el BAC potencial menos el BAC eliminado.
5.  **Generación de Datos del Gráfico:** Los valores de BAC calculados en cada paso de tiempo forman los datos para el gráfico.
6.  **Cálculo de Métricas:** El pico, tiempo sobre el límite y tiempo hasta 0.00 se derivan de los datos generados para el gráfico.
7.  **Conversión de Unidades:** Los cálculos internos se hacen generalmente en g/L (sangre), y se convierten a mg/L (aire espirado) para visualización si es necesario, usando un ratio de partición sangre/aire (`BLOOD_BREATH_RATIO`).


## ⚠️ Descargo de Responsabilidad Importante

*   Esta calculadora utiliza la fórmula de Widmark y simula una tasa de eliminación de alcohol **PROMEDIO** (`0.15 g/L/h`).
*   El metabolismo **REAL** del alcohol varía **ENORMEMENTE** entre individuos y situaciones (genética, estado de salud, comida ingerida, medicación, hidratación, fatiga, etc.) y es **IMPREDECIBLE**.
*   Los resultados mostrados son **SÓLO UNA ESTIMACIÓN TEÓRICA** y **NO DEBEN** considerarse precisos para ninguna persona en particular.
*   **NO UTILICES ESTA HERRAMIENTA PARA DECIDIR SI PUEDES CONDUCIR O REALIZAR CUALQUIER ACTIVIDAD PELIGROSA.** La única tasa de alcoholemia segura para conducir es **0.0**. Siempre actúa con responsabilidad.
*   Consulta los límites legales específicos de tu región (Ej. España General: 0.5 g/L sangre | 0.25 mg/L aire; Novel/Profesional: 0.3 g/L | 0.15 mg/L).