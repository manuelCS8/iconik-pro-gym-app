import { useState, useRef, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';

export const useTabBarVisibility = () => {
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);
  const lastScrollY = useRef(0);
  const navigation = useNavigation();

  const handleScroll = useCallback((event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    
    // Determinar dirección del scroll
    if (currentScrollY > lastScrollY.current && isTabBarVisible) {
      // Scroll hacia abajo - ocultar barra
      setIsTabBarVisible(false);
    } else if (currentScrollY < lastScrollY.current && !isTabBarVisible) {
      // Scroll hacia arriba - mostrar barra
      setIsTabBarVisible(true);
    }
    
    lastScrollY.current = currentScrollY;
  }, [isTabBarVisible]);

  // Función para actualizar la visibilidad de la barra de navegación
  const updateTabBarVisibility = useCallback(() => {
    // @ts-ignore
    navigation.setOptions({
      tabBarStyle: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderTopWidth: 0,
        height: 54,
        paddingBottom: 8,
        paddingTop: 2,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        elevation: 0,
        shadowOpacity: 0,
        transform: [{ translateY: isTabBarVisible ? 0 : 100 }], // Ocultar/mostrar con animación
      },
    });
  }, [isTabBarVisible, navigation]);

  return {
    isTabBarVisible,
    handleScroll,
    updateTabBarVisibility,
  };
}; 