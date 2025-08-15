// src/utils/theme.ts - Colores y tamaños consistentes para Iconik Pro Gym
export const COLORS = {
  primary: "#E31C1F",   // rojo Iconik
  secondary: "#1F1F1F", // texto oscuro
  white: "#FFFFFF",
  background: "#F5F5F5",
  gray: "#666666",
  grayDark: "#333333",
  grayLight: "#CCCCCC",
  success: "#28A745",   // verde para "Principiante" o BMI "Normal"
  warning: "#FFC107",   // naranja para "Intermedio"
  danger: "#C82333",    // rojo oscuro para "Avanzado" o "Borrar"
  
  // Badges específicos (mantenemos compatibilidad)
  badgePrincipiante: "#28A745",  // Verde
  badgeIntermedio: "#FFC107",    // Naranja
  badgeAvanzado: "#C82333",      // Rojo oscuro
  badgeMusculo: "#E31C1F",       // Rojo puro para músculo principal
  badgeObjetivo: "#6C757D",      // Gris oscuro
  info: "#6C757D",               // Gris oscuro para Objetivo y botones Editar/Limpiar
};

export const SIZES = {
  fontSmall: 14,
  fontRegular: 16,
  fontMedium: 20,
  fontLarge: 24,
  fontTiny: 12,
  radius: 8,
  padding: 16,
  margin: 16,
  
  // Tamaños adicionales para compatibilidad
  paddingSmall: 8,
  paddingLarge: 24,
  radiusSmall: 4,
  radiusLarge: 12,
};

// ✅ Estilos globales consistentes
export const GLOBAL_STYLES = {
  container: {
    flex: 1,
    backgroundColor: "#F2F2F2", // gris muy claro
    padding: SIZES.padding,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.margin,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
};

// ✅ Helper functions para colores de badges
export const getBadgeColor = {
  // Colores por dificultad según PDF
  difficulty: (level: string): string => {
    switch (level.toLowerCase()) {
      case 'principiante':
        return COLORS.badgePrincipiante; // Verde #28A745
      case 'intermedio':
        return COLORS.badgeIntermedio;   // Naranja #FFC107
      case 'avanzado':
        return COLORS.badgeAvanzado;     // Rojo oscuro #C82333
      default:
        return COLORS.badgeObjetivo;     // Gris oscuro por defecto
    }
  },
  
  // Color para músculo principal (siempre rojo puro)
  muscle: (): string => COLORS.badgeMusculo, // Rojo puro #E31C1F
  
  // Color para objetivo (siempre gris oscuro)
  objective: (): string => COLORS.badgeObjetivo, // Gris oscuro #6C757D
};

// ✅ Helper para estilos de badges consistentes
export const getBadgeStyle = (type: 'difficulty' | 'muscle' | 'objective', value?: string) => ({
  backgroundColor: type === 'difficulty' && value 
    ? getBadgeColor.difficulty(value)
    : type === 'muscle' 
      ? getBadgeColor.muscle()
      : getBadgeColor.objective(),
  paddingHorizontal: SIZES.paddingSmall,
  paddingVertical: 4,
  borderRadius: SIZES.radiusSmall,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
});

export const getBadgeTextStyle = () => ({
  fontSize: SIZES.fontTiny,  // ✅ 12pts - tamaño original
  color: COLORS.white,
  fontWeight: 'bold' as const,
}); 