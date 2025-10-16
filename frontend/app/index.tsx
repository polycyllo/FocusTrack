import { Redirect } from 'expo-router';

export default function Index() {
  // Punto de entrada de la aplicación
  // TODO: Aquí puedes verificar si hay sesión activa y redirigir a /subjects
  return <Redirect href="/landing" />;
}