import React, { createContext, useContext, useState } from "react";

interface TabBarContextType {
  tabBarVisible: boolean;
  setTabBarVisible: (visible: boolean) => void;
}

const TabBarContext = createContext<TabBarContextType | undefined>(undefined);

export function TabBarProvider({ children }: { children: React.ReactNode }) {
  const [tabBarVisible, setTabBarVisible] = useState(true);

  return (
    <TabBarContext.Provider value={{ tabBarVisible, setTabBarVisible }}>
      {children}
    </TabBarContext.Provider>
  );
}

export function useTabBarVisibility() {
  const context = useContext(TabBarContext);
  if (!context) {
    throw new Error(
      "useTabBarVisibility must be used within TabBarProvider"
    );
  }
  return context;
}
