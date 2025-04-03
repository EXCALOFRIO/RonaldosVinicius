import type React from 'react';

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
    // No se necesitan props personalizadas adicionales por ahora
    // El valor se accederá a través de event.target.value (string)
}

// Este componente estiliza el <input type="range"> nativo de HTML
// Estilizar inputs de rango consistentemente entre navegadores es complicado.
// Esto proporciona estilos básicos usando Tailwind y variables CSS.
export function Slider({ className, value, ...props }: SliderProps) {
    // Asegura que el valor sea compatible si viene como array (aunque el input nativo usa un solo valor)
    // Es importante notar que un <input type="range"> nativo solo acepta un `value` numérico o string convertible a número.
    // Si recibes un array, probablemente sea un error conceptual o una adaptación de otra librería.
    // Para un input nativo, siempre deberías usar un solo valor.
    const displayValue = Array.isArray(value) ? value[0] : value;

    // *** NO HAY CAMBIOS ESTRUCTURALES AQUÍ ***
    // El componente ya está diseñado para pasar `onChange` si se le proporciona a través de `...props`.
    return (
        <input
            type="range"
            value={displayValue ?? ''} // Usa el valor proporcionado. Añadimos `?? ''` por si acaso es undefined/null inicialmente.
            className={`
                w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer
                focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:w-5
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-primary
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:transition-colors
                [&::-webkit-slider-thumb]:focus:ring-2
                [&::-webkit-slider-thumb]:focus:ring-ring
                [&::-moz-range-thumb]:h-5
                [&::-moz-range-thumb]:w-5
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-primary
                [&::-moz-range-thumb]:border-none
                [&::-moz-range-thumb]:cursor-pointer
                [&::-moz-range-thumb]:transition-colors
                [&::-moz-range-thumb]:focus:ring-2
                [&::-moz-range-thumb]:focus:ring-ring
                ${className ?? ''}
            `}
            {...props} // <-- Aquí se pasan TODAS las demás props, incluyendo `onChange`, `readOnly`, `disabled`, `min`, `max`, `step`, etc.
        />
    );
}