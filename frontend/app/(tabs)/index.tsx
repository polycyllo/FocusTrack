import { Redirect } from "expo-router";
import PomodoroConfigForm from './Pomodoro/PomodoroConfigForm';

export default function TabsIndexRedirect() {
  return <Redirect href="/subjects" />;
}

export  function TabOneScreen() {
  return <PomodoroConfigForm />;
}
