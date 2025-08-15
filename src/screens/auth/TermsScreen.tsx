import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS, SIZES, GLOBAL_STYLES } from "../../utils/theme";

const TermsScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Términos y Condiciones</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Términos y Condiciones de Uso de la App "Iconik Pro GYM"</Text>
          <Text style={styles.lastUpdated}>Última actualización: 23 de mayo de 2025</Text>
          
          <Text style={styles.sectionTitle}>1. Aceptación de los términos</Text>
          <Text style={styles.paragraph}>
            Al descargar, registrarse o usar la aplicación móvil "Iconik Pro GYM" (en adelante, "la App"), y al contratar o ser miembro del gimnasio Iconik Pro GYM (en adelante, "el Gimnasio"), usted acepta sin reservas estos Términos y Condiciones. Si no está de acuerdo, no utilice la App ni disfrute de los servicios del Gimnasio.
          </Text>

          <Text style={styles.sectionTitle}>2. Objeto de la App</Text>
          <Text style={styles.paragraph}>
            Iconik Pro GYM es una aplicación destinada al registro y seguimiento de ejercicios físicos —series, repeticiones, pesos, tiempos y progresos, así como al acceso a rutinas, estadísticas y planes personalizados proporcionados por el Gimnasio.
          </Text>

          <Text style={styles.sectionTitle}>3. Requisitos y elegibilidad</Text>
          <Text style={styles.subSectionTitle}>Membresía del Gimnasio</Text>
          <Text style={styles.paragraph}>
            • Solo los usuarios activos como miembros del Gimnasio podrán crear o mantener una cuenta en la App.{'\n'}
            • La baja o suspensión de la membresía dará lugar a la desactivación inmediata de su acceso a la App.
          </Text>
          <Text style={styles.subSectionTitle}>Edad mínima</Text>
          <Text style={styles.paragraph}>
            • Debe ser mayor de 15 años en adelante.
          </Text>

          <Text style={styles.sectionTitle}>4. Registro de usuario</Text>
          <Text style={styles.paragraph}>
            Para registrarse en la App deberá proporcionar datos verídicos (nombre, correo electrónico válido, contraseña, y demás información solicitada).{'\n'}
            Es su responsabilidad mantener actualizada esta información y custodiar la confidencialidad de sus credenciales.
          </Text>

          <Text style={styles.sectionTitle}>5. Acceso y revocación</Text>
          <Text style={styles.subSectionTitle}>Acceso continuo</Text>
          <Text style={styles.paragraph}>
            Mientras mantenga su membresía activa en el Gimnasio, podrá acceder a todas las funciones de la App según el plan contratado.
          </Text>
          <Text style={styles.subSectionTitle}>Suspensión de acceso</Text>
          <Text style={styles.paragraph}>
            Si su membresía expira, se cancela o queda suspendida (por impago, incumplimiento de normas del Gimnasio u otras causas), su cuenta en la App se desactivará automáticamente hasta regularizar su situación.
          </Text>

          <Text style={styles.sectionTitle}>6. Licencia de uso</Text>
          <Text style={styles.paragraph}>
            Iconik Pro GYM le otorga una licencia limitada, personal, intransferible y revocable para usar la App conforme a estos Términos. Queda prohibido descompilar, distribuir, revender o explotar la App sin autorización expresa por escrito.
          </Text>

          <Text style={styles.sectionTitle}>7. Contenido y responsabilidad del usuario</Text>
          <Text style={styles.paragraph}>
            • Usted es responsable de los datos que registre (rutinas, pesos, estadísticas).{'\n'}
            • Se compromete a no subir contenidos ilegales, ofensivos o que vulneren derechos de terceros.{'\n'}
            • El Gimnasio podrá eliminar o editar cualquier contenido que considere inapropiado.
          </Text>

          <Text style={styles.sectionTitle}>8. Propiedad intelectual</Text>
          <Text style={styles.paragraph}>
            Todos los derechos de la App, su código, marcas ("Iconik Pro GYM"), diseños y contenidos son propiedad de Iconik Pro GYM o sus licenciantes. Queda prohibida cualquier reproducción sin autorización.
          </Text>

          <Text style={styles.sectionTitle}>9. Política de privacidad y datos personales</Text>
          <Text style={styles.paragraph}>
            El tratamiento de sus datos se regirá por la Política de Privacidad de Iconik Pro GYM, disponible en la App y en nuestro sitio web. Al aceptar estos Términos, también acepta el uso de sus datos para mejorar servicios, enviar comunicaciones y estadísticas de entrenamiento.
          </Text>

          <Text style={styles.sectionTitle}>10. Descargo de responsabilidad</Text>
          <Text style={styles.paragraph}>
            • La App proporciona información y herramientas de seguimiento, pero no sustituye el asesoramiento médico ni personal trainer.{'\n'}
            • El Gimnasio no se responsabiliza de lesiones o daños derivados del uso inadecuado de rutinas o equipo.
          </Text>

          <Text style={styles.sectionTitle}>11. Limitación de responsabilidad</Text>
          <Text style={styles.paragraph}>
            En ningún caso Iconik Pro GYM ni sus directivos, empleados o colaboradores serán responsables por daños indirectos, lucro cesante o pérdidas de datos derivados del uso de la App.
          </Text>

          <Text style={styles.sectionTitle}>12. Modificaciones</Text>
          <Text style={styles.paragraph}>
            Iconik Pro GYM se reserva el derecho a modificar estos Términos y Condiciones en cualquier momento. Las actualizaciones se publicarán en la App; su uso continuado implica la aceptación de los cambios.
          </Text>

          <Text style={styles.sectionTitle}>13. Ley aplicable y jurisdicción</Text>
          <Text style={styles.paragraph}>
            Estos Términos se rigen por las leyes de México. Cualquier disputa será sometida a los tribunales competentes de la Ciudad de México.
          </Text>

          <Text style={styles.sectionTitle}>Contacto:</Text>
          <Text style={styles.paragraph}>
            Para dudas o reclamaciones, escríbenos a soporte@iconikprogym.com{'\n'}
            © 2025 Iconik Pro GYM.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.acceptButton} 
          onPress={() => {
            navigation.navigate("SignUp" as never, { termsAccepted: true } as never);
          }}
        >
          <Text style={styles.acceptButtonText}>He Leído y Acepto los Términos</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default TermsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F2", // Consistent with global styles
  },
  header: {
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.padding,
    paddingHorizontal: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: SIZES.margin,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: SIZES.fontRegular,
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: SIZES.fontMedium,
    fontWeight: "bold",
    color: COLORS.secondary,
    flex: 1,
    textAlign: "center",
    marginRight: SIZES.padding * 2, // Para centrar considerando el botón
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SIZES.padding,
  },
  title: {
    fontSize: SIZES.fontLarge,
    fontWeight: "bold",
    color: COLORS.secondary,
    textAlign: "center",
    marginBottom: SIZES.margin,
    lineHeight: SIZES.fontLarge * 1.2,
  },
  sectionTitle: {
    fontSize: SIZES.fontMedium,
    fontWeight: "bold",
    color: COLORS.primary,
    marginTop: SIZES.margin * 1.5,
    marginBottom: SIZES.margin / 2,
  },
  subSectionTitle: {
    fontSize: SIZES.fontRegular,
    fontWeight: "bold",
    color: COLORS.secondary,
    marginTop: SIZES.margin,
    marginBottom: SIZES.margin / 2,
  },
  paragraph: {
    fontSize: SIZES.fontRegular,
    color: COLORS.grayDark,
    lineHeight: SIZES.fontRegular * 1.5,
    marginBottom: SIZES.margin,
    textAlign: "justify",
  },
  lastUpdated: {
    fontSize: SIZES.fontSmall,
    color: COLORS.gray,
    textAlign: "center",
    marginBottom: SIZES.margin * 2,
    fontStyle: "italic",
  },
  footer: {
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
  },
  acceptButton: {
    backgroundColor: COLORS.primary,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  acceptButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontRegular,
    fontWeight: "bold",
  },
}); 