import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SessionProvider } from "@/auth/SessionContext";
import { DialogProvider } from "@/components/dialog";
import { BadgesProvider } from "@/hooks/useBadges";
import { navigationRef } from "@/navigation/ref";
import { RootNavigator } from "@/navigation/RootNavigator";

export default function App(): JSX.Element {
  return (
    <SafeAreaProvider>
      <DialogProvider>
        <SessionProvider>
          <BadgesProvider>
            {/* navigationRef lets real-time alerts jump to the matching
                order/booking detail screen from outside any component. */}
            <NavigationContainer ref={navigationRef}>
              <StatusBar style="auto" />
              <RootNavigator />
            </NavigationContainer>
          </BadgesProvider>
        </SessionProvider>
      </DialogProvider>
    </SafeAreaProvider>
  );
}
