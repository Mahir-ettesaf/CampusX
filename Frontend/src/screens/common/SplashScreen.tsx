import { View, Text } from "react-native";
import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { getStoredAuthSession } from "../../services/authservice";

export default function SplashScreen() {
  const navigation = useNavigation<any>();

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const session = await getStoredAuthSession();

        navigation.replace(
          session ? "Authenticated" : "Welcome",
          session ? { user: session.user } : undefined,
        );
      } catch {
        navigation.replace("Welcome");
      }
    };

    restoreSession();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Splash Screen</Text>
    </View>
  );
}
